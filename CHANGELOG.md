# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/). Entries from
`1.1.0` onward are generated automatically at release time by `release-it` +
`@release-it/conventional-changelog` from
[Conventional Commit](https://www.conventionalcommits.org/) messages — see
[`CONTRIBUTING.md`](./CONTRIBUTING.md). This initial entry was written by hand to seed
the file for the `1.0.0` release, which predates that automation.

## [1.0.0] — Initial release

### Added

- `<IframeWrapper />` component: `src`/`srcdoc` content props, `iframeClass`/
  `iframeStyle`/`sandbox`/`title` appearance props, `css`/`cssUrls`/`js`/`jsUrls` asset
  props with automatic injection on load, `autoInject`/`injectOnLoad`/`reloadKey`
  behaviour props.
- `load` / `injected` / `error` events.
- Exposed instance methods: `reload`, `getIframe`, `getWindow`, `getDocument`,
  `injectCss`, `injectCssUrl`, `injectJs`, `injectJsUrl`, `injectConfiguredAssets`.
- `useIframeInjection` composable for custom setups outside the component.
- Low-level DOM injection utilities (`injectCssIntoDocument`, `injectJsIntoDocument`,
  `getSameOriginDocument`, etc.) exported for advanced/SSR-safe use.
- Typed `IframeError` with `cross-origin` / `document-unavailable` / `injection-failed`
  reasons.
- Vitest + Vue Test Utils + jsdom test suite, 90%+ coverage gate.
- VitePress documentation site (Getting Started, Examples, Testing, API/Parameters
  reference, Security model).
- Standalone demo application.
- GitHub Actions CI (lint, typecheck, coverage, build, docs build) and `release-it`
  release automation.

[1.0.0]: https://github.com/gwinnem/vue-iframe-wrapper/releases/tag/v1.0.0
