module.exports = {
  extends: [
    require('./extends')('eslint-config-godaddy-react'),
    'plugin:eslint-plugin-react/recommended'
  ],
  plugins: ['react', 'flowtype', 'babel'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true
    }
  },
  rules: {
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
