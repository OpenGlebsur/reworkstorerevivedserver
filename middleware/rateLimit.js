'use strict';


var rateLimit = require('express-rate-limit');

var globalLimiter = rateLimit({
  windowMs       : 60 * 1000,   
  max            : 300,
  standardHeaders: true,
  legacyHeaders  : false,
  message        : { error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' }
});

var authLimiter = rateLimit({
  windowMs       : 15 * 60 * 1000,   
  max            : 10,
  standardHeaders: true,
  legacyHeaders  : false,
  message        : {
    error: 'Too many login attempts. Please try again in 15 minutes.',
    code : 'RATE_LIMITED'
  }
});

var apiLimiter = rateLimit({
  windowMs       : 60 * 1000,   
  max            : 120,
  standardHeaders: true,
  legacyHeaders  : false,
  message        : { error: 'Too many API requests.', code: 'RATE_LIMITED' }
});

module.exports = {
  globalLimiter: globalLimiter,
  authLimiter  : authLimiter,
  apiLimiter   : apiLimiter
};
