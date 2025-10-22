# GoDaddy JavaScript

[![npm downloads](https://img.shields.io/npm/dm/eslint-config-godaddy.svg)](https://www.npmjs.com/package/eslint-config-godaddy)
[![license](https://img.shields.io/npm/l/eslint-config-godaddy.svg)](https://github.com/godaddy/javascript/blob/main/LICENSE)
[![github stars](https://img.shields.io/github/stars/godaddy/javascript.svg?style=social&label=Star)](https://github.com/godaddy/javascript)

Official collection of JavaScript libraries, tools, and configurations for building on the GoDaddy platform. This monorepo contains all the JavaScript SDKs, ESLint configurations, and React components under the `@godaddy` namespace.

## Getting Started

### ESLint Configurations

Choose the configuration that fits your project:

```bash
# For ES6 JavaScript applications
npm install eslint-config-godaddy --save-dev

# For React applications
npm install eslint-config-godaddy-react --save-dev

# For TypeScript applications
npm install eslint-config-godaddy-typescript --save-dev

# For React + TypeScript applications
npm install eslint-config-godaddy-react-typescript --save-dev

# For fast Rust-based linting (alternative to ESLint)
npm install biome-config-godaddy --save-dev
```

### Other Packages

```bash
# For GoDaddy platform integration
npm install @godaddy/app-connect

# For React components with commerce APIs
npm install @godaddy/react
```

## Packages

This monorepo contains the following packages:

| Package | Description | NPM |
|---------|-------------|-----|
| [`eslint-config-godaddy`](/packages/eslint-config-godaddy) | Base ESLint configuration for ES6 JavaScript | [![npm](https://img.shields.io/npm/v/eslint-config-godaddy.svg)](https://www.npmjs.com/package/eslint-config-godaddy) |
| [`eslint-config-godaddy-react`](/packages/eslint-config-godaddy-react) | ESLint configuration for React applications | [![npm](https://img.shields.io/npm/v/eslint-config-godaddy-react.svg)](https://www.npmjs.com/package/eslint-config-godaddy-react) |
| [`eslint-config-godaddy-typescript`](/packages/eslint-config-godaddy-typescript) | ESLint configuration for TypeScript applications | [![npm](https://img.shields.io/npm/v/eslint-config-godaddy-typescript.svg)](https://www.npmjs.com/package/eslint-config-godaddy-typescript) |
| [`eslint-config-godaddy-react-typescript`](/packages/eslint-config-godaddy-react-typescript) | ESLint configuration for React + TypeScript applications | [![npm](https://img.shields.io/npm/v/eslint-config-godaddy-react-typescript.svg)](https://www.npmjs.com/package/eslint-config-godaddy-react-typescript) |
| [`biome-config-godaddy`](/packages/biome-config-godaddy) | Fast Rust-based alternative to ESLint and Prettier using Biome | [![npm](https://img.shields.io/npm/v/biome-config-godaddy.svg)](https://www.npmjs.com/package/biome-config-godaddy) |
| [`@godaddy/app-connect`](/packages/app-connect) | Platform integration tools for GoDaddy apps | [![npm](https://img.shields.io/npm/v/@godaddy/app-connect.svg)](https://www.npmjs.com/package/@godaddy/app-connect) |
| [`@godaddy/react`](/packages/react) | React components and commerce API integration | [![npm](https://img.shields.io/npm/v/@godaddy/react.svg)](https://www.npmjs.com/package/@godaddy/react) |

## Why GoDaddy JavaScript?

- **Standard. No configuration.** – Stop worrying about style and focus on your work.
- **Modern** – Uses modern linting tools like ESLint with support for ES6+, React, and TypeScript.
- **Auto-fix** – Auto-fix is enabled by default. Many rules will fix themselves!
- **Battle-tested** – Used by dozens of product teams at GoDaddy in production.

## Quick Start

### ESLint Configuration

1. Install the appropriate configuration for your project
2. Create an `eslint.config.js` file:

```js
import GDConfig from 'eslint-config-godaddy';
import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  extends: [GDConfig],
  rules: {
    // Add your custom rules here
    'no-console': 'warn',
  },
});
```

3. Add a lint script to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint --fix src/"
  }
}
```

### Biome Configuration

For improved performance, use the Biome configuration. Create a `biome.json` file:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["biome-config-godaddy/biome.json"]
}
```

For TypeScript projects:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "extends": ["biome-config-godaddy/biome-ts.json"]
}
```

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "check": "biome check --write ."
  }
}
```

### Platform Integration

For applications integrating with the GoDaddy platform:

```typescript
import { verifyAction } from '@godaddy/app-connect';

// Verify requests from GoDaddy platform
const result = verifyAction(request);
if (result.success) {
  // Process verified request
}
```

## Release Notes

Release information is available through:
- [GitHub Releases](https://github.com/godaddy/javascript/releases) page
- Individual `CHANGELOG.md` files within each package (e.g., [`packages/eslint-config-godaddy/CHANGELOG.md`](/packages/eslint-config-godaddy/CHANGELOG.md))

## How to Contribute

We welcome contributions! To get started:

1. Fork this repository
2. Make your changes
3. Submit a pull request

### Local Development

This repository uses [pnpm](https://pnpm.io/) for package management and workspace handling.

```bash
# Install dependencies
pnpm install

# Run tests across all packages
pnpm test

# Run linting across all packages
pnpm lint

# Create a changeset for your changes
pnpm changeset
```

### Submitting Changes

This repository uses [changesets](https://github.com/changesets/changesets) for versioning and publishing. Include a changeset with your pull request:

```bash
pnpm changeset
```

Follow the prompts to select which packages should receive version bumps.

## Support

Have a question or found an issue?

- [Open an issue](https://github.com/godaddy/javascript/issues/new) on GitHub
- Check out our [contributing guidelines](CONTRIBUTING.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the GoDaddy engineering team
