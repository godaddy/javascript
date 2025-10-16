# AGENTS.md - GoDaddy JavaScript Style Guide

## Commands
- Root lint: `pnpm lint` (runs across all packages)
- Root test: `pnpm test` (runs all package tests in parallel)
- Package-specific: `cd packages/<package> && pnpm <command>`
- Single test: Navigate to package directory, then `pnpm test`
- Clean: `pnpm clean` (removes node_modules from all packages)

## Architecture
- Monorepo with pnpm workspaces containing ESLint configs
- Main packages: `eslint-config-godaddy` (base), `eslint-config-godaddy-react`, `eslint-config-godaddy-typescript`
- `app-connect/` - Platform Applications Registry API (TypeScript with Biome)
- `react/` - React component library with GraphQL schema
- Uses changesets for versioning and publishing

## Code Style
- ESLint configs define GoDaddy JavaScript standards for ES6+, React, TypeScript
- Base config enforces strict mode, jsdoc, mocha, and json rules
- TypeScript: strict typing, no `any`, functional approach over classes
- Naming: lowercase-with-dashes for directories, camelCase for variables
- Error handling: wrap async in try/catch, use Result<T> types where applicable
- Testing: Mocha for base packages, Vitest for modern TypeScript packages
