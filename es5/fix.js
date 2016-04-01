/* eslint no-sync: 0, no-console: 0 */
'use strict';

/**
 * This is a temporary workaround for ES5 users. babel-eslint does not support
 * parserOptions the way it should, so setting ecmaVersion to 5 and sourceType
 * to "script" does not prevent it from yelling about:
 *
 * error  'use strict' is unnecessary inside of modules  strict
 *
 * We have to use the "espree" parser until babel-eslint is fixed.
 *
 * NOTE: Make sure this is run AFTER the fashion-show-build, as it targets
 * the compiled .eslintrc in the dist directory.
 */

var path = require('path');
var fs = require('fs');
var assign = require('assign-deep');
var mkdirp = require('mkdirp');

var es5Options = {
  '.eslintrc': {
    parser: 'espree',
    env: {
      es6: false
    },
    parserOptions: {
      ecmaVersion: 5,
      sourceType: 'script'
    }
  }
};

//
// Make dist/es5 if it does not already exist
//
var distDir = path.resolve(__dirname, '..', 'dist');
mkdirp.sync(path.resolve(distDir, 'es5'));

//
// We copy .jscsrc to es5 also, even though we aren't modifying it, so that
// we can run all the linting commands in a single call to fashion-show.
//
['.eslintrc', '.jscsrc'].forEach(function fixForEs5(filename) {
  console.log('Creating es5-compatible ' + filename + ' at dist/es5/' + filename);
  var file = JSON.parse(
    fs.readFileSync(path.resolve(distDir, filename), 'utf8')
  );

  assign(file, es5Options[filename]);
  fs.writeFileSync(path.resolve(distDir, 'es5', filename), JSON.stringify(file, null, 2));
});
