module.exports = {
  extends: [
    require('./extends')('eslint-config-godaddy')
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: ['*.js', '*.json', '*.ts'],
      rules: {
        // note you must disable the base rule as it can report incorrect errors (in typescript)
        // (because of imported types being incorrectly reported as unused)
        // eslint-disable-next-line max-len
        // See https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars.md
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'after-used',
            ignoreRestSiblings: false
          }
        ],
        // Disable the base rule and enable TypeScript version to avoid incorrect reports
        // See https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-shadow.md
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'warn'
      }
    }
  ]
};
