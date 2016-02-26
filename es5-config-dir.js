// Temporary --es5 argument to support es5-compatible .eslintrc
// Remove when es5-fix.js is no longer necessary.

var path = require('path');

module.exports = getConfigDir;

function getConfigDir() {
  var args = process.argv.slice(2);
  var es5ArgIndex = args.indexOf('--es5');
  var es5 = es5ArgIndex > -1;
  var configDir = path.join(__dirname, 'dist');
  if(es5) {
    configDir = path.join(configDir, 'es5');
    // We need to remove the --es5 argument because fashion-show
    // will throw an error if it remains
    process.argv.splice(es5ArgIndex + 2, 1);
  }
  return configDir;
}