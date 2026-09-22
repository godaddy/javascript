import gdConfig from 'eslint-config-godaddy';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';

// Wrap react plugin for ESLint 10 compatibility (context.getFilename etc.)
const reactCompat = fixupPluginRules(react);

const config = [
  ...gdConfig,
  ...fixupConfigRules([react.configs.flat.recommended]),
  reactHooks.configs['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          experimentalObjectRestSpread: true
        }
      }
    },
    plugins: {
      react: reactCompat,
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
