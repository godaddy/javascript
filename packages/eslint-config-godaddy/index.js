import globals from 'globals';
import js from '@eslint/js';
import json from 'eslint-plugin-json';
import jsdoc from 'eslint-plugin-jsdoc';
import mocha from 'eslint-plugin-mocha';

const config = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          globalReturn: true
        }
      }
    },
    plugins: {
      jsdoc,
      json,
      mocha
    },
    rules: {
      'accessor-pairs': 2,
      'arrow-spacing': [2, { before: true, after: true }],
      'block-scoped-var': 2,
      'callback-return': [2, ['cb', 'callback', 'next', 'done']],
      'complexity': [1, 11],
      'consistent-return': 0,
      'constructor-super': 2,
      'default-case': 2,
      'eqeqeq': ['error', 'always', { null: 'never' }],
      'func-style': [0, 'declaration'],
      'generator-star-spacing': [2, { before: true, after: false }],
      'guard-for-in': 2,
      'handle-callback-err': [2, '^.*(e|E)rr(or)?$'],
      'id-length': [2, { min: 1, max: 30 }],
      'max-depth': [2, 5],
      'max-nested-callbacks': [2, 4],
      'max-params': [2, 4],
      'max-statements': [1, 15],
      'max-len': [1, 130, 2],
      'mocha/no-exclusive-tests': 2,
      'new-parens': 2,
      'no-alert': 2,
      'no-array-constructor': 2,
      'no-bitwise': [2, { allow: ['~'] }],
      'no-caller': 2,
      'no-catch-shadow': 2,
      'no-dupe-class-members': 2,
      'no-class-assign': 2,
      'no-cond-assign': [2, 'always'],
      'no-console': 1,
      'no-continue': 1,
      'no-const-assign': 2,
      'no-debugger': 2,
      'no-dupe-args': 2,
      'no-dupe-keys': 2,
      'no-duplicate-case': 2,
      'no-else-return': 1,
      'no-empty': 2,
      'no-eval': 2,
      'no-ex-assign': 2,
      'no-extend-native': 2,
      'no-extra-bind': 0,
      'no-extra-parens': 0,
      'no-extra-semi': 1,
      'no-floating-decimal': 2,
      'no-implied-eval': 2,
      'no-invalid-regexp': 2,
      'no-invalid-this': 0,
      'no-irregular-whitespace': 0,
      'no-iterator': 2,
      'no-labels': 2,
      'no-lone-blocks': 2,
      'no-lonely-if': 2,
      'no-loop-func': 2,
      'no-mixed-requires': 2,
      'no-native-reassign': 2,
      'no-negated-in-lhs': 2,
      'no-nested-ternary': 2,
      'no-new-func': 2,
      'no-new-object': 2,
      'no-new-require': 2,
      'no-new-wrappers': 2,
      'no-new': 2,
      'no-octal-escape': 2,
      'no-path-concat': 2,
      'no-plusplus': 0,
      'no-process-exit': 1,
      'no-process-env': 1,
      'no-proto': 2,
      'no-redeclare': 2,
      'no-regex-spaces': 2,
      'no-return-assign': 2,
      'no-script-url': 2,
      'no-self-compare': 2,
      'no-sequences': 2,
      'no-shadow-restricted-names': 2,
      'no-shadow': 1,
      'no-sparse-arrays': 2,
      'no-sync': 2,
      'no-throw-literal': 2,
      'no-undef-init': 2,
      'no-undefined': 2,
      'no-underscore-dangle': 0,
      'no-unneeded-ternary': 2,
      'no-unreachable': 2,
      'no-unused-expressions': 0,
      'no-use-before-define': [2, 'nofunc'],
      'no-useless-call': 2,
      'no-useless-concat': 2,
      'prefer-const': 1,
      'radix': 2,
      'semi': 1,
      'strict': [2, 'global'],
      'use-isnan': 2,
      'valid-jsdoc': 0,
      'prefer-promise-reject-errors': 2,
      //
      // Whitespace or other stylistic rules. No --fix option exists in eslint,
      // but previously existed in jscs
      //
      'no-mixed-spaces-and-tabs': [0, false], // TODO: should not be 0
      'no-multi-str': 2,
      'no-with': 2,
      'new-cap': 2,
      //
      // Whitespace rules follow. All rules are auto-fix unless
      // otherwise specified.
      //
      'array-bracket-spacing': 2,
      'brace-style': [2, '1tbs', { allowSingleLine: true }],
      'camelcase': [2, { properties: 'never' }],
      'comma-spacing': 2,
      'comma-style': 2,
      'comma-dangle': 2,
      'no-trailing-spaces': 2,
      'dot-notation': 2,
      'eol-last': 2,
      'key-spacing': 2,
      'func-call-spacing': [2, 'never'],
      'indent': [2, 2, { SwitchCase: 1 }],
      'keyword-spacing': 2,
      'linebreak-style': 2,
      'object-curly-spacing': [2, 'always'],
      'quotes': [2, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'quote-props': [2, 'consistent-as-needed'],
      'space-before-blocks': 2,
      'space-before-function-paren': [2, {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'ignore'
      }],
      'space-unary-ops': [2, { words: true, nonwords: false }],
      'space-infix-ops': 2,
      'spaced-comment': [2, 'always', { markers: ['/'] }],
      'space-in-parens': 2,
      'wrap-iife': 2,
      'yoda': [2, 'never']
    }
  }
];

export default config;
