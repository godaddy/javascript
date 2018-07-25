module.exports = {
  extends: [
    require('./extends')('eslint-config-godaddy-react-flow')
  ],
  rules: {
    'complexity': 0,
    'consistent-return': 0,
    'id-length': 0,
    'indent': [2, 2, {
      VariableDeclarator: { var: 2, let: 2, const: 3 },
      flatTernaryExpressions: true,
      MemberExpression: 'off'
    }],
    'max-params': 0,
    'max-nested-callbacks': 0,
    'max-statements': 0,
    'no-else-return': 0,
    'no-nested-ternary': 0,
    'no-shadow': 0,
    'no-undefined': 0,
    'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }],
    'spaced-comment': 0
  }
};
