'use strict';


var fs     = require('fs');
var config = require('../config/server.config');

var cache = {};   


function readJson(filePath) {
  var entry   = cache[filePath];
  var now     = Date.now();

  if (entry && (now - entry.cachedAt) < config.CACHE_TTL_MS) {
    return entry.data;
  }


  var raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    throw new Error('FILE_NOT_FOUND:' + filePath);
  }


  try {
    JSON.parse(raw);
  } catch (e) {
    throw new Error('INVALID_JSON:' + filePath + ' – ' + e.message);
  }

  cache[filePath] = { data: raw, cachedAt: now };
  return raw;
}


function flushCache() {
  cache = {};
}


function cacheSize() {
  return Object.keys(cache).length;
}

module.exports = { readJson: readJson, flushCache: flushCache, cacheSize: cacheSize };
