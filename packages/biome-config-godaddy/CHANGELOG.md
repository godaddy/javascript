# biome-config-godaddy

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

