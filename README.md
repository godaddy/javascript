# godaddy-style

Official GoDaddy JavaScript styleguide. It includes `eslint` packages for various use-cases and can be used as a standard in any new project.

- [`eslint-config-godaddy`]: Base configuration for _non-React_, ES6 JavaScript applications
- [`eslint-config-godaddy-react`]: Configuration for ES6 React JavaScript applications
- [`eslint-config-godaddy-typescript`]: Configuration for ES6 TypeScript applications
- [`eslint-config-godaddy-react-typescript`]: Configuration for ES6 React JavaScript applications
- [`eslint-config-godaddy-flow`]: Configuration for ES6 React JavaScript applications using Flow
- [`eslint-config-godaddy-react-flow`]: Configuration for ES6 React JavaScript applications using Flow

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

# OR (ES6 with Flow rules)
npm i eslint-config-godaddy-flow --save-dev

# OR (ES6 with React and Flow rules)
npm i eslint-config-godaddy-react-flow --save-dev
```

## Usage

There are two ways to use this styleguide depending on your own tooling preference: directly using pre-included binaries or running `eslint` yourself with a custom `.eslintrc` config.

### 1. Use the pre-included binaries

These use _exactly_ the configuration defined in the individual `eslint-config-godaddy*` package **with auto-fix enabled automatically.**

``` js
{
  "scripts": {
    "lint": "eslint-godaddy files/ you/ want-to/ lint/"
  }
}
```

### 2. Define your local `.eslintrc.js` and run `eslint` yourself

``` js
module.exports = {
  extends: 'godaddy',
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

## Additional Best Practices

This section is a place for additional best practices that may be useful but are not strictly enforced by this styleguide. Have something to add here? Great! [Submit a PR](#how-do-i-contribute).

### React

- [AirBnB React Styleguide](https://github.com/airbnb/javascript/tree/master/react)

## FAQ

## How do I override a specific rule ?

### 1. Add a `.eslintrc` file at the root of your project:

``` js
{
  "extends": "godaddy",
  "rules": {
    // Disable the 'max-params' rule
    "max-params": 0
  }
}
```

### 2. Add a param to specify the path of your own `.eslintrc` file in your `package.json`

``` js
{
  "scripts": {
    "eslint": "eslint-godaddy -c .eslintrc lib/ test/",
  }
}
```

## How do I disable auto fix

You may wish to disable auto fix so when you run `eslint` in ci it will error
if it catches anything unlinted.

``` js
{
  "scripts": {
    "eslint:ci": "eslint-godaddy --fix=false --max-warnings=0 lib/ test/",
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

Since this repository uses npm workspaces it will install and hoist all `node_modules` to 
the root of the monorepo. 

### Submit a changeset

This repository utilizes [changesets] to handle versioning and publishing as you submit a pull-request. To initiate a changeset run:

```bash
npm run changeset
```

After which follow the command prompts to select which packages and which version each package should receive.

### Publishing

If you are lucky enough to get to publish a new version of a package you are in luck. This monorepo is setup to independently publish packages based on changes commited. Just make sure to run:

```bash
npm version
```

This will run `changeset version` and will update all packages to the versions based on the changesets committed into the `.changeset` directory. After the versioning is complete to handle publishing and creating a release run: 

```bash
npm run release
```

This runs `changeset publish` under the hood and handle as mentioned above.

### I disagree with a specific rule

Great. We'd love to talk about it. Fork this repository and submit a pull-request.

### Help! It's not working for me

No problem. Reach out to us by [opening an issue]

## Roadmap

- Consider other rules in an `eslint` only implementation:
  - `computed-property-spacing`
  - `generator-star-spacing`
  - `semi-spacing`
  - `block-spacing`
- Continue to modularize the `eslint` rules.
- Translate configuration files into more verbose written documentation.
- Add support for IDE formats (IntelliJ, Webstorm, Atom, Eclipse, Sublime, etc...)

[opening an issue]: https://github.com/godaddy/javascript/issues
[`eslint-config-godaddy`]: /packages/eslint-config-godaddy
[`eslint-config-godaddy-react`]: /packages/eslint-config-godaddy-react
[`eslint-config-godaddy-typescript`]: /packages/eslint-config-godaddy-typescript
[`eslint-config-godaddy-react-typescript`]: /packages/eslint-config-godaddy-react-typescript
[`eslint-config-godaddy-flow`]: /packages/eslint-config-godaddy-react-flow
[`eslint-config-godaddy-react-flow`]: /packages/eslint-config-godaddy-react-flow
[changesets]: https://github.com/changesets/changesets
