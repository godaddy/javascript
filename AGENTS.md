# AGENTS.md — GoDaddy JavaScript Monorepo Guide

This document is the single source of truth for how to work inside this monorepo. It covers commands, architecture, conventions, testing, and codebase-specific guidance so future AI agents and developers can be effective immediately.

Repository facts:
- Monorepo managed by pnpm workspaces
- ESM-only (type: "module" across repo)
- Node 24 in CI (.nvmrc), engine >=22 in package.json
- Changesets for versioning and publishing
- GitHub Actions for CI/CD

Quickstart:
- Install: pnpm install
- Build everything: pnpm build
- Test everything: pnpm test
- Lint everything: pnpm lint
- Package-specific: pnpm --filter <pkg> <script>


1) Commands (root and packages)

Root scripts (run from repository root):
- build: pnpm run -r build
- lint: pnpm run -r lint
- test: pnpm run build && pnpm run -r --parallel test
- version: changeset version && pnpm install --prefer-offline
- release: changeset publish
- changeset: changeset
- clean: pnpm run clean:packages && pnpm run clean:root
- clean:packages: pnpm run -r clean
- clean:root: rimraf node_modules

Workspace tips:
- Run a script across all packages: pnpm -r <script> (only runs where script exists)
- Run for a specific package from root: pnpm --filter <name> <script>
  - Example: pnpm --filter @godaddy/react test
- Run a single package in its directory: cd packages/<pkg> && pnpm <script>

Package scripts

eslint-config-godaddy (packages/eslint-config-godaddy)
- lint: eslint .
- pretest: pnpm run --silent lint
- test: echo ok
- clean: rimraf node_modules

eslint-config-godaddy-react (packages/eslint-config-godaddy-react)
- lint: eslint .
- pretest: pnpm run --silent lint
- test: echo ok
- clean: rimraf node_modules

eslint-config-godaddy-typescript (packages/eslint-config-godaddy-typescript)
- lint: eslint .
- pretest: pnpm run --silent lint
- test: echo ok
- clean: rimraf node_modules

eslint-config-godaddy-react-typescript (packages/eslint-config-godaddy-react-typescript)
- lint: eslint .
- pretest: pnpm run --silent lint
- test: echo ok
- clean: rimraf node_modules

biome-config-godaddy (packages/biome-config-godaddy)
- test: echo ok
- clean: rimraf node_modules

@godaddy/app-connect (packages/app-connect)
- dev: tsdown --watch
- build: tsdown
- typecheck: tsc --noEmit
- lint: biome lint --write --unsafe ./src
- check: biome check --write --unsafe ./src
- test: vitest run
- test:watch: vitest
- test:coverage: vitest run --coverage
- release: pnpm build && changeset publish
- prepublishOnly: pnpm build

@godaddy/react (packages/react)
- dev: tsdown --watch
- dev:https: tsdown --watch
- build: tsdown && pnpm dlx @tailwindcss/cli -i ./src/globals.css -o ./dist/index.css --minify
- preview: vite preview
- typecheck: tsc --noEmit
- test: vitest run

@godaddy/localizations (packages/localizations)
- dev: tsdown --watch
- build: tsdown
- typecheck: tsc --noEmit

Common script patterns to run from root:
- Typecheck where available: pnpm -r typecheck
- Watch mode (app-connect, react, localizations): pnpm --filter <pkg> dev
- Format/lint (only where defined): pnpm -r lint or pnpm --filter @godaddy/app-connect check


2) Architecture overview

Monorepo and tooling
- pnpm workspaces: defined in pnpm-workspace.yaml (packages/*)
- ESM throughout: "type": "module" at root and packages
- Node: .nvmrc=24; CI uses Node 24; engines >=22 in root package.json; prefer Node 24 locally to match CI
- CI: .github/workflows
  - CICD on PRs and push to main runs pnpm test
  - Release workflow uses changesets/action to version and publish
  - CodeQL security analysis enabled
- Versioning/publishing: changesets; release PR auto-generated then publish to npm on merge

Packages (top-level purpose)
- eslint-config-godaddy
  - Base ESLint Flat config for JS/ES6 projects
  - Depends on eslint-plugin-jsdoc, eslint-plugin-json, eslint-plugin-mocha, globals
- eslint-config-godaddy-react
  - Extends base; React rules via eslint-plugin-react, jsx-a11y; hooks via FlatCompat for react-hooks
- eslint-config-godaddy-typescript
  - Extends base; TypeScript rules via @typescript-eslint
- eslint-config-godaddy-react-typescript
  - Extends React config; TypeScript rules via @typescript-eslint
- biome-config-godaddy
  - Biome shared config files (biome.json, biome-ts.json) for linting/formatting; users extend these in consumer apps
- @godaddy/app-connect
  - TypeScript verification library for GoDaddy Platform actions and webhook subscriptions
  - Framework adapters for Express and Next.js
  - Uses Vitest, Biome, tsdown build
- @godaddy/react
  - React component library for checkout flows; integrates with commerce APIs
  - Uses tsdown for TS build and Tailwind CLI v4 for CSS build; Vitest for tests; Vite preview
  - Depends on @godaddy/localizations
- @godaddy/localizations
  - Localized strings for checkout components; TS build via tsdown

Key internal dependencies
- @godaddy/react -> @godaddy/localizations (workspace:*)

External tooling per package
- Build: tsdown (TypeScript bundler with DTS output)
- Test: Vitest (react, app-connect)
- Lint/format: ESLint (config packages), Biome (app-connect). The repo also ships a reusable Biome config package.
- Styling: Tailwind CSS CLI v4 (react)
- GraphQL typing: gql.tada TS plugin configured in @godaddy/react tsconfig (schema file path required; ensure schema.graphql exists or update config)


3) Code style and conventions

Ecosystem and configuration
- ESLint Flat Config at root (eslint.config.js) extends packages/eslint-config-godaddy; disables strict rule at root due to cross-ES configs
- ESLint configs are ESM and consumed via import/export; consumers use eslint-define-config in their own projects
- Biome alternative available via biome-config-godaddy (ships biome.json and biome-ts.json)
- No Prettier; formatting via Biome where used

Style highlights (from eslint-config-godaddy and Biome configs)
- 2-space indentation
- Single quotes; JSX single quotes in React config
- Semicolons enabled (Biome formatter config)
- Max line width ~130
- Spacing rules enforced (object-curly-spacing: always, keyword-spacing, etc.)
- No nested ternaries; prefer-const; many safety rules enabled
- JSDoc and JSON plugin rules enabled in base config
- Mocha plugin rules in base config exist for legacy JS projects; this repo's tests use Vitest

TypeScript conventions
- Module resolution: "bundler"; ESM only
- Prefer strict typing; avoid any (app-connect enables strict in tsconfig)
- @typescript-eslint/no-unused-vars replaces base rule where applicable
- Files: .ts for libraries; .tsx for React components
- DTS output managed by tsdown (dts: true in configs)

Naming and structure
- File and directory names: kebab-case (per CONTRIBUTING.md)
- Variables/functions: camelCase; Types/Interfaces: PascalCase
- React components: PascalCase
- Exports: packages use "exports" map and typesVersions as needed; keep public API stable

Error handling and patterns
- @godaddy/app-connect uses a Result<T> pattern:
  - ok(value?) => { success: true, value }
  - error(err) => { success: false, error }
- Standardized error schema types (GoDaddyError, ErrorDetails, etc.) returned to callers
- Logging via a lightweight logger (see packages/app-connect/src/utils/logger.ts) used to trace verification flow

Monorepo conventions
- Workspace filtering preferred over cd where practical: pnpm --filter <pkg> <script>
- Keep package scripts consistent where possible: dev, build, typecheck, test


4) Testing strategies and frameworks

Frameworks
- Vitest for unit/integration tests in TypeScript packages:
  - @godaddy/app-connect: vitest config implicit; unit tests in src/**/*.test.ts
  - @godaddy/react: vitest.config.ts with jsdom, globals: true, setupFiles: ./src/tests/setup.ts

Patterns
- Test file naming: *.test.ts or *.test.tsx in source folders
- React tests run in jsdom
- Coverage available in @godaddy/app-connect via test:coverage

Commands
- Run all tests (root): pnpm test
- Run per package:
  - pnpm --filter @godaddy/app-connect test
  - pnpm --filter @godaddy/react test
- Watch mode:
  - pnpm --filter @godaddy/app-connect test:watch
- CI runs pnpm test on PRs and pushes to main

Notes
- ESLint config packages use test: echo ok (no test suite)
- If adding tests to a package, prefer Vitest to stay consistent


5) Package-specific guidance

A. eslint-config-* packages
- Purpose: Provide Flat ESLint configs for JS, React, TypeScript, and React+TS
- Scripts: lint, pretest (lint), test (echo ok), clean
- Consumers typically:
  - import <config> from 'eslint-config-godaddy(-react)(-typescript)'
  - define a local eslint.config.js using eslint-define-config
- FlatCompat is used where a plugin isn't yet Flat-config compatible (React Hooks)

B. biome-config-godaddy
- Ships biome.json and biome-ts.json to reuse in projects
- Peer dependency: @biomejs/biome >=2.2 <3
- Consumers extend:
  - { "$schema": ".../schema.json", "extends": ["biome-config-godaddy/biome.json"] }
- Note: @godaddy/app-connect currently uses its own biome.json (Biome v1 schema); if you unify, migrate to v2 schema in that package

C. @godaddy/app-connect
- What it does: Verifies signed action requests and webhook subscriptions for GoDaddy Platform
- Key APIs:
  - verifyAction(req, options?) => Result<void>
  - verifyWebhookSubscription(req, options?) => Result<void>
  - Express middleware: createActionMiddleware(), createWebhookMiddleware()
  - Next.js exports under @godaddy/app-connect/next
- Configuration:
  - Action verification requires GODADDY_PUBLIC_KEY (base64-encoded SPKI P-256) via env or options.publicKey
  - Webhook verification uses GODADDY_WEBHOOK_SECRET via env or options.secret
- Signature details:
  - Algorithm: ECDSA-P256-SHA256
  - Version: 1.0
  - Timestamp max age defaults to 300s; configurable via options.maxTimestampAgeSeconds
  - Canonicalization must match middleware exactly; headers to sign: content-length, content-type, x-store-id; never modify order logic without validating against real signatures
- Important files:
  - src/utils/verification.ts (canonicalizeRequest, verifyAction)
  - src/utils/webhook.ts (HMAC-based webhook verification for subscription flow)
  - src/errors/* and src/types/* define standardized errors and Result
  - src/express, src/next adapters
- Scripts:
  - dev/build/typecheck/test/test:watch/test:coverage/lint/check
- Gotchas:
  - There are older webhook verification helpers also present in verification.ts; index exports use utils/webhook.ts—prefer those
  - Uses WebCrypto (crypto.subtle); ensure Node 20+ (CI uses Node 24)
  - Ensure body, header case, and query order are preserved correctly when constructing VerifiableRequest

D. @godaddy/react
- What it is: React checkout component library integrating with commerce APIs
- Build:
  - tsdown builds JS + DTS
  - Tailwind CLI v4 compiles ./src/globals.css to ./dist/index.css (build step handles CSS)
- Testing:
  - Vitest with jsdom; setup at src/tests/setup.ts
- GraphQL:
  - tsconfig configures gql.tada TS plugin with schema: ./schema.graphql and tadaOutputLocation under src/lib/godaddy/graphql-env.d.ts
  - Ensure schema.graphql exists or update plugin config before relying on generated types
- Peer deps: react, react-dom, @tanstack/react-query, react-hook-form
- Exports:
  - "." default entry and "./server" entrypoint; styles exposed via "./styles.css"
- Scripts:
  - dev/dev:https/build/preview/typecheck/test
- Notes:
  - Uses path alias "@/*" for src
  - If adding components, follow existing patterns in src/components/checkout/** and src/components/ui/**

E. @godaddy/localizations
- Purpose: Localization bundles for checkout UI
- Structure: src/<locale>.ts with a shared object shape; exported via src/index.ts
- Scripts: dev/build/typecheck
- To add a locale:
  - Create src/<localeCode>.ts (e.g., esEs.ts)
  - Export it from src/index.ts
  - Document in README


6) Development workflows

Typical loops
- Build all then test all:
  - pnpm build && pnpm test
- Work on a single package:
  - pnpm --filter @godaddy/app-connect dev (watch) or pnpm --filter @godaddy/react dev
  - pnpm --filter @godaddy/react preview (serve built output via Vite)
- Lint/format:
  - pnpm --filter @godaddy/app-connect lint or check
  - pnpm -r lint (runs where defined)
- Typecheck:
  - pnpm -r typecheck

Changesets and releases
- Create a changeset: pnpm changeset and select affected packages
- Versioning PR is opened automatically on main by CI (release workflow)
- Publishing handled by CI using changesets/action with NPM_TOKEN

CI guardrails
- PRs and main push run pnpm test via CICD workflow
- CodeQL runs regularly and on PRs to main


7) Codebase-specific knowledge and guardrails

- Node version alignment: Use Node 24 locally to match CI; .nvmrc=24 is authoritative for CI
- ESM only: Use import/export everywhere; no CommonJS require/module.exports
- ESLint Flat Config: The repo's eslint.config.js extends the base config and disables strict rule at the root to work across varied ES targets; package configs are Flat and ESM
- Biome usage:
  - Reusable config at packages/biome-config-godaddy (v2)
  - @godaddy/app-connect uses a local biome.json (v1 schema) and direct Biome scripts; keep consistent within that package or migrate to v2 if you standardize
- @godaddy/app-connect canonicalization:
  - HEADERS_TO_SIGN is intentionally limited and ordered: [content-length, content-type, x-store-id]
  - Query parameters are included and sorted lexicographically by key; preserve exact formatting
  - Body inclusion depends on content-length; when present, use the original JSON string or JSON.stringify(req.body) consistently
  - Any changes here must be validated against real signatures from the Go middleware
- GraphQL typing in @godaddy/react:
  - tsconfig expects a schema.graphql; ensure it's present or update configuration; the plugin writes types to src/lib/godaddy/graphql-env.d.ts
- Exports maps:
  - Packages define "exports" and "types" fields; maintain stable public API and update typesVersions if adding subpath exports (as done in @godaddy/react for "./server")
- File/directory naming:
  - Use kebab-case for files/dirs (enforced in contributor docs; ESLint/CI expect this convention)
- Result and error schema:
  - Prefer returning Result<T> with standardized GoDaddyError payloads for failures in platform-facing libraries (app-connect)
- Registry:
  - .npmrc set to https://registry.npmjs.org/
- Package manager lock:
  - packageManager: pnpm@10.14.0; use matching pnpm to avoid lockfile churn


8) Troubleshooting and FAQs

- pnpm test fails in CI but not locally:
  - Verify Node version (use Node 24), clean and reinstall: pnpm clean && pnpm install
- Lint at root doesn't touch some packages:
  - Only packages with a lint script will run under pnpm -r lint; app-connect and eslint-config-* will run; react/localizations currently don't define lint scripts
- GraphQL type errors in @godaddy/react:
  - Ensure schema.graphql exists at the configured path or adjust tsconfig plugin config
- Signature verification failing in @godaddy/app-connect:
  - Confirm GODADDY_PUBLIC_KEY is base64 SPKI P-256
  - Check all required headers present:
    - x-godaddy-signature, x-godaddy-signature-algorithm, x-godaddy-signature-version, x-godaddy-signature-timestamp
  - Validate algorithm/version values and timestamp age
  - Inspect canonical string output; header order and content-length/body handling must match Go middleware exactly


9) Appendices

Node, package manager, and env
- Node: .nvmrc=24; engines >=22
- pnpm: 10.14.0 (see packageManager)
- Registry: npmjs.org

Key files
- pnpm-workspace.yaml — includes packages/*
- eslint.config.js — root Flat config wrapper
- .github/workflows/*.yml — CI/CD, release, CodeQL
- CONTRIBUTING.md — documentation and naming rules
- README.md — public overview and package table

Contact and support
- Issues: https://github.com/godaddy/javascript/issues
- Contribution guidelines: CONTRIBUTING.md


Cheat sheet

- Build everything: pnpm build
- Test everything: pnpm test
- Lint where available: pnpm lint
- Typecheck where available: pnpm -r typecheck
- Single package watch: pnpm --filter @godaddy/app-connect dev
- Single package test: pnpm --filter @godaddy/react test
- Create changeset: pnpm changeset
- Clean: pnpm clean

End of AGENTS.md
