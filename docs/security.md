# Security

## Security model

The library only ever reads or writes to an iframe document the browser already
considers **same-origin**. It does not attempt to bypass the same-origin policy, and it
cannot access cross-origin content — the browser itself enforces that boundary.

Supported:

- `srcdoc` documents
- `about:blank`
- Same-origin URLs

Not supported, and out of scope for this library:

- Cross-origin iframe injection
- Browser security bypasses
- Third-party document access

Attempting to access a cross-origin document raises a typed `IframeError` with
`reason: 'cross-origin'` rather than an uncaught `SecurityError`.

## Recommended `sandbox`

The component defaults to:

```html
sandbox="allow-scripts allow-same-origin"
```

This allows injected scripts to run and keeps the frame same-origin (required for
`contentDocument` access), while still applying the rest of the sandbox's default
restrictions (no top-level navigation, no popups, no forms, unless separately
allowed). Only relax the `sandbox` attribute for content you trust.

::: warning
`allow-scripts` together with `allow-same-origin` is a well-known combination that,
for a **truly untrusted** cross-origin document, can allow the sandbox to be
undermined. This library is designed for same-origin previews of content you or your
organization control (report rendering, CMS previews, internal tools) — it is not a
sandbox for arbitrary third-party or user-submitted HTML.
:::

## Asset governance

Only inject assets you trust. Recommended controls for enterprise deployments:

- **URL allow-lists** — validate `cssUrls`/`jsUrls` against a known-good list before
  passing them as props.
- **Content Security Policy** — set an appropriate CSP on the iframe's document and
  pass a matching `nonce` via `InjectionOptions` for inline `<style>`/`<script>` tags.
- **Audit logging** — listen to the `injected` and `error` events and forward them to
  your logging pipeline.
- **Code review** — treat CSS/JS strings passed into this component the same as any
  other code that will execute in your users' browsers.

## Error types

| Reason                 | Meaning                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `cross-origin`         | The iframe document could not be accessed due to origin policy.       |
| `document-unavailable` | The iframe isn't mounted yet, or has no accessible document.          |
| `injection-failed`     | Document access succeeded, but creating/inserting the element failed. |

All three surface through the `error` event and via `onError` callbacks on
`useIframeInjection`, so a host application can react without wrapping calls in
try/catch itself.
