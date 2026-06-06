'use strict';


var express      = require('express');
var sessionStore = require('../src/sessionStore');
var wixApi       = require('../src/wixApi');
var authMW       = require('../middleware/auth');

var router = express.Router();


router.post('/login', async function(req, res) {
  var email    = (req.body.email    || '').trim().toLowerCase();
  var password = (req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
      code : 'MISSING_FIELDS'
    });
  }


  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.', code: 'INVALID_EMAIL' });
  }

  try {
    var member  = await wixApi.wixLogin(email, password);
    var session = sessionStore.createSession(member.userId, member.email, member.nickname);

    console.log('[AUTH] Login OK:', member.email);
    return res.status(200).json({
      token    : session.token,
      userId   : member.userId,
      email    : member.email,
      nickname : member.nickname,
      expiresAt: new Date(session.expiresAt).toISOString(),
      message  : 'Login successful'
    });
  } catch (err) {
    console.warn('[AUTH] Login failed:', email, '–', err.message);
    return res.status(401).json({
      error: err.message || 'Login failed.',
      code : 'AUTH_FAILED'
    });
  }
});


router.post('/register', async function(req, res) {
  var email    = (req.body.email    || '').trim().toLowerCase();
  var password = (req.body.password || '');
  var nickname = (req.body.nickname || '').trim();

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
      code : 'MISSING_FIELDS'
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.', code: 'INVALID_EMAIL' });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters.',
      code : 'WEAK_PASSWORD'
    });
  }

  try {
    var member  = await wixApi.wixRegister(email, password, nickname);
    var session = sessionStore.createSession(member.userId, member.email, member.nickname);

    console.log('[AUTH] Register OK:', member.email);
    return res.status(201).json({
      token    : session.token,
      userId   : member.userId,
      email    : member.email,
      nickname : member.nickname,
      expiresAt: new Date(session.expiresAt).toISOString(),
      message  : 'Account created successfully'
    });
  } catch (err) {
    console.warn('[AUTH] Register failed:', email, '–', err.message);
    return res.status(400).json({
      error: err.message || 'Registration failed.',
      code : 'REGISTER_FAILED'
    });
  }
});


router.post('/logout', authMW.requireAuth, function(req, res) {
  var token = req.headers['x-rw-token'] || req.query.token;
  sessionStore.deleteSession(token);
  console.log('[AUTH] Logout:', req.session.email);
  return res.status(200).json({ message: 'Logged out successfully.' });
});


router.post('/refresh', authMW.requireAuth, function(req, res) {
  var token   = req.headers['x-rw-token'] || req.query.token;
  var session = sessionStore.refreshSession(token);

  if (!session) {
    return res.status(401).json({
      error: 'Session expired. Please log in again.',
      code : 'SESSION_EXPIRED'
    });
  }

  console.log('[AUTH] Token refreshed:', session.email);
  return res.status(200).json({
    token    : token,
    expiresAt: new Date(session.expiresAt).toISOString(),
    message  : 'Session refreshed successfully'
  });
});


router.get('/verify', authMW.requireAuth, function(req, res) {
  var s = req.session;
  return res.status(200).json({
    valid    : true,
    userId   : s.userId,
    email    : s.email,
    nickname : s.nickname,
    expiresAt: new Date(s.expiresAt).toISOString()
  });
});

module.exports = router;
