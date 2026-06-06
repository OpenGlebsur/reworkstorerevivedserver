'use strict';


var express      = require('express');
var sessionStore = require('../src/sessionStore');
var config       = require('../config/server.config');

var router = express.Router();

function healthHandler(req, res) {
  var stats  = sessionStore.getStats();
  var mem    = process.memoryUsage();
  var uptime = process.uptime();

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    status        : 'operational',
    server        : config.SERVER_NAME,
    version       : config.VERSION,
    timestamp     : new Date().toISOString(),
    uptime_seconds: Math.floor(uptime),
    activeSessions: stats.active,
    memory        : {
      heapUsed : Math.round(mem.heapUsed  / 1048576) + ' MB',
      heapTotal: Math.round(mem.heapTotal / 1048576) + ' MB'
    }
  });
}

router.get('/', healthHandler);
router.get('/health', healthHandler);
router.get('/status', healthHandler);


router.get('/ping', function(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    pong     : true,
    server   : config.SERVER_NAME,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
