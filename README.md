# godaddy-style

Official GoDaddy JavaScript styleguide. It includes `eslint` packages for various use-cases and can be used as a standard in any new project.

- [`eslint-config-godaddy`]: Base configuration for _non-React_, ES6 JavaScript applications
- [`eslint-config-godaddy-react`]: Configuration for ES6 React JavaScript applications
- [`eslint-config-godaddy-typescript`]: Configuration for ES6 TypeScript applications
- [`eslint-config-godaddy-react-typescript`]: Configuration for ES6 React JavaScript applications

There are many useful features:

- **Standard. No configuration.** – Stop worrying about style and focus on your work.
- **Modern** – Uses modern linting tools like `eslint`.
- **Auto-fix** – Auto-fix is enabled by-default through in `eslint`. Many rules will fix themselves!

This styleguide is used by dozens of product teams at GoDaddy. Have a question or comment? [Open an issue!](https://github.com/godaddy/javascript/issues/new)

- [Installation](#installation)
- [Usage](#usage)
- [Additional Best Practices](#additional-best-practices)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributors](https://github.com/godaddy/javascript/graphs/contributors)

## Installation

Install one of the provided packages depending on the kind of application you are developing:

``` sh
# Default with ES6
npm i eslint-config-godaddy --save-dev

# OR (ES6 with React rules)
npm i eslint-config-godaddy-react --save-dev

# OR (legacy ES5 with React rules)
npm i eslint-config-godaddy-es5 --save-dev

# OR (ES6 with TypeScript rules)
npm i eslint-config-godaddy-typescript --save-dev

# OR (ES6 with React and TypeScript rules)
npm i eslint-config-godaddy-react-typescript --save-dev
```

## Usage

There are two ways to use this styleguide depending on your own tooling preference: directly using pre-included binaries or running `eslint` yourself with a custom `.eslintrc` config.

### 2. Define your local `eslint.config.js|mjs` and run `eslint` yourself

``` js
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

``` js
{
  "scripts": {
    "lint": "eslint --fix files/ you/ want-to/ lint/"
  }
}
```

## Additional Best Practices

This section is a place for additional best practices that may be useful but are not strictly enforced by this styleguide. Have something to add here? Great! [Submit a PR](#how-do-i-contribute).

### React

- [AirBnB React Styleguide](https://github.com/airbnb/javascript/tree/master/react)

## FAQ

## How do I override a specific rule ?

### 1. Add a `eslint.config.js|mjs` file at the root of your project

``` js
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

### 2. Add a param to specify the path of your own `my-config.js|cjs|mjs` file in your `package.json`

``` js
{
  "scripts": {
    "eslint": "eslint -c myconfig.js lib/ test/",
  }
}
```

## How do I contribute?

Fork this repository and submit a pull request.

### Local setup

For a first time setup make sure to run from the root of the monorepo

```bash
npm install
```

Since this repository uses npm workspaces it will install and hoist all `node_modules` to the root of the monorepo.

### Submit a changeset

This repository utilizes [changesets] to handle versioning and publishing as you submit a pull-request.
A changeset should be included with your pull-request to help the maintainers
understand the changes and to help with the release process.

To initiate a changeset run:

```bash
npm run changeset
```

After which follow the command prompts to select which packages and which version each package should receive.

Commit and push the changeset to your branch to be included with your pull-request.

## Publishing

When a pull-request is merged into the `main`, the changeset will be used
to determine the next version of the package.

A "Version Packages" pull-request will be automatically created to bump the
versions.
If multiple PRs with changesets are merged, this PR will automatically update to
include all changesets.

When all changes are ready to be published, repo admins can force squash merge
the "Version Packages" PR to main (CI worflows do not run on this automated branch).
This will trigger the CI to publish the packages to npm.

## I disagree with a specific rule

Great. We'd love to talk about it. Fork this repository and submit a pull-request.

## Help! It's not working for me

No problem. Reach out to us by [opening an issue]

## Roadmap

- ESLint v9 support ([guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0))

[opening an issue]: https://github.com/godaddy/javascript/issues
[`eslint-config-godaddy`]: /packages/eslint-config-godaddy
[`eslint-config-godaddy-react`]: /packages/eslint-config-godaddy-react
[`eslint-config-godaddy-typescript`]: /packages/eslint-config-godaddy-typescript
[`eslint-config-godaddy-react-typescript`]: /packages/eslint-config-godaddy-react-typescript
[changesets]: https://github.com/changesets/changesets
