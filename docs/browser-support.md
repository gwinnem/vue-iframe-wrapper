# Browser Support Matrix

## Supported browsers

| Browser                  | Minimum version | Notes                                                                                                                                                     |
| ------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome / Edge (Chromium) | 111+            | Baseline for `srcdoc`, `sandbox`, and CSP `nonce` on injected elements.                                                                                   |
| Firefox                  | 115 (ESR)+      | Full support.                                                                                                                                             |
| Safari                   | 16.4+           | `srcdoc` and `sandbox` supported; verify CSP `nonce` propagation into `srcdoc` documents before relying on it (historically inconsistent across engines). |

These versions reflect the browser engines targeted by the library's build output
(`ES2020`+, per `@vue/tsconfig`) and by Vue 3 itself — not necessarily the full extent of
what works. If your organization needs to support older browsers, you will likely need
additional polyfills independent of this library.

## What "supported" means here

- The **library's own code** (composables, utilities, component logic) runs correctly.
- The **injection primitives** (`<style>`, `<link rel="stylesheet">`, `<script>`,
  `<script src>`) behave the same way jQuery/vanilla DOM APIs would on that browser —
  this library does not add browser-specific workarounds beyond what's noted below.
- `sandbox` attribute semantics follow the [HTML Living Standard](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox)
  as implemented by each engine; enforcement details (e.g. exact `allow-*` token
  behavior) are the browser's responsibility, not this library's.

## Known engine differences

- **CSP `nonce` on injected elements** (`InjectionOptions.nonce`): nonce propagation into
  dynamically created `<style>`/`<script>` elements inside a `srcdoc` document has
  historically had inconsistent behavior across engines when the document itself sets a
  strict CSP via `<meta http-equiv="Content-Security-Policy">`. If you rely on `nonce`,
  verify against your specific target browsers and CSP configuration — this is tracked
  as a real-browser test gap, not yet covered by
  [automated E2E testing](/enterprise-readiness#phase-4--real-browser-e2e-suite-sds-phase-9-1-2-weeks).
- **`ResizeObserver`** (used by the proposed auto-height feature in
  [`FEATURE_RECOMMENDATIONS.md`](/feature-recommendations) #4, not yet implemented):
  supported in all browsers listed above; no polyfill is planned since the minimum
  versions already cover it natively.

## Verification status

⚠️ The matrix above reflects the **targeted** support surface based on the build
configuration and underlying platform APIs used. It is not yet backed by an automated
cross-browser test suite — that is
[Phase 4 of the Enterprise Readiness plan](/enterprise-readiness#phase-4--real-browser-e2e-suite-sds-phase-9-1-2-weeks)
(Playwright across Chromium/Firefox/WebKit). Until that lands, treat this matrix as a
documented intent rather than a tested guarantee, and file an issue using the
[bug report template](https://github.com/enterprise/vue-iframe-wrapper/issues/new?template=bug_report.md)
if you find a discrepancy on a listed browser/version.

## Node.js (build-time only)

Node.js is only relevant for building the library and running its test suite — none of
this ships to end users' browsers.

| Requirement | Version      |
| ----------- | ------------ |
| Node.js     | `>= 20.11.0` |
| npm         | `>= 10.0.0`  |

See `engines` in `package.json`.
