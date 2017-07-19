module.exports = {
  extends: [
    require('./extends')('eslint-config-godaddy'),
    'plugin:eslint-plugin-react/recommended'
  ],
  plugins: ['react', 'flowtype', 'babel'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true
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
    'jsx-quotes': [2, 'prefer-single'],
    //
    // Flow rules
    //
    'flowtype/define-flow-type': 2,
    'flowtype/space-after-type-colon': [2, 'always'],
    'flowtype/type-id-match': [2, '^([A-Z][A-Za-z0-9]*)$'],
    'flowtype/use-flow-type': 2
  },
  settings: {
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    }
  }
};
