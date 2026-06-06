'use strict';


var path = require('path');

module.exports = {


  SERVER_NAME : 'RwStoreMasterServer/3.0.0',
  VERSION     : '3.0.0',


  PORT_HTTPS : 443,
  PORT_HTTP  : 80,
  PORT_DEV   : 3000,   

  TLS: {
    KEY  : path.join(__dirname, '..', 'ssl', 'private.key'),
    CERT : path.join(__dirname, '..', 'ssl', 'certificate.crt'),
    CA   : path.join(__dirname, '..', 'ssl', 'ca_bundle.crt')   
  },

  ADMIN_TOKEN : process.env.ADMIN_TOKEN || '',


  SESSION_TTL : 24 * 60 * 60 * 1000,   


  ALLOWED_ORIGINS: [
    'https://reworkw8.github.io',
	'https://reworkw8.github.io/RwStoreMasterServer',
    'https://reworkw8.wixsite.com',
    'https://reworkw8.wixsite.com/rework'
  ],


  DATA_DIR  : path.join(__dirname, '..', 'data'),
  APPS_DIR  : path.join(__dirname, '..', 'data', 'apps'),
  APPXS_DIR  : path.join(__dirname, '..', 'data', 'appxs'),
  DEPS_DIR  : path.join(__dirname, '..', 'data', 'dependencies'),
  IMAGES_DIR  : path.join(__dirname, '..', 'data', 'images'),
  THEMES_DIR  : path.join(__dirname, '..', 'data', 'themes'),

  CACHE_TTL_MS : 5 * 60 * 1000   
};
