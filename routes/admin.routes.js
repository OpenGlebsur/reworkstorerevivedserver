'use strict';


var express      = require('express');
var authMW       = require('../middleware/auth');
var sessionStore = require('../src/sessionStore');
var fileCache    = require('../src/fileCache');
var config       = require('../config/server.config');

var router = express.Router();


router.use(authMW.requireAdmin);


router.get('/sessions', function(req, res) {
  var stats = sessionStore.getStats();
  return res.status(200).json({
    server     : config.SERVER_NAME,
    timestamp  : new Date().toISOString(),
    sessions   : stats
  });
});


router.post('/cache/flush', function(req, res) {
  fileCache.flushCache();
  console.log('[ADMIN] Cache flushed by admin.');
  return res.status(200).json({ message: 'File cache flushed successfully.' });
});


router.get('/metrics', function(req, res) {
  var mem    = process.memoryUsage();
  var uptime = process.uptime();

  return res.status(200).json({
    server   : config.SERVER_NAME,
    timestamp: new Date().toISOString(),
    uptime   : {
      seconds: Math.floor(uptime),
      human  : formatUptime(uptime)
    },
    memory: {
      rss        : formatBytes(mem.rss),
      heapTotal  : formatBytes(mem.heapTotal),
      heapUsed   : formatBytes(mem.heapUsed),
      external   : formatBytes(mem.external)
    },
    sessions : sessionStore.getStats(),
    cache    : { entries: fileCache.cacheSize() },
    node     : process.version,
    platform : process.platform
  });
});


function formatBytes(b) {
  if (b < 1024)       return b + ' B';
  if (b < 1048576)    return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function formatUptime(s) {
  var days  = Math.floor(s / 86400);
  var hours = Math.floor((s % 86400) / 3600);
  var mins  = Math.floor((s % 3600) / 60);
  var secs  = Math.floor(s % 60);
  return days + 'd ' + hours + 'h ' + mins + 'm ' + secs + 's';
}

module.exports = router;
