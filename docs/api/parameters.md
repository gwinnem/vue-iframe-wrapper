# Parameters

Exhaustive reference for every prop, event, exposed method, and supporting type on
`<IframeWrapper />`. For a narrative introduction see
[Getting Started](/guide/getting-started); for runnable snippets see
[Examples](/guide/examples); for the underlying native `<iframe>` element these props
wrap, see the [HTML `<iframe>` Reference](/html-iframe-element). This page is also
published as a standalone
[`PARAMETERS.md`](https://github.com/gwinnem/vue-iframe-wrapper/blob/main/PARAMETERS.md)
at the repository root.

[[toc]]

## Props

### Content props

#### `src`

|              |                                       |
| ------------ | ------------------------------------- |
| **Type**     | `string`                              |
| **Default**  | `undefined`                           |
| **Required** | No (mutually exclusive with `srcdoc`) |

A same-origin URL loaded into the iframe's `src` attribute. Because injection and
document access rely on the browser's same-origin policy, cross-origin URLs will load
visually but will raise a `cross-origin` `IframeError` the moment any injection or
`getDocument()`/`getWindow()` call is attempted.

```vue
<IframeWrapper src="/preview/report.html" />
```

Use `reloadKey` (below) to force a reload of the same URL — simply re-assigning an
identical `src` value does not trigger a new `load` event in most browsers.

#### `srcdoc`

|              |                                    |
| ------------ | ---------------------------------- |
| **Type**     | `string`                           |
| **Default**  | `undefined`                        |
| **Required** | No (mutually exclusive with `src`) |

An inline HTML document string assigned to the iframe's `srcdoc` attribute. This is the
most common choice for previews generated at runtime (report rendering, WYSIWYG
previews, templated emails) since there's no need to serve the content from a URL.
`srcdoc` documents are always same-origin, so injection and document access are never
blocked by cross-origin restrictions.

```vue
<IframeWrapper srcdoc="<h1>Hello</h1><p>Rendered inline.</p>" />
```

If both `src` and `srcdoc` are supplied, the native `<iframe>` element's own precedence
rules apply (browsers generally prefer `srcdoc` when both attributes are present) — but
supplying both is not a supported or tested configuration. Pick one per instance.

### Appearance props

#### `iframeClass`

|              |             |
| ------------ | ----------- |
| **Type**     | `string`    |
| **Default**  | `undefined` |
| **Required** | No          |

A CSS class (or space-separated class list) applied directly to the rendered
`<iframe>` element, merged with the component's own `viw-iframe` class. Use this for
layout concerns — sizing, borders, shadows — rather than for styling the iframe's
_contents_, which should go through `css`/`cssUrls` instead.

```vue
<IframeWrapper srcdoc="<p>hi</p>" iframe-class="rounded-lg shadow-md" />
```

#### `iframeStyle`

|              |                                    |
| ------------ | ---------------------------------- |
| **Type**     | `string \| Record<string, string>` |
| **Default**  | `undefined`                        |
| **Required** | No                                 |

Inline style applied to the `<iframe>` element, accepting either a CSS string or a Vue
style object. Same scope note as `iframeClass`: this styles the _frame_, not the
document inside it.

```vue
<IframeWrapper srcdoc="<p>hi</p>" :iframe-style="{ height: '480px', border: '1px solid #ddd' }" />
```

#### `sandbox`

|              |                                     |
| ------------ | ----------------------------------- |
| **Type**     | `string`                            |
| **Default**  | `'allow-scripts allow-same-origin'` |
| **Required** | No                                  |

The value applied to the iframe's `sandbox` attribute. The default keeps the frame
same-origin (required for `contentDocument` access) while still allowing injected
scripts to execute. See [Security](/security) for the full threat model before changing
this — in particular, do not combine `allow-scripts` and `allow-same-origin` for content
you do not control.

```vue
<IframeWrapper src="/preview/report.html" sandbox="allow-scripts allow-same-origin allow-popups" />
```

#### `title`

|              |                      |
| ------------ | -------------------- |
| **Type**     | `string`             |
| **Default**  | `undefined`          |
| **Required** | Strongly recommended |

The iframe's `title` attribute. Every `<iframe>` should have one for accessibility —
screen readers announce it to describe the embedded content's purpose. This is not
enforced at the type level (an empty title is technically legal HTML) but omitting it
will fail most accessibility audits.

```vue
<IframeWrapper srcdoc="<p>hi</p>" title="Report preview" />
```

### Asset props

All four asset props accept either a single string or an array of strings, and are
injected automatically once the iframe's native `load` event fires (governed by
`autoInject`/`injectOnLoad`, below).

#### `css`

|              |                      |
| ------------ | -------------------- |
| **Type**     | `string \| string[]` |
| **Default**  | `undefined`          |
| **Required** | No                   |

Inline CSS injected as one `<style>` element per array entry (a single string counts as
one entry). Placed in `<head>` by default.

```vue
<IframeWrapper :css="['body { margin: 0; }', 'h1 { color: teal; }']" />
```

#### `cssUrls`

|              |                      |
| ------------ | -------------------- |
| **Type**     | `string \| string[]` |
| **Default**  | `undefined`          |
| **Required** | No                   |

External stylesheet URL(s), each injected as a `<link rel="stylesheet">` element in
`<head>`. Resolved relative to the iframe document, not the host page.

```vue
<IframeWrapper :css-urls="['/themes/brand.css', '/themes/print.css']" />
```

#### `js`

|              |                      |
| ------------ | -------------------- |
| **Type**     | `string \| string[]` |
| **Default**  | `undefined`          |
| **Required** | No                   |

Inline JavaScript injected as one `<script>` element per array entry. Placed in
`<body>` by default (as opposed to CSS, which defaults to `<head>`), so injected scripts
run after the rest of the document has parsed.

```vue
<IframeWrapper js="document.title = 'Patched title'" />
```

::: warning
Anything passed here executes with full script privileges inside the iframe. Treat it
like any other code you ship to users — see [Security](/security).
:::

#### `jsUrls`

|              |                      |
| ------------ | -------------------- |
| **Type**     | `string \| string[]` |
| **Default**  | `undefined`          |
| **Required** | No                   |

External script URL(s), each injected as a `<script src="...">` element in `<body>`.

```vue
<IframeWrapper :js-urls="['/scripts/tracking-stub.js']" />
```

### Behaviour props

#### `autoInject`

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Default**  | `true`    |
| **Required** | No        |

Controls whether the configured asset props (`css`/`cssUrls`/`js`/`jsUrls`) are injected
automatically at all. Set to `false` when you want full manual control via the exposed
`injectCss`/`injectJs`/etc. methods (for example, injecting in response to a button
click rather than on load).

```vue
<IframeWrapper ref="frame" srcdoc="<p>hi</p>" :auto-inject="false" />
```

#### `injectOnLoad`

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Default**  | `true`    |
| **Required** | No        |

When `true` (default), auto-injection re-runs on **every** `load` event — including
reloads triggered by `reloadKey` or navigation to a new `src`. When `false`,
auto-injection only ever runs once, on the first `load`. Has no effect when `autoInject`
is `false`.

Use `false` for content that's expensive or unsafe to inject twice (e.g. scripts with
side effects that shouldn't re-run); use the default `true` for theming that should
survive a reload.

#### `reloadKey`

|              |                    |
| ------------ | ------------------ |
| **Type**     | `string \| number` |
| **Default**  | `undefined`        |
| **Required** | No                 |

A value with no semantic meaning to the component other than "did it change?". Any
change to `reloadKey` (compared by `!==`) forces the iframe to reload — re-assigning
`srcdoc` (via a double-write on the next animation frame, so the browser registers a
change even when the content is byte-identical) or re-assigning `src` to itself. This is
the recommended way to build a "Refresh" button in a parent component.

```vue
<script setup>
const key = ref(0)
</script>
<template>
  <IframeWrapper srcdoc="<p>hi</p>" :reload-key="key" />
  <button @click="key++">Refresh</button>
</template>
```

## Events

| Event      | Payload                                     | Emitted when                                                                                                                          |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `load`     | `(event: Event, iframe: HTMLIFrameElement)` | The native iframe `load` event fires — every load, including reloads.                                                                 |
| `injected` | `(results: IframeInjectionResult[])`        | Auto-injection completes with at least one asset injected. Not emitted if there was nothing to inject, or if `autoInject` is `false`. |
| `error`    | `(error: IframeError)`                      | Any injection attempt or document-access call fails, whether from auto-injection or a manual `inject*`/`get*` call.                   |

```vue
<IframeWrapper
  srcdoc="<p>hi</p>"
  :css="css"
  @load="(event, iframe) => console.log('loaded', iframe)"
  @injected="(results) => console.log(`${results.length} assets injected`)"
  @error="(error) => console.error(error.reason, error.message)"
/>
```

## Exposed instance methods

Available via a template ref (`const frame = ref<InstanceType<typeof IframeWrapper>>()`):

| Method                   | Signature                                                                        | Description                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `reload`                 | `(): void`                                                                       | Forces a reload, same mechanism as changing `reloadKey`.                                                                           |
| `getIframe`              | `(): HTMLIFrameElement \| null`                                                  | Returns the underlying `<iframe>` DOM element, or `null` before mount.                                                             |
| `getWindow`              | `(): Window \| null`                                                             | Returns the iframe's `contentWindow`, or `null` if unavailable/cross-origin (reports via `error`).                                 |
| `getDocument`            | `(): Document \| null`                                                           | Returns the iframe's `contentDocument`, or `null` if unavailable/cross-origin (reports via `error`).                               |
| `injectCss`              | `(css: string \| string[], options?: InjectionOptions): IframeInjectionResult[]` | Manually inject one or more inline stylesheets.                                                                                    |
| `injectCssUrl`           | `(url: string \| string[], options?: InjectionOptions): IframeInjectionResult[]` | Manually inject one or more external stylesheet links.                                                                             |
| `injectJs`               | `(js: string \| string[], options?: InjectionOptions): IframeInjectionResult[]`  | Manually inject one or more inline scripts.                                                                                        |
| `injectJsUrl`            | `(url: string \| string[], options?: InjectionOptions): IframeInjectionResult[]` | Manually inject one or more external scripts.                                                                                      |
| `injectConfiguredAssets` | `(config: IframeAssetConfig): IframeInjectionResult[]`                           | Injects a full `{ css, cssUrls, js, jsUrls }` bundle in one call — this is what the component calls internally for auto-injection. |

All `inject*` methods **fail soft**: an error is reported to the `error` event (or your
`onError` callback if you're using `useIframeInjection` directly) and the call returns
`[]` rather than throwing, so a single bad URL doesn't stop the rest of a batch.

```vue
<script setup lang="ts">
const frame = ref<InstanceType<typeof IframeWrapper> | null>(null)

function applyDarkTheme() {
  frame.value?.injectCss('body { background: #111; color: #eee; }', { id: 'theme' })
}
</script>
```

## `InjectionOptions`

Passed as the second argument to every `inject*` method (both on the component and on
`useIframeInjection`).

| Field             | Type               | Default                           | Description                                                                                                                                                                                                         |
| ----------------- | ------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `string`           | auto-generated                    | A stable identifier for the injected element. Reusing the same `id` across calls replaces the previous element (see `replaceExisting`) instead of appending a duplicate — the basis for things like a theme toggle. |
| `placement`       | `'head' \| 'body'` | `'head'` for CSS, `'body'` for JS | Where in the document the element is inserted.                                                                                                                                                                      |
| `replaceExisting` | `boolean`          | `true`                            | When `true`, an existing element with the same `id` is replaced in place. When `false`, a duplicate is appended alongside it.                                                                                       |
| `nonce`           | `string`           | `undefined`                       | Applied as the element's `nonce` attribute, for compatibility with a strict Content-Security-Policy on the iframe document.                                                                                         |

```ts
frame.value?.injectCss(css, { id: 'theme', replaceExisting: true, nonce: cspNonce })
```

## `IframeInjectionResult`

Returned from every `inject*` call and included in the `injected` event payload (as an
array, one entry per asset injected).

| Field       | Type                                     | Description                                                        |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `id`        | `string`                                 | The resolved id of the injected element (supplied or generated).   |
| `type`      | `'css' \| 'css-url' \| 'js' \| 'js-url'` | The kind of asset that was injected.                               |
| `placement` | `'head' \| 'body'`                       | Where the element was placed.                                      |
| `element`   | `HTMLElement`                            | The actual DOM element created/updated inside the iframe document. |

## `IframeError`

A typed `Error` subclass, so `error instanceof IframeError` narrows correctly, and
`error instanceof Error` still works for generic error handling.

| Field     | Type                                                             | Description                                                                                     |
| --------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `reason`  | `'cross-origin' \| 'document-unavailable' \| 'injection-failed'` | Machine-readable failure category.                                                              |
| `message` | `string`                                                         | Human-readable description.                                                                     |
| `cause`   | `unknown`                                                        | The underlying native error, if any (e.g. the `SecurityError` behind a `cross-origin` failure). |

| Reason                 | Typical cause                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `cross-origin`         | `src` points at a different origin than the host page.                                                              |
| `document-unavailable` | The iframe isn't mounted yet, hasn't fired `load`, or has no `<head>`/`<body>` to inject into.                      |
| `injection-failed`     | Document access succeeded but creating/inserting the element threw (rare — usually indicates a malformed document). |

## Prop interactions & precedence rules

- **`src` vs `srcdoc`** — mutually exclusive; supplying both is unsupported. Prefer
  `srcdoc` for runtime-generated content, `src` for served documents.
- **`autoInject: false`** disables all asset props (`css`/`cssUrls`/`js`/`jsUrls`)
  entirely — they're simply never read. Use this alongside manual `inject*` calls.
- **`injectOnLoad: false`** only matters when `autoInject` is `true`; it limits
  auto-injection to the first `load` rather than every subsequent one.
- **`reloadKey`** interacts with `injectOnLoad`: a reload always fires a new `load`
  event, so if `injectOnLoad` is `true` the configured assets are re-injected after every
  reload; if `false`, they are not (the "inject once" contract is per-mount, not
  per-load).
- **CSS defaults to `head`, JS defaults to `body`** when no `placement` is given via
  `InjectionOptions` — this cannot currently be changed through props, only through the
  imperative API (see [Feature Recommendations](/feature-recommendations) for a proposal
  to expose per-asset placement declaratively).
