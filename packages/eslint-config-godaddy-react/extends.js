const path = require('path');

module.exports = function resolveLocal(config) {
  try {
    return require.resolve(path.resolve(__dirname, '..', config));
  } catch (ex) {
    return require.resolve(config);
  }
};
