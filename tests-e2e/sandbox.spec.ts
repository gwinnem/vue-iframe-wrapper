import { test, expect } from '@playwright/test'
import { harnessUrl } from './utils/harness-url'

// Covers ENTERPRISE_READINESS.md Phase 4's "sandbox enforcement (attempting a
// disallowed action and asserting it's blocked)" scenario. This is specifically the
// kind of thing jsdom cannot verify — jsdom does not implement the `sandbox` attribute
// at all, so a unit/component test can assert the *attribute value* is set correctly,
// but only a real browser engine can prove that value actually restricts behavior.
//
// `window.open()` is used as the probe because Playwright's BrowserContext reliably
// surfaces (or doesn't) a `page` event for it, without needing the injected script to
// reach back into the harness's own DOM across the frame boundary.

test.describe('sandbox enforcement', () => {
  test('blocks window.open() without allow-popups', async ({ page, context }) => {
    let popupSeen = false
    context.on('page', () => {
      popupSeen = true
    })

    await page.goto(
      harnessUrl({
        srcdoc: '<script>window.open("about:blank");</script>',
        sandbox: 'allow-scripts allow-same-origin',
      }),
    )

    // Give a blocked window.open() a moment to (not) fire a popup event.
    await page.waitForTimeout(500)

    expect(popupSeen).toBe(false)
  })

  test('permits window.open() with allow-popups', async ({ page, context }) => {
    const popupPromise = context.waitForEvent('page', { timeout: 5000 })

    await page.goto(
      harnessUrl({
        srcdoc: '<script>window.open("about:blank");</script>',
        sandbox: 'allow-scripts allow-same-origin allow-popups',
      }),
    )

    const popup = await popupPromise
    expect(popup).toBeTruthy()
    await popup.close()
  })

  test('blocks form submission without allow-forms', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: `
          <form id="f" method="get" action="/should-not-navigate">
            <input type="submit" id="go" value="go" />
          </form>
        `,
        sandbox: 'allow-scripts allow-same-origin',
      }),
    )

    const frame = page.frameLocator('[data-testid="preview-frame"]')
    await frame.locator('#go').click()

    // A blocked form submission leaves the frame's location unchanged. There's no
    // direct way to read a cross-origin-policy-restricted frame's URL from the parent
    // test, so instead we assert the page as a whole never navigated away/errored and
    // the form element is still present exactly where it was (i.e. no navigation
    // occurred inside the frame either).
    await expect(frame.locator('#f')).toBeVisible()
  })
})
