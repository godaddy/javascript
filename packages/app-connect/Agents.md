# AGENT.md - Platform Applications Registry API

## Commands
- Build: `pnpm build`
- Dev mode: `pnpm dev`
- Lint: `pnpm lint` (Biome linter)
- Type check: `pnpm check` (Biome checks)
- Test: `pnpm test`, `pnpm test:watch`

## Code Style
- TypeScript with strict typing (no `any`)
- Functions must return `Result<T>` type, check with `if (result.success)`
- Use Zod for validation
- Functional approach - minimal classes
- Naming: lowercase-with-dashes for directories
- Error handling: wrap async in try/catch at lowest level
- Tests: use Vitest with small, focused tests

## Architecture