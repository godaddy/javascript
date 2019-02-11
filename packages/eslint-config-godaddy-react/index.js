module.exports = {
  extends: [
    require('./extends')('eslint-config-godaddy'),
    'plugin:eslint-plugin-react/recommended'
    'eslint-plugin-jsx-a11y'
  ],
  parser: 'babel-eslint',
  plugins: ['react'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true
    }
  },
  rules: {
    'react/display-name': 0,
    'react/jsx-pascal-case': [2, { allowAllCaps: true }],
    'react/jsx-uses-react': 1,
    'react/jsx-equals-spacing': 2,
    'react/prefer-es6-class': 2,
    'react/no-deprecated': 1,
    //
    // Whitespace rules for specific scenarios (e.g. JSX)
    //
    'react/jsx-curly-spacing': [2, 'always', {
      spacing: { objectLiterals: 'never' }
    }],
    'jsx-quotes': [2, 'prefer-single']
  }
};
