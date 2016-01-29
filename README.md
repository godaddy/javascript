# godaddy-style

Official GoDaddy JavaScript styleguide. It includes [dotfiles for known tools](#included-dotfiles) and can be used as a standard in any new project.

There are many useful features:

- **Standard. No configuration.** – Stop worrying about style and focus on your work.
- **Modern** – Uses modern linting tools like `eslint` and `jscs`.
- **Auto-fix** – Auto-fix is enabled in `jscs`. Many rules will fix themselves!

This styleguide is used by dozens of product teams at GoDaddy. Have a question or comment? [Open an issue!](https://github.com/godaddy/javascript/issues/new)

- [Installation](#installation)
  - [Using included binaries](#using-included-binaries)
  - [Using with `gulp`](#using-with-gulp)
- [Included dotfiles](#included-dotfiles)
- [Additional Best Practices](#additional-best-practices)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributors](#contributors)

## Installation

There are two ways to install and use this styleguide depending on your own tooling preference: directly using pre-built binaries.

1. Depend on `godaddy-style`
```
npm i godaddy-style --save-dev
```

2. Run the `godaddy-style` binaries in your `package.json`:
``` js
{
  "scripts": {
    "eslint": "godaddy-style-eslint lib/ test/",
    "jscs": "godaddy-style-jscs lib/ test/",
    "lint": "godaddy-style-lint lib/ test/"
  }
}
```
_n.b. All CLI flags are exposed through [fashion-show]. Auto-fix will be enabled by the `-f` setting._

## Included dotfiles

This project includes dotfiles with comments under the `dotfiles` directory, but **you should use the distributable versions of these files under `dist`.**

### ESLint

The styleguide uses `eslint` for all correctness focused linting. All strictly style related checking (i.e. whitespace) is handled by `jscs`. Only the rules exclusive to `eslint` have been enabled or disabled accordingly to make sure there is no overlap with `jscs`.

### JSCS

The styleguide uses `jscs` for all strictly style related checking. Many `jscs` rules have auto-fixing enabled.

## Additional Suggestions for Best Practices

This section is a place for additional best practices that may be useful but are not strictly enforced by this styleguide. Have something to add here? Great! [Submit a PR](#how-do-i-contribute).

### React

- [AirBnB React Styleguide](https://github.com/airbnb/javascript/tree/master/react)

## FAQ

### How do I contribute?

Fork this repository and submit a pull request.

Proposed modifications to the style guide should modify the files in `/dotfiles` before running `npm run build` when submitting a pull request. This repository utilizes the [fashion-show](https://github.com/indexzero/fashion-show) module to generate the `/dist` files to be checked in.

### I disagree with a specific rule

Great. We'd love to talk about it. Fork this repository and submit a pull-request.

### Help! It's not working for me!

No problem. Reach out to us by [opening an issue]

## Roadmap

- Add more specific style guidance around React.
- Translate dotfile rules into more verbose written documentation.
- Never stop improving.
- Add support for IDE formats (IntelliJ, Webstorm, Atom, Eclipse, Sublime, etc...)

[opening an issue]: https://github.com/godaddy/javascript/issues
[fashion-show]: https://github.com/indexzero/fashion-show#api-documentation
