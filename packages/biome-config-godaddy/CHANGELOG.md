# biome-config-godaddy

## 2.0.0

### Major Changes

- 55f40a1: Initial release of biome-config-godaddy, a fast Rust-based alternative to ESLint and Prettier configurations for GoDaddy JavaScript applications.

  A comprehensive Biome configuration package that provides consistent code quality and formatting standards across GoDaddy's JavaScript ecosystem, featuring:

  - **Dual configuration support** with dedicated configs for JavaScript (`biome.json`) and TypeScript (`biome-ts.json`) projects
  - **Complete rule parity** with existing `eslint-config-godaddy` and `eslint-config-godaddy-typescript` standards, auto-migrated using Biome's migration tools
  - **Consistent formatting rules** including 2-space indentation, 130 character line width, LF line endings, and single quote preferences
  - **Performance optimizations** through Rust-based implementation providing significantly faster linting and formatting compared to traditional ESLint + Prettier setups
  - **Biome 2.2.0+ compatibility** utilizing the latest linting rules for full feature parity with GoDaddy's established ESLint configurations
  - **Seamless integration** designed for easy adoption in GoDaddy's monorepo ecosystem and existing JavaScript projects

  This package enables development teams to maintain the same code quality standards and style guidelines established across GoDaddy's engineering organization while benefiting from improved build performance and reduced tooling complexity.

## 1.0.0

### Major Changes

- **Initial release** of biome-config-godaddy - A fast, Rust-based alternative to ESLint and Prettier configurations
- **Dual configuration support**:
  - `biome.json` - Base configuration for JavaScript projects
  - `biome-ts.json` - Enhanced configuration for TypeScript projects
- **Complete linting rule parity** with `eslint-config-godaddy` standards using Biome 2.2.0+ features
- **Consistent formatting rules**:
  - 2-space indentation
  - 130 character line width
  - LF line endings
  - Single quotes preference
  - Automatic semicolon insertion
- **Performance optimizations**: Rust-based implementation provides 15x faster linting and formatting
- **Biome 2.2.0+ requirement**: Utilizes latest Biome features for full ESLint config compatibility
- **Monorepo integration**: Designed for seamless integration with GoDaddy's JavaScript tooling ecosystem
