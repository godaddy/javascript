# biome-config-godaddy

Base Biome configuration for JavaScript applications officially used at GoDaddy.

This configuration provides a fast, Rust-based alternative to ESLint and Prettier using [Biome][biome]. It implements the same linting and formatting standards as GoDaddy's ESLint configurations, ensuring consistency across projects while delivering superior performance.

**Important**: This package requires Biome 2.2.0 or newer. The configuration utilizes the latest linting rules introduced in Biome 2.2.0 that provide feature parity with GoDaddy's ESLint configurations. Earlier versions of Biome will not support all the rules used in this configuration.

Have a question or comment? [Open an issue!][issues]

#### Example basic setup

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["biome-config-godaddy/biome.json"]
}
```

## Installation

Install the package and its peer dependency using pnpm:

```sh
pnpm install biome-config-godaddy @biomejs/biome --save-dev
```

Or with npm:

```sh
npm install biome-config-godaddy @biomejs/biome --save-dev
```

## Configuration

### Options

This package provides two configuration files:

- `biome.json` - Base configuration for JavaScript projects
- `biome-ts.json` - Enhanced configuration for TypeScript projects

Both configurations include:

- **Formatter settings**: 2-space indentation, 130 character line width, LF line endings
- **Linter rules**: Comprehensive rules aligned with `eslint-config-godaddy` standards
- **Fast performance**: Rust-based implementation for improved build times

#### Example JavaScript project

Create a `biome.json` file in your project root:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["biome-config-godaddy/biome.json"]
}
```

#### Example TypeScript project

For TypeScript projects, use the TypeScript-specific configuration:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["biome-config-godaddy/biome-ts.json"]
}
```

#### Example with custom overrides

Extend the base configuration and add project-specific rules:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["biome-config-godaddy/biome.json"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsoleLog": "off"
      },
      "style": {
        "useNodejsImportProtocol": "error"
      }
    }
  }
}
```

#### Example package.json scripts

Add these scripts to your `package.json` for common development workflows:

```json
{
  "scripts": {
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "biome check --write .",
    "check:ci": "biome check ."
  }
}
```

## Commands

### `format` command

Formats all files in the current directory and subdirectories according to GoDaddy style rules.

#### Example `format` usage

```sh
# Format and write changes
biome format --write .

# Check formatting without making changes
biome format .
```

### `lint` command

Analyzes code for potential issues using GoDaddy's linting standards.

#### Example `lint` usage

```sh
# Lint all files
biome lint .

# Lint with auto-fix
biome lint --write .

# Lint specific files
biome lint src/**/*.js
```

### `check` command

Combines linting and formatting in a single operation for comprehensive code quality checks.

#### Example `check` usage

```sh
# Check and fix all issues
biome check --write .

# Dry run to see what would change
biome check .

# Check specific directories
biome check src/ tests/
```

## Lifecycles

### `pre-commit`

Integrate with Git hooks to ensure code quality before commits.

#### Example `pre-commit` setup

```json
{
  "scripts": {
    "pre-commit": "biome check --write --staged"
  }
}
```

### Continuous integration

Validate code quality in CI pipelines without making changes.

#### Example CI validation

```json
{
  "scripts": {
    "ci:lint": "biome check .",
    "ci:format": "biome format ."
  }
}
```

## How it works

This Biome configuration mirrors the linting and formatting standards established by GoDaddy's ESLint configurations (`eslint-config-godaddy` and `eslint-config-godaddy-typescript`). Biome, written in Rust, provides the same code quality enforcement with improved performance compared to equivalent ESLint + Prettier setups.

The configuration enforces GoDaddy's JavaScript style guide including 2-space indentation, 130-character line limits, consistent semicolon usage, and comprehensive linting rules for code correctness, complexity management, and style consistency. The formatter ensures consistent code appearance across all team members.

Unlike traditional ESLint + Prettier combinations, Biome provides integrated linting and formatting in a single tool, eliminating configuration conflicts and reducing the number of dependencies in your project. The configuration automatically handles JavaScript and TypeScript files for different development environments.

## Related Packages

This Biome configuration is designed to be a drop-in replacement for GoDaddy's ESLint configurations:

- [`eslint-config-godaddy`][eslint-base] - Base ESLint config (equivalent to `biome.json`)
- [`eslint-config-godaddy-typescript`][eslint-typescript] - ESLint config for TypeScript (equivalent to `biome-ts.json`)
- [`eslint-config-godaddy-react`][eslint-react] - ESLint config for React applications
- [`eslint-config-godaddy-react-typescript`][eslint-react-ts] - ESLint config for React with TypeScript

Teams can migrate from ESLint configurations to Biome while maintaining the same code quality standards and style guidelines that GoDaddy has established across its engineering organization.

## License

[MIT][license]

[biome]: https://biomejs.dev/
[issues]: https://github.com/godaddy/javascript/issues/new
[license]: https://github.com/godaddy/javascript/blob/main/LICENSE
[eslint-base]: https://www.npmjs.com/package/eslint-config-godaddy
[eslint-typescript]: https://www.npmjs.com/package/eslint-config-godaddy-typescript
[eslint-react]: https://www.npmjs.com/package/eslint-config-godaddy-react
[eslint-react-ts]: https://www.npmjs.com/package/eslint-config-godaddy-react-typescript

