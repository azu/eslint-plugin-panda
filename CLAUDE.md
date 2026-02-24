# CLAUDE.md

## Project Overview

Fork of [chakra-ui/eslint-plugin-panda](https://github.com/chakra-ui/eslint-plugin-panda). Provides ESLint rules plus
oxlint-compatible rule implementations (`plugin/src/oxlint/`).

Package name: `@azu/eslint-plugin-panda-oxc`

## Directory Structure

- `plugin/src/rules/` — ESLint rules (from upstream)
- `plugin/src/oxlint/rules/` — oxlint-compatible rules (added in this fork)
- `plugin/src/oxlint/context.ts` — Loading and generating panda-data.json
- `plugin/src/oxlint/helpers.ts` — oxlint rule helpers
- `plugin/tests/` — ESLint tests (shared with oxlint tests)
- `sandbox/` — ESLint config examples

## Test Strategy

ESLint and oxlint rules share the same test files.

- `pnpm test` — Run both ESLint and oxlint tests
- `pnpm test:eslint` — ESLint tests only
- `pnpm test:oxlint` — oxlint tests only

oxlint tests use `vitest.config.oxlint.mts` with `resolve.alias` to swap imports:

- `../src/rules/` → `../src/oxlint/rules/` (rule implementations)
- `../test-utils` → `../test-utils-oxlint` (RuleTester with settings)

oxlint rules must maintain the same export shape as ESLint rules (`export default rule` + `export const RULE_NAME`).

## Syncing from Upstream

Upstream: https://github.com/chakra-ui/eslint-plugin-panda

```bash
git remote add upstream https://github.com/chakra-ui/eslint-plugin-panda.git
git fetch upstream
git merge upstream/main
```

Common conflict areas:

- `plugin/src/rules/` — Upstream rule changes. After merging, apply the same changes to the oxlint versions
- `package.json` — Different package name and scripts. Keep fork values
- `.github/workflows/` — Different CI configs. Keep fork values
- `plugin/package.json` — Different package name. Keep fork values

Steps:

1. `git fetch upstream && git merge upstream/main`
2. Resolve conflicts (prefer fork-side changes where noted above)
3. If upstream ESLint rules changed, apply the same changes to oxlint rules
4. Run `pnpm test` to verify both ESLint and oxlint tests pass

## Release

Uses npm OIDC Trusted Publisher. `.github/workflows/release-oxc.yml` publishes on PR merge.

1. Update the version in `plugin/package.json`
2. Create a release PR (`.github/workflows/create-release-pr.yml`)
3. Merging the PR triggers the release

## Commands

- `pnpm test` — Run all tests
- `pnpm lint` — ESLint
- `pnpm typecheck` — TypeScript type checking
- `pnpm prettier` — Format check
- `pnpm build` — Build
- `pnpm build:docs` — Generate documentation
