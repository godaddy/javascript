module.exports = {
  extends: require('./extends')('eslint-config-godaddy'),
  plugins: ['react'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    'react/display-name': 0,
    'react/jsx-pascal-case': 2,
    'react/jsx-uses-react': 1,
    'react/prefer-es6-class': 2,
    //
    // Whitespace rules for specific scenarios (e.g. JSX)
    //
    'react/jsx-curly-spacing': [2, 'always', {
      spacing: { objectLiterals: 'never' }
    }],
    'jsx-quotes': [2, 'prefer-single']
  }
};
