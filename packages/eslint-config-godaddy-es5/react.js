'use strict';

module.exports = {
  extends: require('./extends')('eslint-config-godaddy-react'),
  parser: 'espree',
  env: {
    es6: false
  },
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script'
  },
  rules: {
    'react/display-name': 2,
    'react/prefer-es6-class': 0,
    'strict': [2, 'never']
  }
};
