# Visual Regression Testing

This page is the baseline-review process that [Enterprise Readiness → Phase
5](/enterprise-readiness) identified as the actual cost of visual regression testing —
the tooling (`toHaveScreenshot()`) is a few lines; deciding who approves a changed
screenshot and when a diff is expected versus a regression is the part that actually
needs a process, not just a config file.

## What's covered today

`tests-e2e/visual.spec.ts` — four scenarios, all built on states achievable with the
library's _current_ feature set:

| Scenario                        | Snapshot                   |
| ------------------------------- | -------------------------- |
| Unstyled `srcdoc`, no injection | `unstyled-preview.png`     |
| Dark-themed CSS injection       | `themed-preview-dark.png`  |
| Light-themed CSS injection      | `themed-preview-light.png` |
| JS-mutated content              | `js-mutated-preview.png`   |

**Not covered, on purpose:** an error/loading-slot state and an auto-height state.
Neither exists in the library yet — they're proposals in
[`FEATURE_RECOMMENDATIONS.md`](/feature-recommendations) (#3 and #4). Add scenarios for
them here once they land; committing placeholder screenshots for features that don't
exist would just be baselines to immediately break.

## Why one pinned browser, not three

Visual tests run only under the dedicated `visual` Playwright project (see
`playwright.config.ts`), pinned to Chromium at a fixed 1000×700 viewport. `chromium`,
`firefox`, and `webkit` explicitly ignore `visual.spec.ts`. Screenshot comparison is
sensitive to font rendering, sub-pixel anti-aliasing, and scrollbar rendering — real
differences between browser engines (and even between OSes running the same engine)
that have nothing to do with whether _this library_ introduced a regression. Running
the same assertion three ways would triple the baseline-maintenance cost for no
corresponding increase in signal; cross-engine behavior is already what Phase 4's
functional E2E suite is for.

## Generating and updating baselines

No baseline images are committed by default — the first run for a new or changed
scenario always fails with "no baseline found," which is expected, not a bug.

```bash
# Generate/update every visual baseline
npx playwright test tests-e2e/visual.spec.ts --project=visual --update-snapshots

# Generate/update a single scenario
npx playwright test tests-e2e/visual.spec.ts --project=visual --update-snapshots -g "dark-themed"
```

Commit the resulting `tests-e2e/visual.spec.ts-snapshots/` directory alongside your
change. Snapshot filenames encode the project and platform
(e.g. `themed-preview-dark-visual-linux.png`) — CI (Linux runners) and most developer
machines (macOS/Windows) will produce differently-named baselines. **Only the CI-
generated (Linux) baseline is authoritative** for what actually gates PRs; a locally
regenerated baseline on macOS is useful for local iteration but isn't what
`.github/workflows/e2e.yml` compares against.

## The review process

This is the part that's a decision, not a tool setting:

1. **A visual diff on an otherwise-passing PR is a stop sign, not noise.** Playwright
   fails the test and attaches a diff image (red/green highlight) to the HTML report
   (`playwright-report/`, uploaded as a CI artifact — see
   `.github/workflows/e2e.yml`). Open it before doing anything else.
2. **Ask "did I mean to change this?"** before regenerating anything.
   - If the PR touches CSS defaults, the component's own `<style>` block, or the
     harness/theming used in the test itself → a diff is expected. Regenerate,
     visually re-check the new PNG yourself, and call it out explicitly in the PR
     description with a before/after (or just the new image).
   - If the PR is unrelated to styling (e.g. a composable refactor, a new prop
     unrelated to appearance) → an unexpected diff is a real signal. Investigate
     before touching snapshots — don't regenerate to make CI green.
3. **A snapshot update needs the same review as a code change.** `git diff` doesn't
   show PNG content usefully, so the PR description doing the explaining (point 2)
   matters more here than for a normal code diff — a reviewer approving a binary file
   they can't diff in the terminal needs the context stated, not implied.
4. **CODEOWNERS applies.** `tests-e2e/**` is covered by the same
   `.github/CODEOWNERS` entry as the rest of the test suite — whoever owns that path
   is the approver for a snapshot change, same as any other file under it. (See
   `ENTERPRISE_READINESS.md` Phase 1 for the outstanding placeholder-handle caveat that
   also applies to this line.)
5. **Flaky, not failing?** A genuinely flaky visual test (same code, intermittent
   diff) is itself a bug — usually an unfrozen animation, a font not yet loaded, or a
   timing race before the screenshot is taken. Fix the test (see "Reducing flakiness"
   below) rather than raising `maxDiffPixelRatio` to paper over it; a tolerance loose
   enough to hide flakiness is also loose enough to hide a real regression.

## Reducing flakiness

Already configured, so new scenarios inherit these for free:

- `expect.toHaveScreenshot.animations: 'disabled'` (global, in `playwright.config.ts`)
  freezes CSS animations/transitions and caret blinking before capture.
- A fixed `viewport: { width: 1000, height: 700 }` on the `visual` project, so layout
  doesn't shift with whatever the default viewport happens to be.
- `maxDiffPixelRatio: 0.02` per assertion — a small tolerance for genuine sub-pixel
  rendering noise, not a substitute for the flakiness triage above.

If a new scenario is still flaky after that, the usual next culprits are: content that
loads asynchronously after the `load` event (wait for it explicitly before the
screenshot call, the way each existing test waits on `injected-count`/`last-injected-
count` first), or a web font that hasn't finished loading (wait on
`document.fonts.ready` inside the harness, or avoid custom fonts in visual fixtures
entirely — the existing scenarios deliberately use `system-ui` for this reason).

## CI behavior

`.github/workflows/e2e.yml` runs all Playwright projects, including `visual`, on every
push/PR — a visual regression fails the same build as a functional one. This is a
deliberate choice: a silent, un-gated visual test would just be a report nobody reads.
The tradeoff is that a legitimate visual change now requires the PR author to update
snapshots _before_ merging (see above) — slower, but the point of gating on it at all.
