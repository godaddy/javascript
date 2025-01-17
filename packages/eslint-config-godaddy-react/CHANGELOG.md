# CHANGELOG

## 10.0.0

### Major Changes

- 16301df: chore(eslint)!: migrate all eslint configs to eslint@v9

  BREAKING CHANGE: removes v8 support and transistions configs to flat config. Also these packages are now `type:module`

### Patch Changes

- Updated dependencies [16301df]
  - eslint-config-godaddy@8.0.0

## 9.1.0

### Minor Changes

- 6125e53: Disabling react/prop-types

## 9.0.2

### Patch Changes

- f47da10: Lock down peerDeps to version 8 of eslint due to major breaking changes in version 9.
- Updated dependencies [f47da10]
  - eslint-config-godaddy@7.1.1

## 9.0.1

### Patch Changes

- 906d745: Upgrade dependencies
- Updated dependencies [906d745]
  - eslint-config-godaddy@7.0.2

## 9.0.0

### Major Changes

- 7bac08c: WHAT: Eslint peer dep upgrade
  WHY: In order to support newer ecmascript versions
  HOW: Updated eslint peer dependency to v8 to prevent issues w/ earlier versions

### Patch Changes

- Updated dependencies [7bac08c]
  - eslint-config-godaddy@7.0.0

## 8.1.0

### Minor Changes

- 40f5e60: Convert to turbo repo and changesets

### Patch Changes

- Updated dependencies [40f5e60]

  - eslint-config-godaddy@6.1.0

- [#79] Reintroduced `react/no-deprecated` lint rule.

### 4.1.0

- Set react version to 'detect'

### 4.0.1

- Restore `a11y` as peer dependency

### 3.1.1

- Remove the peer dependency while this is still not a major version

### 3.1.0

- [#76] Add [`eslint-plugin-jsx-a11y`](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) by default

### 3.0.0

- Bump to `eslint@5`.

### 2.2.1

- [#65] Reduce `react/no-deprecated` lint rule to a warning.

### 1.1.1

- [#41] `AllowAllCaps` for `react/jsx-pascal-case`

### 1.1.0

- Initial release.
