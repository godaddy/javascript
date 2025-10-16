# eslint-config-godaddy

Base ESLint configuration for _non-React_, ES6 JavaScript applications officially used at GoDaddy.

This styleguide is used by dozens of product teams at GoDaddy. Have a question or comment? [Open an issue!](https://github.com/godaddy/javascript/issues/new)

There are many useful features:

- **Standard. No configuration.** – Stop worrying about style and focus on your work.
- **Modern** – Uses modern linting tools like `eslint`.
- **Auto-fix** – Auto-fix is enabled by-default through in `eslint`. Many rules will fix themselves!

## Installation

```sh
npm install eslint-config-godaddy --save-dev
```

## Usage

There are two ways to use this styleguide depending on your own tooling preference: directly using pre-included binaries or running `eslint` yourself with a custom `eslint.config.js` config.

### Define your local `eslint.config.js|mjs` and run `eslint` yourself

```js
import GDConfig from 'eslint-config-godaddy';
import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  extends: [
    GDConfig,
  ],
  rules: {
    // Add your own rules here
    'no-console': 'warn',
  },
});
```

The `--fix` option in `eslint` is [**only** available as a CLI option](https://github.com/eslint/eslint/issues/8041). Auto-fix will **_NOT be enabled_** unless you run `eslint --fix` in your `package.json`.

```json
{
  "scripts": {
    "lint": "eslint --fix files/ you/ want-to/ lint/"
  }
}
```

## FAQ

### How do I override a specific rule?

Add a `eslint.config.js|mjs` file at the root of your project:

```js
import GDConfig from 'eslint-config-godaddy';
import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  extends: [
    GDConfig,
  ],
  rules: {
    // Add your own rules here
    'no-console': 'warn',
  },
});
```

### How do I contribute?

Fork this repository and submit a pull request. See the [main repository](https://github.com/godaddy/javascript) for detailed contribution guidelines.

### I disagree with a specific rule

Great. We'd love to talk about it. Fork this repository and submit a pull-request.

### Help! It's not working for me

No problem. Reach out to us by [opening an issue](https://github.com/godaddy/javascript/issues)
