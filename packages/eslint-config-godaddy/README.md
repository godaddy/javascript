# eslint-config-godaddy

Base configuration for _non-React_, JavaScript applications officially used at GoDaddy.

This styleguide is used by dozens of product teams at GoDaddy. Have a question or comment? [Open an issue!](https://github.com/godaddy/javascript/issues/new)

## Installation

``` sh
# Default with ES6
npm i eslint-config-godaddy --save-dev
```

## Usage

```js

import gdConfig from 'eslint-config-godaddy'
import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  extends: [
    gdConfig,
  ],
  rules: {
    // Add your own rules here
    'no-console': 'warn',
  },
});
```
