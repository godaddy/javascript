module.exports = {
  parser: 'espree',
  env: {
    es6: false
  },
  parserOptions: {
    ecmaVersion: 5,
    sourceType: 'script'
  },
  rules: {
    'scrict': [2, 'always']
  }
};
