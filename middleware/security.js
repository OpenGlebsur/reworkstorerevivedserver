'use strict';


var helmet = require('helmet');

module.exports = helmet({
  contentSecurityPolicy: false,   
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  hsts: {
    maxAge           : 31536000,
    includeSubDomains: false,
    preload          : false
  },
  referrerPolicy: { policy: 'no-referrer' },
  frameguard    : { action: 'sameorigin' },
  noSniff       : true,
  xssFilter     : true
});
