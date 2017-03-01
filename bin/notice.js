/**
 * Simple helper function that displays a standard deprecation message
 * along with a custom message.
 */
module.exports = function (message) {
  if (message && !Array.isArray(message)) {
    message = [message];
  }

  console.log([
    'godaddy-style@4.0.0: This package has been deprecated. You probably want ONE of these:',
    '  npm install eslint-config-godaddy',
    '  npm install eslint-config-godaddy-react',
    '  npm install eslint-config-godaddy-es5',
    ''
  ].concat(message).join('\n'));

  process.exit(1);
};
