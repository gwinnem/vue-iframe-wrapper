# Contributing

Thanks for contributing to `vue-iframe-wrapper`. This document covers setup,
standards, and the expectations for a pull request to be reviewed and merged.

## Prerequisites

- Node.js `>= 20.11.0` (see `engines` in `package.json`)
- npm `>= 10.0.0`

## Getting set up

```bash
git clone https://github.com/gwinnem/vue-iframe-wrapper.git
cd vue-iframe-wrapper
npm install
```

## Day-to-day commands

```bash
npm run dev          # component playground (src/)
npm run demo         # standalone demo app (demo/)
npm run test:watch   # vitest in watch mode
npm run test:e2e     # Playwright E2E (needs `npx playwright install` first)
npm run mutation     # Stryker mutation testing
npm run lint         # eslint
npm run format       # prettier --write
npm run typecheck    # vue-tsc --noEmit
npm run docs:dev     # VitePress docs dev server
```

Before opening a PR, run the same check CI runs:

```bash
npm run verify        # lint && typecheck && coverage && build && docs:build (this is what CI gates PRs on)
npm run verify:full   # the above, plus license:check, size, test:e2e, and mutation
```

`verify:full` is not required to pass locally before opening a PR — E2E and mutation
runs live in their own slower, non-blocking CI workflows (`.github/workflows/e2e.yml`,
`.github/workflows/mutation.yml`) — but running it is a good idea before a release or
when you've touched `src/utils`, `src/composables`, or sandbox/injection behavior.

## Coding standards

- **TypeScript, strictly.** `@typescript-eslint/no-explicit-any` is an error, not a
  warning — if you're reaching for `any`, there's almost always a narrower type
  available. Ask in the PR if you're stuck.
- **No default exports from new modules** other than the existing component/library
  entry points — named exports keep tree-shaking and refactors predictable.
- **Match existing formatting.** Prettier is authoritative (`npm run format`); don't
  hand-format around it.
- **Public API changes need a type + a test + a docs update**, in that order of
  visibility: `src/types/iframe.ts` (or the relevant module), a `tests/*.spec.ts` case,
  and an update to [`PARAMETERS.md`](./PARAMETERS.md) / `docs/api/parameters.md` (both —
  they're intentionally mirrored).

## Tests

This project has three testing layers — see [Testing](./docs/guide/testing.md) for the
full breakdown of what each one catches that the others can't.

- **Unit/component (Vitest)**: coverage is gated in CI at 90%
  (statements/branches/functions/lines) — see `vitest.config.ts`. A PR that drops
  coverage below the gate will fail CI. Prefer testing through the public API
  (`mount(IframeWrapper, ...)`, `useIframeInjection(...)`, or the exported utility
  functions) over reaching into internals. Component tests that need `contentDocument`
  to populate must mount with `attachTo: document.body` — jsdom does not reliably
  populate it for detached iframes. See existing tests in `tests/IframeWrapper.spec.ts`
  for the pattern.
- **Mutation (Stryker)**: scoped to `src/utils/**/*.ts` and `src/composables/**/*.ts`
  only (not `.vue` files or type-only modules — see the rationale in
  [Testing → Mutation testing](./docs/guide/testing.md)). If you add logic to either of
  those two directories, a surviving mutant in your area is a signal to strengthen the
  assertion, not just add more test _cases_.
- **E2E (Playwright)**: lives in `tests-e2e/`, driven by a dedicated harness app
  (`tests-e2e/harness/`) rather than `demo/`. Add a scenario here only for behavior that
  genuinely needs a real browser (sandbox enforcement, real cross-origin, real
  navigation timing) — anything jsdom can already verify belongs in `tests/` instead.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) —
`release-it`'s changelog generation depends on it. Common prefixes:

```text
feat: ...       a new feature (minor version bump)
fix: ...        a bug fix (patch version bump)
docs: ...       documentation only
test: ...       test additions/changes only
chore: ...      tooling, deps, CI — no user-facing change
BREAKING CHANGE: ...  in the commit body, for anything requiring a major bump
```

## Pull request expectations

Use the PR template's checklist. In short, a mergeable PR:

- [ ] Passes `npm run verify` locally
- [ ] Includes tests for new/changed behavior
- [ ] Updates `PARAMETERS.md` **and** `docs/api/parameters.md` if props/events/methods
      changed (they are intentionally kept in sync manually — see
      [`ENTERPRISE_READINESS.md`](./ENTERPRISE_READINESS.md) for why this hasn't been
      automated yet)
- [ ] Updates `CHANGELOG.md` is **not** required manually — it's generated at release
      time from commit messages
- [ ] Has a clear description of _why_, not just _what_

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. For security vulnerabilities,
do **not** open a public issue — see [`SECURITY.md`](./SECURITY.md) instead.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating,
you're expected to uphold it.
