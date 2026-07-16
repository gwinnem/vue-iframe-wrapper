import { test, expect } from '@playwright/test'
import { harnessUrl } from './utils/harness-url'

// Covers ENTERPRISE_READINESS.md Phase 4's "reloadKey flow against real navigation/load
// timing" scenario. jsdom's `load` event on an iframe is largely synthetic; this proves
// the real sequence — reload, native `load` firing again, auto-injection re-running —
// holds up against actual browser navigation timing.

test.describe('reload flow', () => {
  test('reload button re-fires load and re-injects configured assets', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<p id="target">hi</p>',
        css: '#target { color: rgb(0, 128, 0); }',
      }),
    )

    await expect(page.getByTestId('load-count')).toHaveText('1')
    await expect(page.getByTestId('injected-count')).toHaveText('1')

    await page.getByTestId('reload-button').click()

    await expect(page.getByTestId('load-count')).toHaveText('2')
    await expect(page.getByTestId('injected-count')).toHaveText('2')

    const target = page.frameLocator('[data-testid="preview-frame"]').locator('#target')
    await expect(target).toHaveCSS('color', 'rgb(0, 128, 0)')
  })

  test('with injectOnLoad=false, assets inject once and are not repeated on reload', async ({
    page,
  }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<p id="target">hi</p>',
        css: '#target { color: rgb(0, 128, 0); }',
        injectOnLoad: false,
      }),
    )

    await expect(page.getByTestId('load-count')).toHaveText('1')
    await expect(page.getByTestId('injected-count')).toHaveText('1')

    await page.getByTestId('reload-button').click()

    await expect(page.getByTestId('load-count')).toHaveText('2')
    // injected-count must NOT have incremented a second time.
    await expect(page.getByTestId('injected-count')).toHaveText('1')
  })
})
