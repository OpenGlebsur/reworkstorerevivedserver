'use strict';


var express   = require('express');
var path      = require('path');
var fileCache = require('../src/fileCache');
var authMW    = require('../middleware/auth');
var config    = require('../config/server.config');

var router = express.Router();


function sendJson(filePath, res) {
  try {
    var raw = fileCache.readJson(filePath);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');   
    return res.status(200).send(raw);
  } catch (err) {
    if (err.message && err.message.indexOf('FILE_NOT_FOUND') === 0) {
      return res.status(404).json({ error: 'Resource not found.', code: 'NOT_FOUND' });
    }
    if (err.message && err.message.indexOf('INVALID_JSON') === 0) {
      console.error('[STORE]', err.message);
      return res.status(500).json({ error: 'Server data error.', code: 'DATA_ERROR' });
    }
    console.error('[STORE] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Internal server error.', code: 'SERVER_ERROR' });
  }
}


router.get('/themes', function(req, res) {
  sendJson(path.join(config.DATA_DIR, 'themes.json'), res);
});


router.get('/dependencies', function(req, res) {
  sendJson(path.join(config.DATA_DIR, 'dependencies.json'), res);
});


router.get('/dependencies/:name', function(req, res) {
  var raw     = req.params.name;
  var cleaned = raw.replace(/[^a-zA-Z0-9\-\_\.]/g, '');
  if (!cleaned) return res.status(400).json({ error: 'Invalid dependency name.', code: 'BAD_REQUEST' });
  sendJson(path.join(config.DEPS_DIR, cleaned + '.json'), res);
});




router.get('/mainpage', authMW.requireAuth, function(req, res) {
  sendJson(path.join(config.DATA_DIR, 'mainPage.json'), res);
});


router.get('/apps', authMW.requireAuth, function(req, res) {
  sendJson(path.join(config.DATA_DIR, 'AllApps.json'), res);
});


router.get('/apps/:name', authMW.requireAuth, function(req, res) {
  var raw     = req.params.name;

  var base    = raw.replace(/\.json$/i, '');
  var cleaned = base.replace(/[^a-zA-Z0-9\-\+\.\&\_]/g, '');

  if (!cleaned) {
    return res.status(400).json({ error: 'Invalid app name.', code: 'BAD_REQUEST' });
  }

  sendJson(path.join(config.APPS_DIR, cleaned + '.json'), res);
});


router.get('/search', authMW.requireAuth, function(req, res) {
  var q = (req.query.q || '').trim().toLowerCase();

  if (!q || q.length < 2) {
    return res.status(400).json({
      error  : 'Search query must be at least 2 characters.',
      code   : 'BAD_REQUEST',
      results: []
    });
  }

  var raw;
  try {
    raw = fileCache.readJson(path.join(config.DATA_DIR, 'AllApps.json'));
  } catch (err) {
    return res.status(500).json({ error: 'Catalog unavailable.', code: 'DATA_ERROR' });
  }

  var catalog;
  try { catalog = JSON.parse(raw); } catch (e) {
    return res.status(500).json({ error: 'Catalog parse error.', code: 'DATA_ERROR' });
  }


  var appList = [];
  try {
    var groups = catalog.rework_core_system.content_registry.deployment_groups;
    Object.keys(groups).forEach(function(groupKey) {
      var payload = groups[groupKey].payload || [];
      payload.forEach(function(item) {
        if (item && item.label) appList.push(item);
      });
    });
  } catch (e) {

    return res.status(200).json({ query: q, results: [] });
  }

  var results = appList.filter(function(app) {
    return app.label && app.label.toLowerCase().indexOf(q) !== -1;
  });

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    query  : q,
    count  : results.length,
    results: results
  });
});

module.exports = router;
