'use strict';


var crypto = require('crypto');
var config = require('../config/server.config');


var sessions = new Map();


function createSession(userId, email, nickname) {
  var token     = crypto.randomBytes(32).toString('hex');
  var now       = Date.now();
  var expiresAt = now + config.SESSION_TTL;

  sessions.set(token, {
    userId   : userId,
    email    : email,
    nickname : nickname || email.split('@')[0],
    createdAt: now,
    expiresAt: expiresAt
  });

  return { token: token, expiresAt: expiresAt };
}


function getSession(token) {
  if (!token) return null;
  var session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}


function deleteSession(token) {
  sessions.delete(token);
}


function refreshSession(token) {
  var session = getSession(token);
  if (!session) return null;
  session.expiresAt = Date.now() + config.SESSION_TTL;
  sessions.set(token, session);
  return session;
}


function getStats() {
  var now    = Date.now();
  var active = 0;
  sessions.forEach(function(s) { if (now <= s.expiresAt) active++; });
  return { total: sessions.size, active: active };
}


setInterval(function() {
  var now = Date.now();
  sessions.forEach(function(session, token) {
    if (now > session.expiresAt) sessions.delete(token);
  });
}, 30 * 60 * 1000);

module.exports = {
  createSession  : createSession,
  getSession     : getSession,
  deleteSession  : deleteSession,
  refreshSession : refreshSession,
  getStats       : getStats
};
