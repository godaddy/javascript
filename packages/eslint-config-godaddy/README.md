# eslint-config-godaddy

Base configuration for _non-React_, ES6 JavaScript applications officially used at GoDaddy. There are many useful features:

- **Standard. No configuration.** – Stop worrying about style and focus on your work.
- **Modern** – Uses modern linting tools like `eslint`.
- **Auto-fix** – Auto-fix is enabled by-default through in `eslint`. Many rules will fix themselves!

This styleguide is used by dozens of product teams at GoDaddy. Have a question or comment? [Open an issue!](https://github.com/godaddy/javascript/issues/new)

## Installation

``` sh
# Default with ES6
npm i eslint-config-godaddy --save-dev
```

## Usage

There are two ways to use this styleguide depending on your own tooling preference: directly using pre-included binaries or running `eslint` yourself with a custom `.eslintrc` config.

##### 1. Use the pre-included binaries.

These use _exactly_ the configuration defined in this  package (`eslint-config-godaddy`) **with auto-fix enabled automatically.**

``` js
{
  "scripts": {
    "lint": "eslint-godaddy files/ you/ want-to/ lint/"
  }
}
```

##### 2. Define your local `.eslintrc.js` and run `eslint` yourself:

``` js
module.exports = {
  extends: 'godaddy'
  rules: {
    //
    // Put any rules you wish to override here.
    //
  }
}
```

The `--fix` option in `eslint` is [**only** available as a CLI option](https://github.com/eslint/eslint/issues/8041). Auto-fix will *NOT be enabled* unless you run `eslint --fix` in your `package.json`.

``` js
{
  "scripts": {
    "lint": "eslint --fix files/ you/ want-to/ lint/"
  }
}
```
