var path = require('path');

/**
 * Temporary --es5 argument to support es5-compatible .eslintrc
 * Remove when es5-fix.js is no longer necessary.
 *
 * @returns {Object} config and bin path
 */
module.exports = function es5Paths() {
  var args = process.argv.slice(2);
  var es5ArgIndex = args.indexOf('--es5');
  var es5 = es5ArgIndex > -1;
  var configDir = path.join(__dirname, '..', 'dist');

  // We need to get the binPath here and pass it to fashion-show
  // because if binPath is not provided, fashion show infers the
  // the binPath using the configDir, which results in a broken
  // binPath when using --es5, because the --es5 configDir has one
  // more level of directory nesting.
  var binPath = path.join(__dirname, '..', 'node_modules', '.bin');
  if (es5) {
    configDir = path.join(configDir, 'es5');
    // We need to remove the --es5 argument because fashion-show
    // will throw an error if it remains
    process.argv.splice(es5ArgIndex + 2, 1);
  }

  return {
    configDir: configDir,
    binPath: binPath
  };
}
