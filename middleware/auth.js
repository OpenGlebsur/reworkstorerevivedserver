'use strict';

var sessionStore = require('../src/sessionStore');
var config       = require('../config/server.config');


function requireAuth(req, res, next) {
  var token = req.headers['x-rw-token'] || req.query.token;

  if (!token) {
    return res.status(401).json({
      error : 'Authentication required. Send your session token in the X-Rw-Token header.',
      code  : 'NO_TOKEN'
    });
  }

  var session = sessionStore.getSession(token);

  if (!session) {
    return res.status(401).json({
      error : 'Session expired or invalid. Please log in again.',
      code  : 'INVALID_TOKEN'
    });
  }

  req.session = session;
  next();
}

function requireAdmin(req, res, next) {
  if (!config.ADMIN_TOKEN) {
    return res.status(503).json({
      error : 'Admin endpoints are disabled. Set the ADMIN_TOKEN environment variable.',
      code  : 'ADMIN_DISABLED'
    });
  }

  var auth  = req.headers['authorization'] || '';
  var parts = auth.split(' ');

  if (parts[0] !== 'Bearer' || parts[1] !== config.ADMIN_TOKEN) {
    return res.status(403).json({
      error : 'Admin access denied.',
      code  : 'ADMIN_FORBIDDEN'
    });
  }

  next();
}

module.exports = { requireAuth: requireAuth, requireAdmin: requireAdmin };
