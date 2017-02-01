module.exports = {
  extends: require.resolve('eslint-config-godaddy'),
  plugins: ['react'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  }
  rules: {
    'react/display-name': 0,
    'react/jsx-uses-react': 1,
    //
    // Whitespace rules for specific scenarios (e.g. JSX)
    //
    'react/jsx-curly-spacing': [2, 'always', {
      'spacing': { objectLiterals: 'never' }
    }],
    'jsx-quotes': [2, 'prefer-single']
  }
};
