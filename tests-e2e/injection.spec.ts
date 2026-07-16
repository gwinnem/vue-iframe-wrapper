import { test, expect } from '@playwright/test'
import { harnessUrl } from './utils/harness-url'

// Covers ENTERPRISE_READINESS.md Phase 4's "same-origin injection against a real
// browser engine" scenario — jsdom (used by tests/*.spec.ts) can create a Document via
// `document.implementation.createHTMLDocument`, but only a real browser proves the
// injected <style>/<script> elements actually take effect (computed styles, script
// side effects) inside a genuine same-origin iframe document.

test.describe('same-origin injection', () => {
  test('injects CSS that visibly affects the iframe document', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<p id="target">hi</p>',
        css: '#target { color: rgb(255, 0, 0); }',
      }),
    )

    const target = page.frameLocator('[data-testid="preview-frame"]').locator('#target')
    await expect(target).toHaveCSS('color', 'rgb(255, 0, 0)')

    await expect(page.getByTestId('injected-count')).toHaveText('1')
    await expect(page.getByTestId('last-injected-count')).toHaveText('1')
    await expect(page.getByTestId('error-count')).toHaveText('0')
  })

  test('injects JS that mutates the iframe document', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<p id="target">original</p>',
        js: 'document.getElementById("target").textContent = "mutated by injected js";',
      }),
    )

    const target = page.frameLocator('[data-testid="preview-frame"]').locator('#target')
    await expect(target).toHaveText('mutated by injected js')
  })

  test('injects both CSS and JS together and reports the combined count', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<p id="target">hi</p>',
        css: '#target { font-weight: bold; }',
        js: 'document.getElementById("target").dataset.touched = "yes";',
      }),
    )

    const target = page.frameLocator('[data-testid="preview-frame"]').locator('#target')
    await expect(target).toHaveCSS('font-weight', '700')
    await expect(target).toHaveAttribute('data-touched', 'yes')
    await expect(page.getByTestId('last-injected-count')).toHaveText('2')
  })

  test('does not auto-inject when autoInject is false', async ({ page }) => {
    await page.goto(
      harnessUrl({
        srcdoc: '<p id="target">hi</p>',
        css: '#target { color: rgb(255, 0, 0); }',
        autoInject: false,
      }),
    )

    const target = page.frameLocator('[data-testid="preview-frame"]').locator('#target')
    await expect(target).not.toHaveCSS('color', 'rgb(255, 0, 0)')
    await expect(page.getByTestId('injected-count')).toHaveText('0')
  })
})
