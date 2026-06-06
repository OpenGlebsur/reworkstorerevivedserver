'use strict';


var fetch  = require('node-fetch');
var config = require('../config/server.config');

function checkEnv() {
  if (!config.WIX_API_KEY || !config.WIX_SITE_ID) {
    throw new Error(
      'WIX_API_KEY and WIX_SITE_ID must be set as environment variables. ' +
      'See the Debug Console for instructions.'
    );
  }
}

function wixHeaders() {
  return {
    'Content-Type' : 'application/json',
    'Authorization': config.WIX_API_KEY,
    'wix-site-id'  : config.WIX_SITE_ID
  };
}


async function wixLogin(email, password) {
  checkEnv();

  var response = await fetch(config.WIX_API_BASE + '/members/login', {
    method  : 'POST',
    headers : wixHeaders(),
    body    : JSON.stringify({ email: email, password: password })
  });

  var data = await response.json();

  if (!response.ok) {
    var msg = (data && data.message) ? data.message : 'Invalid credentials';
    throw new Error(msg);
  }

  var member = data.member || data;
  return {
    userId  : member.id,
    email   : member.loginEmail || email,
    nickname: (member.profile && member.profile.nickname)
                ? member.profile.nickname
                : email.split('@')[0]
  };
}


async function wixRegister(email, password, nickname) {
  checkEnv();

  var response = await fetch(config.WIX_API_BASE + '/members', {
    method  : 'POST',
    headers : wixHeaders(),
    body    : JSON.stringify({
      member: {
        loginEmail: email,
        contact   : { firstName: nickname || email.split('@')[0] }
      },
      password: password
    })
  });

  var data = await response.json();

  if (!response.ok) {
    var msg = (data && data.message) ? data.message : 'Registration failed';
    throw new Error(msg);
  }

  var member = data.member || data;
  return {
    userId  : member.id,
    email   : member.loginEmail || email,
    nickname: nickname || email.split('@')[0]
  };
}

module.exports = { wixLogin: wixLogin, wixRegister: wixRegister };
