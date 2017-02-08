const which = require('which');
const path = require('path');

module.exports = function (filename) {
  filename = filename || path.join(__dirname, 'index');
  const has = {
    fix: false,
    config: false
  };

  process.argv.forEach(function (arg) {
    has.fix = has.fix || arg === '--fix';
    has.config = has.config || (arg === '-c' || arg === '--config');
  });

  if (!has.fix) {
    process.argv.splice(2, 0, '--fix');
  }

  if (!has.config) {
    process.argv.splice(2, 0, '-c', require.resolve(filename));
  }

  which('eslint', function (err, resolved) {
    if (err) { throw err; }
    require(resolved);
  });
};
