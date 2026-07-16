import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// A minimal, purpose-built app for Playwright E2E tests — distinct from `demo/`,
// which is a human-facing showcase. This harness mounts `<IframeWrapper>` with props
// driven entirely by URL query parameters (see `tests-e2e/utils/harness-url.ts`) and
// surfaces every emitted event as a `data-testid` element, so tests can assert on
// plain DOM state instead of parsing console output or reaching into component internals.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      '@enterprise/vue-iframe-wrapper': fileURLToPath(
        new URL('../../src/index.ts', import.meta.url),
      ),
    },
  },
})
