# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x: (pre-release)  |

This library follows [Semantic Versioning](https://semver.org/). Security fixes are
backported to the latest minor of the current major version only, unless a specific
enterprise support agreement states otherwise. See
[Versioning & Deprecation Policy](./docs/versioning.md) for the full policy.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report suspected vulnerabilities privately using one of the following channels:

1. **Preferred:** GitHub's private vulnerability reporting — open the
   [Security tab](https://github.com/gwinnem/vue-iframe-wrapper/security) on this
   repository and select **Report a vulnerability**. This creates a private advisory
   visible only to maintainers until it's resolved.
2. **Alternative:** email `geirr@winnem.tech` with a description of the
   issue, steps to reproduce, and (if available) a proof-of-concept. Do not include
   real customer data in the report.

### What to include

- Affected version(s) and how you're consuming the package (npm, vendored, etc.)
- A minimal reproduction (a `srcdoc`/`css`/`js` combination that demonstrates the issue
  is usually sufficient — no need to reproduce a full application)
- The impact you believe the issue has (e.g. sandbox escape, XSS via a specific prop,
  same-origin-policy bypass)

### What is in scope

This library's threat model is documented in full in [`docs/security.md`](./docs/security.md).
In scope, roughly:

- Any way to access or modify a **cross-origin** iframe document through this library's
  API (a same-origin-policy bypass).
- Any way for the library's own code (not content you intentionally injected via `css`/
  `js`/`cssUrls`/`jsUrls`) to execute unintended script or style.
- Supply-chain issues in this package's own dependency tree.

### What is out of scope

- Vulnerabilities in content you inject yourself via `css`/`js`/`cssUrls`/`jsUrls` — this
  library executes what you tell it to, by design (see
  [Security → Asset governance](./docs/security.md#asset-governance)).
- The `sandbox="allow-scripts allow-same-origin"` default being unsuitable for genuinely
  untrusted third-party content — this is a documented, intentional limitation, not a
  vulnerability. See the warning in [`docs/security.md`](./docs/security.md#recommended-sandbox).

## Response targets

| Severity (CVSS-like) | Initial response | Target fix or mitigation |
| -------------------- | ---------------- | ------------------------ |
| Critical             | 1 business day   | 7 days                   |
| High                 | 2 business days  | 14 days                  |
| Medium               | 5 business days  | 30 days                  |
| Low                  | 5 business days  | Best-effort, next minor  |

These are targets, not contractual SLAs, unless your organization has a separate support
agreement that specifies otherwise.

## Disclosure process

1. Report received and privately acknowledged.
2. Maintainers confirm the issue, assess severity, and identify affected versions.
3. A fix is developed and tested privately (typically in a temporary private fork or
   GitHub Security Advisory branch, not a public PR).
4. A new patch/minor release is published containing the fix.
5. A GitHub Security Advisory is published, and the reporter is credited (unless they
   request anonymity).

We ask reporters to allow the response window above to elapse before any public
disclosure, so users have a chance to update before details are public.
