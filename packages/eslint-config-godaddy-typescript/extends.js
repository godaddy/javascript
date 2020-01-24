var path = require('path');

/**
 * Helper function that attempts to resolve the specify named `config`
 * locally before attempting to resolve it from `node_modules`. This
 * tricks TravisCI into resolving correctly.
 *
 * @param {string} config Named `eslint-config-*` module
 * @returns {string} Full path resolved locally or from `node_modules`.
 */
module.exports = function resolveLocal(config) {
  try {
    return require.resolve(path.resolve(__dirname, '..', config));
  } catch (ex) {
    return require.resolve(config);
  }
};
