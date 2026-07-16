import { defineConfig, devices } from '@playwright/test'

const HARNESS_PORT = 4300
const CROSS_ORIGIN_PORT = 4301

export const CROSS_ORIGIN_BASE_URL = `http://localhost:${CROSS_ORIGIN_PORT}`

export default defineConfig({
  testDir: './tests-e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    baseURL: `http://localhost:${HARNESS_PORT}`,
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      // Freezes CSS animations/transitions and caret blinking before capturing —
      // the single biggest source of screenshot flakiness that has nothing to do
      // with an actual visual regression.
      animations: 'disabled',
    },
  },

  // Chromium, Firefox, and WebKit correspond to the versions documented in
  // docs/browser-support.md — this is the suite that turns that document from an
  // assertion into a tested guarantee (see ENTERPRISE_READINESS.md Phase 4).
  //
  // visual.spec.ts is deliberately excluded from all three and run only under the
  // dedicated `visual` project below, pinned to a single browser/OS combination.
  // Screenshot comparisons are sensitive to font rendering and anti-aliasing, which
  // differ across engines (and across OSes for the same engine) — running the same
  // visual assertion under chromium/firefox/webkit would produce three baselines to
  // maintain and three sources of unrelated flakiness for a check that isn't testing
  // cross-browser behavior in the first place. See ENTERPRISE_READINESS.md Phase 5 and
  // docs/guide/visual-regression.md for the baseline-review process this implies.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: '**/visual.spec.ts' },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: '**/visual.spec.ts' },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testIgnore: '**/visual.spec.ts' },
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1000, height: 700 },
      },
      testMatch: '**/visual.spec.ts',
    },
  ],

  webServer: [
    {
      command: `npx vite --config tests-e2e/harness/vite.config.ts --port ${HARNESS_PORT} --strictPort`,
      port: HARNESS_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // A second origin (different port = different origin to the browser), used only
      // by tests-e2e/cross-origin.spec.ts. Plain Python http.server is enough for a
      // single static file and avoids adding another JS dependency just for this.
      command: `python3 -m http.server ${CROSS_ORIGIN_PORT} --directory tests-e2e/cross-origin-fixture`,
      port: CROSS_ORIGIN_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
