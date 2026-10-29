# @hmidmismi/auth

Better Auth setup for Postgres (email and password, optional GitHub), with a script that creates a user.

Path: `packages/auth`. Run from the repo root with `pnpm --filter @hmidmismi/auth <script>`.

## Scripts

- `typecheck`: `tsc --noEmit`
- `lint`: `oxlint -c ../../.oxlintrc.json -A no-console .`
- `test`: `vitest run`
- `create-user`: `tsx src/create-user.ts`

## Used by

`@chorusworks/dram`, `@dramonline/hawkeye`

See `ARCHITECTURE.md` and `TODO.md` in the repo root for where it fits.
