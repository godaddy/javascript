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

### Compatibility and migration

The updated toolchain requires ESLint 10.2 or newer within v10 and Node
`^22.22.2 || ^24.15.0 || >=26`. These requirements also apply to the React,
TypeScript, and React TypeScript configurations that extend this package.
They narrow the versions supported by the previous release and must be treated
as breaking changes when these packages are next versioned.

Use an ESM configuration (`eslint.config.mjs`, or `eslint.config.js` in a project
with `"type": "module"`). Mocha plugin v12 uses top-level await, so loading this
configuration with synchronous CommonJS `require()` is no longer supported.

Review custom overrides when upgrading eslint-plugin-mocha to v12. These rule
names were removed or renamed and must be removed or migrated before linting:

- `mocha/no-setup-in-describe`
- `mocha/no-skipped-tests`
- `mocha/no-sibling-hooks`
- `mocha/no-hooks-for-single-case`
- `mocha/no-return-and-callback`
- `mocha/no-async-describe`
- `mocha/no-global-tests`
- `mocha/no-top-level-hooks`
- `mocha/no-empty-description`
- `mocha/valid-test-description`
- `mocha/valid-suite-description`

See the [Mocha plugin release notes](https://github.com/lo1tuma/eslint-plugin-mocha/releases/tag/eslint-plugin-mocha%4012.0.0)
for replacement rules and options. This configuration continues to enable
`mocha/no-exclusive-tests` and explicitly includes AudioWorklet globals, which
globals v17 moved out of its browser set.

The React configuration no longer depends on Babel core or Babel's ESLint parser;
it uses ESLint's default parser with JSX enabled.

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
