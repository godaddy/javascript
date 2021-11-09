const fs = require('fs');
const path = require('path');

module.exports = function (filename) {
  filename = filename || path.join(__dirname, 'index');

  const isEslint = /^\.eslint.*/;
  const cwd = process.cwd();
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

  //
  // Only force our config file if there is one not in the current
  // directory AND not specified by the command line.
  //
  fs.readdir(cwd, function (readErr, files) {
    if (readErr) { throw readErr; }

    has.config = has.config || files.some(function (file) {
      return isEslint.test(file);
    });

    if (!has.config) {
      process.argv.splice(2, 0, '-c', require.resolve(filename));
    }

    const pkg = require.resolve('eslint/package.json');
    const bin = path.join(pkg, '..', 'bin', 'eslint.js');

    require(bin);
  });
};
