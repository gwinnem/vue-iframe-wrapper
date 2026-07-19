<h1 align="center">vue-iframe-wrapper</h1>

<h2 align="center">
  <a href="https://vue-iframe-wrapper.winnem.tech" target="_blank">Documentation Website</a>
</h2>

Enterprise-grade Vue 3 iframe wrapper with controlled CSS and JavaScript injection.

[Full documentation](./docs/index.md) · [Parameters reference](./PARAMETERS.md) · [HTML `<iframe>` reference](./IFRAME_HTML_REFERENCE.md) · [API reference](./docs/api/index.md) · [Telemetry integration](./docs/guide/telemetry.md) · [Feature recommendations](./FEATURE_RECOMMENDATIONS.md) · [Enterprise readiness](./ENTERPRISE_READINESS.md) · [Security model](./docs/security.md)

## Install

```bash
npm install vue-iframe-wrapper vue
```

## Usage

```vue
<script setup lang="ts">
import { IframeWrapper } from 'vue-iframe-wrapper'
import 'vue-iframe-wrapper/style.css'
</script>

<template>
  <IframeWrapper
    srcdoc="<h1>Hello</h1>"
    css="h1 { color: teal; }"
    js="console.log('injected')"
    @injected="(results) => console.log(results)"
    @error="(error) => console.error(error.reason, error.message)"
  />
</template>
```

See [Getting Started](./docs/guide/getting-started.md) for a full walkthrough and
[Examples](./docs/guide/examples.md) for the imperative API.

## Why

Native iframes give you almost no ergonomic help for the common case of previewing or
rendering HTML you control — CSS theming, script injection, and lifecycle events all
require repetitive boilerplate. This library wraps that boilerplate in a small,
strictly-typed, well-tested component and composable, while staying firmly inside the
browser's same-origin security model. See [Security](./docs/security.md) for the full
threat model and recommended `sandbox` configuration.

## Development

```bash
npm install
npm run dev          # local dev server for src/ (component playground)
npm run demo         # standalone demo app (demo/)
npm run test         # vitest
npm run coverage     # vitest with coverage gates (90% min)
npm run mutation     # Stryker mutation testing (src/utils + src/composables)
npm run test:e2e     # Playwright E2E across chromium/firefox/webkit
npm run lint         # eslint
npm run typecheck    # vue-tsc --noEmit
npm run license:check # dependency license compliance (production deps only)
npm run size         # bundle size budget check
npm run build        # library build -> dist/
npm run docs:dev     # VitePress docs dev server
npm run verify       # lint + typecheck + coverage + build + docs:build (fast, CI default)
npm run verify:full  # verify + license:check + size + test:e2e + mutation (slow, full pipeline)
```

See [Testing](./docs/guide/testing.md) for what each testing layer covers and why.

## Project structure

```text
src/
├── components/IframeWrapper.vue      # public component
├── composables/useIframeInjection.ts # reactive injection API
├── utils/iframe-injection.ts         # pure DOM helper functions
├── types/iframe.ts                   # shared type definitions
└── styles/iframe-wrapper.css         # optional default styles

tests/       # Vitest + Vue Test Utils + jsdom (unit/component + accessibility)
tests-e2e/   # Playwright E2E — harness app + injection/sandbox/reload/cross-origin/visual specs
demo/        # standalone Vite app exercising the published component API
docs/     # VitePress documentation site
```

## Requirements

- Node.js `>= 20.11.0`
- npm `>= 10.0.0`
- Vue `^3.0.0` (peer dependency)

## License

MIT © Geirr Winnem — see [LICENSE](./LICENSE).
