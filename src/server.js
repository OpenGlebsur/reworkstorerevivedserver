
'use strict';

var https   = require('https');
var http    = require('http');
var express = require('express');
var fs      = require('fs');
var path    = require('path');

var config       = require('../config/server.config');
var corsMiddleware   = require('../middleware/cors');
var securityMiddleware = require('../middleware/security');
var { authLimiter, apiLimiter, globalLimiter } = require('../middleware/rateLimit');

var authRoutes   = require('../routes/auth.routes');
var storeRoutes  = require('../routes/store.routes');
var adminRoutes  = require('../routes/admin.routes');
var healthRoutes = require('../routes/health.routes');


var app = express();


app.set('trust proxy', 1);


app.use(securityMiddleware);
app.use(corsMiddleware);


app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '32kb' }));


app.use(globalLimiter);


app.use(function(req, res, next) {
  res.setHeader('X-Powered-By', config.SERVER_NAME);
  res.setHeader('X-Server-Version', config.VERSION);
  next();
});


app.use(function(req, res, next) {
  var start = Date.now();
  res.on('finish', function() {
    var ms = Date.now() - start;
    console.log(
      '[' + new Date().toISOString() + '] ' +
      req.method + ' ' + req.originalUrl +
      ' → ' + res.statusCode + ' (' + ms + 'ms)'
    );
  });
  next();
});


app.use('/health',     healthRoutes);
app.use('/ping',       healthRoutes);
app.use('/status',     healthRoutes);
app.use('/api/auth',   authLimiter, authRoutes);
app.use('/api/store',  apiLimiter,  storeRoutes);
app.use('/api/admin',  apiLimiter,  adminRoutes);


app.use(function(req, res) {
  res.status(404).json({
    error  : 'Endpoint not found',
    code   : 'NOT_FOUND',
    path   : req.path,
    server : config.SERVER_NAME
  });
});


app.use(function(err, req, res, next) {
  console.error('[ERROR]', err.message);

  if (err.message && err.message.indexOf('CORS') === 0) {
    return res.status(403).json({ error: err.message, code: 'CORS_BLOCKED' });
  }
  res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
});


function startServer() {
  var tlsOptions = null;

  try {
    tlsOptions = {
      key : fs.readFileSync(config.TLS.KEY),
      cert: fs.readFileSync(config.TLS.CERT)
    };
    if (fs.existsSync(config.TLS.CA)) {
      tlsOptions.ca = fs.readFileSync(config.TLS.CA);
    }
  } catch (e) {
    console.warn('[WARN] TLS certificates not found in ./ssl/');
    console.warn('       → ' + config.TLS.KEY);
    console.warn('       → ' + config.TLS.CERT);
    console.warn('[INFO] Starting in HTTP dev-mode on port ' + config.PORT_DEV);
    console.warn('[INFO] Run scripts/generate-self-signed.sh to create a local cert.');

    app.listen(config.PORT_DEV, function() {
      console.log('[INFO] DEV server  → http://localhost:' + config.PORT_DEV);
      printRoutes();
    });
    return;
  }


  https.createServer(tlsOptions, app).listen(config.PORT_HTTPS, function() {
    console.log('[INFO] HTTPS MasterServer  → https://reworkw8.github.io/RwStoreMasterServer/:' + config.PORT_HTTPS);
    printRoutes();
  });


  http.createServer(function(req, res) {
    var host = (req.headers.host || 'localhost').replace(/:\d+$/, '');
    res.writeHead(301, { 'Location': 'https://' + host + req.url });
    res.end();
  }).listen(config.PORT_HTTP, function() {
    console.log('[INFO] HTTP redirect server → http://reworkw8.github.io/RwStoreMasterServer/:' + config.PORT_HTTP + ' (→ 443)');
  });
}

function printRoutes() {
  console.log('');
  console.log('  ── Health ──────────────────────────────────────');
  console.log('    GET  /health');
  console.log('    GET  /ping');
  console.log('    GET  /status');
  console.log('');
  console.log('  ── Auth (Wix backend) ──────────────────────────');
  console.log('    POST /api/auth/login');
  console.log('    POST /api/auth/register');
  console.log('    POST /api/auth/logout         (X-Rw-Token required)');
  console.log('    GET  /api/auth/verify         (X-Rw-Token required)');
  console.log('    POST /api/auth/refresh        (X-Rw-Token required)');
  console.log('');
  console.log('  ── Store (catalog) ─────────────────────────────');
  console.log('    GET  /api/store/mainpage      (auth required)');
  console.log('    GET  /api/store/apps          (auth required)');
  console.log('    GET  /api/store/apps/:name    (auth required)');
  console.log('    GET  /api/store/themes        (public)');
  console.log('    GET  /api/store/dependencies  (public)');
  console.log('    GET  /api/store/search?q=     (auth required)');
  console.log('');
  console.log('  ── Admin ───────────────────────────────────────');
  console.log('    GET  /api/admin/sessions      (admin token required)');
  console.log('    POST /api/admin/cache/flush   (admin token required)');
  console.log('    GET  /api/admin/metrics       (admin token required)');
  console.log('');
  console.log('  Environment variables:');
  console.log('    WIX_API_KEY   – Wix site API key');
  console.log('    WIX_SITE_ID   – Wix site ID');
  console.log('    ADMIN_TOKEN   – Secret token for /api/admin/* routes');
  console.log('');
}

startServer();
