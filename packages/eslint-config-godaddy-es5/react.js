module.exports = {
  extends: [
    'eslint-config-godaddy-react',
    './index'
  ].map(require.resolve),
  rules: {
    'react/display-name': 2,
    'strict': [2, 'never']
  }
};
