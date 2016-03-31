// Add support for a --noFix argument to disable JSCS auto-fix.

module.exports = jscsAutoFix;

function jscsAutoFix() {
  var args = process.argv.slice(2);
  var noFixArgIndex = args.indexOf('--noFix');
  var noFix = noFixArgIndex > -1;

  if (noFix) {
    process.argv.splice(noFixArgIndex + 2, 1);
  }
  return !noFix;
}
