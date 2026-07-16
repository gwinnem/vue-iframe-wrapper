import { test, expect } from '@playwright/test'
import { harnessUrl } from './utils/harness-url'
import { CROSS_ORIGIN_BASE_URL } from '../playwright.config'

// Covers ENTERPRISE_READINESS.md Phase 4's "genuine cross-origin case (verifying the
// library surfaces `cross-origin` correctly rather than crashing)" scenario. jsdom
// cannot model two real origins at all, so this is the one Phase-4 scenario with no
// equivalent whatsoever in the existing unit/component suite — everything here relies
// on `tests-e2e/cross-origin-fixture` being served on a genuinely different port.

test.describe('cross-origin handling', () => {
  test('surfaces a cross-origin error instead of crashing when auto-injection is attempted', async ({
    page,
  }) => {
    await page.goto(
      harnessUrl({
        src: `${CROSS_ORIGIN_BASE_URL}/`,
        css: 'body { color: red; }',
      }),
    )

    // The iframe still loads successfully — cross-origin content is not blocked from
    // rendering, only from being read/injected into.
    await expect(page.getByTestId('load-count')).toHaveText('1', { timeout: 10_000 })

    // Auto-injection attempts to write into the (cross-origin) document and fails.
    await expect(page.getByTestId('error-count')).toHaveText('1')
    await expect(page.getByTestId('last-error-reason')).toHaveText('cross-origin')

    // Critically: no successful injection was reported, and the page itself is still
    // alive and responsive (i.e. the error didn't throw uncaught / crash the app).
    await expect(page.getByTestId('injected-count')).toHaveText('0')
    await expect(page).toHaveTitle(/harness/i)
  })

  test('the cross-origin document is genuinely inaccessible (sanity check on the fixture)', async ({
    page,
  }) => {
    // This isn't testing the library — it's a sanity check that the fixture really is
    // cross-origin from the harness's point of view, so the test above is meaningful
    // rather than accidentally same-origin due to a misconfigured port.
    await page.goto(harnessUrl({ src: `${CROSS_ORIGIN_BASE_URL}/` }))

    const frameOrigin = new URL(CROSS_ORIGIN_BASE_URL).origin
    const harnessOrigin = new URL(page.url()).origin
    expect(frameOrigin).not.toBe(harnessOrigin)
  })
})
