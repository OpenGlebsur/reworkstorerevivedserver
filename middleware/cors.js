'use strict';

var cors   = require('cors');
var config = require('../config/server.config');

var corsOptions = {
  origin: function(origin, callback) {

    if (!origin) {
      return callback(null, true);
    }
    if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS: origin not permitted – ' + origin));
  },

  methods             : ['GET', 'POST', 'OPTIONS'],
  allowedHeaders      : ['Content-Type', 'Authorization', 'X-Rw-Token'],
  exposedHeaders      : ['X-Rw-Token', 'X-Server-Version'],
  credentials         : true,
  optionsSuccessStatus: 200   
};

module.exports = cors(corsOptions);
