'use strict';

module.exports = {
  extends: require('./extends')('eslint-config-godaddy'),
  parser: 'espree',
  env: {
    es6: false
  },
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script'
  },
  rules: {
    'no-invalid-this': 2,
    'strict': [2, 'safe']
  }
};
