# The HTML `<iframe>` Element — Complete Attribute Reference

This document explains the **native HTML `<iframe>` element** itself — every attribute
it supports, what each one does, current browser status, and (where relevant) how it
relates to this library's `<IframeWrapper />` component. For the wrapper component's
own props, see [`PARAMETERS.md`](./PARAMETERS.md) instead; this document is the
lower-level reference those props are built on top of.

---

## Table of contents

- [Minimal example](#minimal-example)
- [Content attributes](#content-attributes) — `src`, `srcdoc`
- [Sandboxing](#sandboxing) — `sandbox` and every token it accepts
- [Permissions](#permissions) — `allow`, and the deprecated `allowfullscreen` / `allowpaymentrequest`
- [Sizing & layout](#sizing--layout) — `width`, `height`, and the deprecated `frameborder`/`scrolling`/`marginwidth`/`marginheight`/`align`
- [Loading behavior](#loading-behavior) — `loading`
- [Naming & targeting](#naming--targeting) — `name`
- [Privacy](#privacy) — `referrerpolicy`
- [Accessibility](#accessibility) — `title`
- [Non-standard / experimental](#non-standard--experimental) — `csp`
- [Deprecated / obsolete attributes](#deprecated--obsolete-attributes)
- [Global attributes that matter in practice](#global-attributes-that-matter-in-practice)
- [DOM properties & events (not attributes, but related)](#dom-properties--events-not-attributes-but-related)
- [Full attribute table](#full-attribute-table)
- [Mapping to `<IframeWrapper />`](#mapping-to-iframewrapper-)

---

## Minimal example

```html
<iframe
  src="/report.html"
  title="Quarterly report preview"
  sandbox="allow-scripts allow-same-origin"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
  width="800"
  height="600"
></iframe>
```

Nearly every attribute below is optional; browsers render a functional (if
under-specified) iframe with only `src` or `srcdoc` present. The example above reflects
what a security- and accessibility-conscious usage looks like in practice.

---

## Content attributes

### `src`

The URL of the document to embed. Can point to same-origin or cross-origin content —
the browser enforces the same-origin policy on the result either way; `src` itself has
no restriction on what URL you put there.

```html
<iframe src="https://example.com/embed"></iframe>
```

### `srcdoc`

Inline HTML to render inside the frame, as a string, instead of fetching a URL. When
both `src` and `srcdoc` are present, conforming browsers use `srcdoc` and treat `src` as
a fallback for browsers that don't support `srcdoc` (Internet Explorer and legacy Edge —
not a practical concern in 2026, but the fallback behavior is still part of the spec).

```html
<iframe srcdoc="<p>Rendered inline, no request made.</p>"></iframe>
```

A `srcdoc` document's origin is derived from the embedding document, so it is always
same-origin with the page that contains the iframe (unless the iframe itself is
sandboxed with `allow-same-origin` omitted, which forces an opaque/null origin instead).

---

## Sandboxing

### `sandbox`

Applies extra restrictions to the embedded content. **Absence of the attribute means no
sandboxing at all** — the iframe runs with the same privileges it would have as a
top-level page. Presence of the attribute with an **empty value** (`sandbox=""`)
applies the maximum restriction set (scripts disabled, forms disabled, same-origin
treated as a distinct opaque origin, etc.). Each token below re-enables one specific
capability.

| Token                                      | Re-enables                                                                                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `allow-downloads`                          | Downloading files, including via a `download` attribute on a link.                                                                                                                                                                          |
| `allow-forms`                              | Form submission.                                                                                                                                                                                                                            |
| `allow-modals`                             | `window.alert()`, `confirm()`, `prompt()`, and the `beforeunload` dialog.                                                                                                                                                                   |
| `allow-orientation-lock`                   | The Screen Orientation API's `lock()` method.                                                                                                                                                                                               |
| `allow-pointer-lock`                       | The Pointer Lock API.                                                                                                                                                                                                                       |
| `allow-popups`                             | `window.open()`, `target="_blank"`, `showModalDialog()`.                                                                                                                                                                                    |
| `allow-popups-to-escape-sandbox`           | Popups opened from the frame are _not_ themselves sandboxed (without this, a popup inherits the opener's sandbox restrictions).                                                                                                             |
| `allow-presentation`                       | Starting a presentation session (Presentation API).                                                                                                                                                                                         |
| `allow-same-origin`                        | Treats the content as being from its actual origin for same-origin-policy purposes, rather than forcing a unique opaque origin. **Required for `contentDocument`/`contentWindow` access** — this library's injection features depend on it. |
| `allow-scripts`                            | JavaScript execution inside the frame. Does **not** re-enable popups or automatic top-level navigation by itself.                                                                                                                           |
| `allow-storage-access-by-user-activation`  | Calling `document.requestStorageAccess()` from within the frame.                                                                                                                                                                            |
| `allow-top-navigation`                     | Navigating the _top-level_ browsing context (not just itself).                                                                                                                                                                              |
| `allow-top-navigation-by-user-activation`  | Same as above, but only in response to a user gesture.                                                                                                                                                                                      |
| `allow-top-navigation-to-custom-protocols` | Top-level navigation to a non-`http(s)` URL scheme (e.g. `mailto:`, a custom app protocol).                                                                                                                                                 |

**The combination that matters most for this library:**
`sandbox="allow-scripts allow-same-origin"` — this is `<IframeWrapper />`'s default. It
allows injected `js` to run and allows `getDocument()`/`getWindow()`/injection to work
at all, since those require same-origin access. See
[`docs/security.md`](./docs/security.md) for why this specific combination is
appropriate for _content you control_ but not for genuinely untrusted third-party HTML.

```html
<!-- Maximum restriction: scripts and forms disabled, forced opaque origin -->
<iframe sandbox src="/untrusted-preview.html"></iframe>

<!-- This library's default -->
<iframe sandbox="allow-scripts allow-same-origin" src="/report.html"></iframe>
```

---

## Permissions

### `allow`

A [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)
string controlling which browser features the embedded content may use — independent
of `sandbox`, which governs document/scripting behavior rather than device/API access.

Common directives:

| Directive                   | Controls                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| `accelerometer`             | Access to accelerometer sensor data.                                  |
| `autoplay`                  | Autoplaying media.                                                    |
| `camera`                    | Camera access (`getUserMedia`).                                       |
| `clipboard-write`           | Programmatic clipboard writes.                                        |
| `encrypted-media`           | Encrypted Media Extensions (DRM playback).                            |
| `fullscreen`                | The Fullscreen API — see also the deprecated `allowfullscreen` below. |
| `geolocation`               | The Geolocation API.                                                  |
| `gyroscope`                 | Gyroscope sensor data.                                                |
| `microphone`                | Microphone access.                                                    |
| `payment`                   | The Payment Request API.                                              |
| `picture-in-picture`        | Picture-in-Picture video.                                             |
| `publickey-credentials-get` | WebAuthn credential retrieval.                                        |
| `screen-wake-lock`          | The Screen Wake Lock API.                                             |
| `web-share`                 | The Web Share API.                                                    |
| `xr-spatial-tracking`       | WebXR device tracking.                                                |

```html
<iframe src="/video-embed.html" allow="autoplay; picture-in-picture; fullscreen"></iframe>
```

### `allowfullscreen` (legacy boolean)

The older, single-purpose way to permit the Fullscreen API, predating the general
`allow` Permissions Policy syntax. Still widely used (many third-party embed snippets —
video players, maps — still emit it) and still functional, but `allow="fullscreen"` is
the modern equivalent and should be preferred in new code. Some embeds set both for
maximum compatibility.

```html
<iframe src="/video-embed.html" allowfullscreen></iframe>
```

### `allowpaymentrequest` (deprecated)

Formerly permitted the Payment Request API inside the frame. Removed from the HTML
spec; use `allow="payment"` instead.

---

## Sizing & layout

### `width` / `height`

Presentational sizing attributes, in CSS pixels, applied as the initial rendered size.
Prefer CSS (`width`/`height` or `iframeStyle` in this library's terms) for anything
beyond a static default, since CSS takes precedence and is easier to make responsive.

```html
<iframe src="/report.html" width="800" height="600"></iframe>
```

### Deprecated sizing/layout attributes

These still parse without error in all current browsers but have no standardized effect
and should not be used in new code — use CSS instead:

| Attribute                      | Replaced by                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `frameborder`                  | CSS `border` (default is now borderless in all modern browsers regardless of this attribute). |
| `scrolling`                    | CSS `overflow` on the iframe's contents.                                                      |
| `marginwidth` / `marginheight` | CSS `margin`/`padding` inside the framed document.                                            |
| `align`                        | CSS `float`/`vertical-align`/flexbox/grid, depending on intent.                               |

---

## Loading behavior

### `loading`

| Value             | Behavior                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `eager` (default) | Loads immediately, regardless of where it is in the viewport.                                       |
| `lazy`            | Defers loading until the iframe is near the viewport, the same mechanism as `<img loading="lazy">`. |

```html
<iframe src="/below-the-fold-widget.html" loading="lazy"></iframe>
```

Useful for pages embedding several iframes (e.g. a dashboard of report previews) where
only a few are visible at once.

---

## Naming & targeting

### `name`

Assigns a browsing-context name, usable as a `target` for a `<form>`, `<a>`, or another
iframe's navigation, and accessible from script as `window.frames['name']`. Rarely
needed for the "preview/render controlled content" use case this library targets, but
relevant if the embedded document contains links/forms that should open elsewhere in
the frame tree.

```html
<iframe name="preview-frame" src="/report.html"></iframe>
<a href="/other-report.html" target="preview-frame">Open other report here</a>
```

---

## Privacy

### `referrerpolicy`

Controls what `Referer` header (and `document.referrer` inside the frame) is sent when
the iframe fetches its content.

| Value                                               | Behavior                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `no-referrer`                                       | Never send a referrer.                                                                                  |
| `no-referrer-when-downgrade`                        | Send referrer unless navigating from HTTPS to HTTP.                                                     |
| `origin`                                            | Send only the origin (scheme+host+port), not the full URL.                                              |
| `origin-when-cross-origin`                          | Full URL for same-origin, origin-only for cross-origin.                                                 |
| `same-origin`                                       | Send referrer only for same-origin requests, none otherwise.                                            |
| `strict-origin`                                     | Origin only, and never on a downgrade.                                                                  |
| `strict-origin-when-cross-origin` (browser default) | Full URL same-origin, origin-only cross-origin, never on downgrade.                                     |
| `unsafe-url`                                        | Always send the full URL, including cross-origin and downgrades. Avoid — leaks path/query data broadly. |

```html
<iframe src="https://third-party.example/widget" referrerpolicy="no-referrer"></iframe>
```

---

## Accessibility

### `title`

The single most important accessibility attribute on an iframe. Assistive technology
announces it to describe what the embedded content _is_, since the iframe itself has
no visible label the way a button or link would. There is no automatic fallback (the
frame's own `<title>`, if it has one, is **not** used by all assistive technology
consistently) — always set it explicitly on the `<iframe>` tag itself.

```html
<iframe src="/report.html" title="Q3 financial report preview"></iframe>
```

See [`docs/accessibility.md`](./docs/accessibility.md) for how this library tests and
documents the accessibility contract around this attribute.

---

## Non-standard / experimental

### `csp`

An experimental, Chromium-only attribute letting the embedding page assert a Content-
Security-Policy that the framed document must already comply with (the framed
document's own CSP, if any, still applies independently — this is an additional
constraint imposed from outside, not a replacement). Not in the HTML Living Standard,
not supported in Firefox/Safari as of this writing — treat as forward-looking, not
something to depend on for real security boundaries today.

---

## Deprecated / obsolete attributes

Attributes that appear in older code/tutorials but should not be used:

| Attribute                      | Status                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `align`                        | Deprecated — use CSS.                                                                            |
| `frameborder`                  | Deprecated — use CSS `border`.                                                                   |
| `longdesc`                     | Deprecated — was meant to link to a long description; use ARIA or in-page text instead.          |
| `marginheight` / `marginwidth` | Deprecated — use CSS.                                                                            |
| `scrolling`                    | Deprecated — use CSS `overflow`.                                                                 |
| `seamless`                     | Removed from the spec entirely (was briefly proposed, never widely implemented, then withdrawn). |
| `allowpaymentrequest`          | Deprecated — use `allow="payment"`.                                                              |

---

## Global attributes that matter in practice

Not iframe-specific, but routinely used alongside the attributes above:

- **`id`, `class`, `style`** — standard targeting/styling hooks.
- **`tabindex`** — rarely needed; iframes are focusable by default when they contain
  focusable content.
- **`aria-*`** — `aria-label`/`aria-labelledby` can supplement or, in some
  implementations, substitute for `title`, but `title` remains the most universally
  supported mechanism and should be set regardless.
- **`data-*`** — arbitrary data attributes; this library uses its own
  `data-viw-id` attribute internally on _injected elements inside the iframe document_
  (not on the `<iframe>` tag itself) to track and replace assets by id.

---

## DOM properties & events (not attributes, but related)

These aren't HTML attributes — they're accessed from JavaScript — but are the other
half of the platform surface this document is describing:

| Member                   | What it gives you                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `iframe.contentWindow`   | The embedded browsing context's `Window`, if same-origin (or if sandboxed with `allow-same-origin`). Cross-origin access throws/returns a restricted proxy.                                                                                                                                                                                                                      |
| `iframe.contentDocument` | The embedded `Document`, same access rules as `contentWindow`. This is what `getSameOriginDocument()` in this library wraps with error handling.                                                                                                                                                                                                                                 |
| `load` event             | Fires once the frame's document (and its sub-resources, same as a top-level page's `load` event) finishes loading. This is what `<IframeWrapper />`'s `load` event and auto-injection are built on.                                                                                                                                                                              |
| `window.postMessage()`   | The sanctioned way to communicate across a same-origin **or cross-origin** boundary without violating the same-origin policy — always specify a `targetOrigin`, never `'*'`, for anything containing meaningful data. Not currently wrapped by this library; tracked as a proposed feature in [`FEATURE_RECOMMENDATIONS.md`](./FEATURE_RECOMMENDATIONS.md) (`useIframeMessage`). |

---

## Full attribute table

| Attribute                      | Category                | Status                       |
| ------------------------------ | ----------------------- | ---------------------------- |
| `src`                          | Content                 | Standard                     |
| `srcdoc`                       | Content                 | Standard                     |
| `sandbox`                      | Security                | Standard                     |
| `allow`                        | Permissions             | Standard                     |
| `allowfullscreen`              | Permissions             | Legacy, still functional     |
| `allowpaymentrequest`          | Permissions             | Deprecated                   |
| `width`                        | Sizing                  | Standard                     |
| `height`                       | Sizing                  | Standard                     |
| `loading`                      | Performance             | Standard                     |
| `name`                         | Targeting               | Standard                     |
| `referrerpolicy`               | Privacy                 | Standard                     |
| `title`                        | Accessibility           | Standard — treat as required |
| `csp`                          | Security (experimental) | Non-standard, Chromium-only  |
| `frameborder`                  | Layout                  | Deprecated                   |
| `scrolling`                    | Layout                  | Deprecated                   |
| `marginwidth` / `marginheight` | Layout                  | Deprecated                   |
| `align`                        | Layout                  | Deprecated                   |
| `longdesc`                     | Accessibility           | Deprecated                   |
| `seamless`                     | Layout                  | Removed from spec            |

---

## Mapping to `<IframeWrapper />`

How this library's component currently relates to the native attribute surface above —
see [`PARAMETERS.md`](./PARAMETERS.md) for the full prop reference:

| Native attribute                                                           | Exposed today as                    | Notes                                                                                                                                                                                                  |
| -------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src`                                                                      | `src` prop                          | Direct passthrough.                                                                                                                                                                                    |
| `srcdoc`                                                                   | `srcdoc` prop                       | Direct passthrough.                                                                                                                                                                                    |
| `sandbox`                                                                  | `sandbox` prop                      | Defaults to `"allow-scripts allow-same-origin"` rather than being left unset.                                                                                                                          |
| `title`                                                                    | `title` prop                        | Not enforced as required at the type level; treated as required by convention and by the accessibility test suite.                                                                                     |
| `class` / `style`                                                          | `iframeClass` / `iframeStyle` props | Named distinctly from a plain `class`/`style` binding to make clear they style the _frame_, not its contents.                                                                                          |
| `allow`                                                                    | _Not yet exposed_                   | Proposed in [`FEATURE_RECOMMENDATIONS.md`](./FEATURE_RECOMMENDATIONS.md) #2.                                                                                                                           |
| `referrerpolicy`                                                           | _Not yet exposed_                   | Same proposal as above.                                                                                                                                                                                |
| `loading`                                                                  | _Not yet exposed_                   | Same proposal as above.                                                                                                                                                                                |
| `allowfullscreen`                                                          | _Not yet exposed_                   | Same proposal as above.                                                                                                                                                                                |
| `name`                                                                     | _Not yet exposed_                   | No current proposal — low-demand for the preview/render use case this library targets; open an issue using the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.md) if you need it. |
| `width` / `height`                                                         | _Not exposed as discrete props_     | Use `iframeStyle`/`iframeClass` for sizing instead — see [Getting Started → Sizing the iframe](./docs/guide/getting-started.md#sizing-the-iframe).                                                     |
| Everything under [Deprecated / obsolete](#deprecated--obsolete-attributes) | _Intentionally not exposed_         | Not planned; these have no standardized effect in current browsers.                                                                                                                                    |

Everything **not** in the left column of that table (the injection-related behavior —
`css`, `cssUrls`, `js`, `jsUrls`, `autoInject`, `injectOnLoad`, `reloadKey`, and the
exposed instance methods) is this library's own addition on top of the native element,
not a passthrough of a native attribute — see [`PARAMETERS.md`](./PARAMETERS.md) for
those.
