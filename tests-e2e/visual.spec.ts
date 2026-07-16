import { test, expect } from '@playwright/test'
import { harnessUrl } from './utils/harness-url'

// ENTERPRISE_READINESS.md Phase 5 (visual regression). Runs only under the `visual`
// Playwright project (see playwright.config.ts), pinned to a single browser/OS/
// viewport combination — screenshot comparisons are sensitive to font rendering and
// anti-aliasing differences that have nothing to do with an actual regression, so
// running the same assertion across chromium/firefox/webkit would produce three
// baselines to maintain for no real cross-browser signal.
//
// Scope is deliberately limited to states achievable with the library's *current*
// feature set — no error/loading-slot state (FEATURE_RECOMMENDATIONS.md #3) or
// auto-height state (#4) are covered here, since neither exists yet. Revisit this file
// once either lands.
//
// No baseline images are committed alongside this file. Generate them locally or in CI
// with:
//   npx playwright test tests-e2e/visual.spec.ts --project=visual --update-snapshots
// and commit the resulting `tests-e2e/visual.spec.ts-snapshots/` directory. See
// docs/guide/visual-regression.md for the full baseline-review process this implies —
// don't just re-run --update-snapshots on a red CI run without going through it.

test.describe('visual regression', () => {
  test('unstyled srcdoc renders with browser default styles', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<h1 id="target">Unstyled preview</h1><p>No CSS injected.</p>',
      }),
    )

    const frame = page.frameLocator('[data-testid="preview-frame"]')
    await expect(frame.locator('#target')).toBeVisible()
    await expect(page.getByTestId('load-count')).toHaveText('1')

    await expect(page.locator('[data-testid="preview-frame"]')).toHaveScreenshot(
      'unstyled-preview.png',
      { maxDiffPixelRatio: 0.02 },
    )
  })

  test('dark-themed preview matches its baseline', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<h1 id="target">Themed preview</h1><p>Baseline for visual regression testing.</p>',
        css: `
          body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #0f172a; color: #e2e8f0; }
          h1 { color: #38bdf8; }
        `,
      }),
    )

    await expect(page.getByTestId('injected-count')).toHaveText('1')
    const frame = page.frameLocator('[data-testid="preview-frame"]')
    await expect(frame.locator('#target')).toBeVisible()

    await expect(page.locator('[data-testid="preview-frame"]')).toHaveScreenshot(
      'themed-preview-dark.png',
      { maxDiffPixelRatio: 0.02 },
    )
  })

  test('light-themed preview matches its baseline', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<h1 id="target">Themed preview</h1><p>Baseline for visual regression testing.</p>',
        css: `
          body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; background: #fdf6ec; color: #2a2a2a; }
          h1 { color: #b5651d; }
        `,
      }),
    )

    await expect(page.getByTestId('injected-count')).toHaveText('1')
    const frame = page.frameLocator('[data-testid="preview-frame"]')
    await expect(frame.locator('#target')).toBeVisible()

    await expect(page.locator('[data-testid="preview-frame"]')).toHaveScreenshot(
      'themed-preview-light.png',
      { maxDiffPixelRatio: 0.02 },
    )
  })

  test('JS-injected content mutation matches its baseline', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<div id="target">original</div>',
        css: 'body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; }',
        js: 'document.getElementById("target").innerHTML = "<strong>Mutated by injected JS</strong>";',
      }),
    )

    await expect(page.getByTestId('last-injected-count')).toHaveText('2')
    const frame = page.frameLocator('[data-testid="preview-frame"]')
    await expect(frame.locator('#target strong')).toBeVisible()

    await expect(page.locator('[data-testid="preview-frame"]')).toHaveScreenshot(
      'js-mutated-preview.png',
      { maxDiffPixelRatio: 0.02 },
    )
  })
})
