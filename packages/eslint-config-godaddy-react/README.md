# eslint-config-godaddy

Base configuration for _non-React_, JavaScript applications officially used at GoDaddy.

This styleguide is used by dozens of product teams at GoDaddy. Have a question or comment? [Open an issue!](https://github.com/godaddy/javascript/issues/new)

## Installation

``` sh
# Default with ES6
npm i eslint-config-godaddy-react --save-dev
```

## Usage

```js

import gdConfig from 'eslint-config-godaddy-react'

const config = [{
  ...gdConfig
  {
    // Other eslint options here
  }
}]
```
