import gdConfig from 'eslint-config-godaddy';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';

import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const config = [
  ...gdConfig,
  react.configs.flat.recommended,
  // This is needed due to react-hooks not being Flat Config compatible there is an open
  // issue for this https://github.com/facebook/react/issues/28313 and PR for this change
  // https://github.com/facebook/react/pull/30774
  ...compat.extends('plugin:react-hooks/recommended'),
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          experimentalObjectRestSpread: true
        },
        requireConfigFile: false
      }
    },
    plugins: {
      react,
      jsxA11y
    },
    rules: {
      'react/display-name': 0,
      'react/jsx-pascal-case': [2, { allowAllCaps: true }],
      'react/jsx-uses-react': 1,
      'react/jsx-equals-spacing': 2,
      'react/prefer-es6-class': 2,
      'react/prop-types': 0,
      //
      // Whitespace rules for specific scenarios (e.g. JSX)
      //
      'react/jsx-curly-spacing': [2, 'always', {
        spacing: { objectLiterals: 'never' }
      }],
      'jsx-quotes': [2, 'prefer-single']
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
];


export default config;
