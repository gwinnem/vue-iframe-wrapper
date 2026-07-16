# API Reference

::: tip
Looking for exhaustive per-prop descriptions, defaults, and interaction rules? See the
dedicated [**Parameters**](/api/parameters) reference.
:::

## `<IframeWrapper />`

### Props

| Prop           | Type                              | Default                             | Description                                           |
| -------------- | --------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `src`          | `string`                          | —                                   | Same-origin URL to load.                              |
| `srcdoc`       | `string`                          | —                                   | Inline HTML document.                                 |
| `iframeClass`  | `string`                          | —                                   | Class applied to the `<iframe>`.                      |
| `iframeStyle`  | `string \| Record<string,string>` | —                                   | Inline style applied to the `<iframe>`.               |
| `sandbox`      | `string`                          | `'allow-scripts allow-same-origin'` | `sandbox` attribute value.                            |
| `title`        | `string`                          | —                                   | `title` attribute, recommended for accessibility.     |
| `css`          | `string \| string[]`              | —                                   | Inline CSS injected on load.                          |
| `cssUrls`      | `string \| string[]`              | —                                   | External stylesheet URL(s) injected on load.          |
| `js`           | `string \| string[]`              | —                                   | Inline JS injected on load.                           |
| `jsUrls`       | `string \| string[]`              | —                                   | External script URL(s) injected on load.              |
| `autoInject`   | `boolean`                         | `true`                              | Whether configured assets inject automatically.       |
| `injectOnLoad` | `boolean`                         | `true`                              | Re-run injection on every `load`, not just the first. |
| `reloadKey`    | `string \| number`                | —                                   | Changing this value forces a reload.                  |

### Events

| Event      | Payload                                     | Fires when                                      |
| ---------- | ------------------------------------------- | ----------------------------------------------- |
| `load`     | `(event: Event, iframe: HTMLIFrameElement)` | The native iframe `load` event fires.           |
| `injected` | `(results: IframeInjectionResult[])`        | Auto-injection completes with 1+ assets.        |
| `error`    | `(error: IframeError)`                      | Any injection or document-access attempt fails. |

### Exposed instance methods

Accessible via a template ref (`const frame = ref<InstanceType<typeof IframeWrapper>>()`):

```ts
reload(): void
getIframe(): HTMLIFrameElement | null
getWindow(): Window | null
getDocument(): Document | null
injectCss(css: string | string[], options?: InjectionOptions): IframeInjectionResult[]
injectCssUrl(url: string | string[], options?: InjectionOptions): IframeInjectionResult[]
injectJs(js: string | string[], options?: InjectionOptions): IframeInjectionResult[]
injectJsUrl(url: string | string[], options?: InjectionOptions): IframeInjectionResult[]
injectConfiguredAssets(config: IframeAssetConfig): IframeInjectionResult[]
```

## `useIframeInjection(options)`

A composable that powers the component internally, and is exported for use in custom
setups (e.g. wrapping your own iframe element).

```ts
function useIframeInjection(options: {
  iframeRef: Ref<HTMLIFrameElement | null | undefined>
  onError?: (error: IframeError) => void
}): {
  getIframe(): HTMLIFrameElement | null
  getWindow(): Window | null
  getDocument(): Document | null
  injectCss(css: string | string[], options?: InjectionOptions): IframeInjectionResult[]
  injectCssUrl(url: string | string[], options?: InjectionOptions): IframeInjectionResult[]
  injectJs(js: string | string[], options?: InjectionOptions): IframeInjectionResult[]
  injectJsUrl(url: string | string[], options?: InjectionOptions): IframeInjectionResult[]
  injectConfiguredAssets(config: IframeAssetConfig): IframeInjectionResult[]
}
```

All injection methods fail soft: a document-access or injection error is reported via
`onError` and the method returns `[]` (or `null` for accessors) rather than throwing, so
one bad asset in a batch doesn't stop the rest.

## Low-level utilities

Exported for advanced use (custom composables, testing, SSR-safe tooling):

```ts
normaliseArray(value?: string | string[] | null): string[]
createInjectionId(type: IframeAssetType): string
createIframeError(reason, message, cause?): IframeError
getSameOriginDocument(iframe: HTMLIFrameElement | null | undefined): Document
injectCssIntoDocument(doc: Document, css: string, options?: InjectionOptions): IframeInjectionResult
injectCssUrlIntoDocument(doc: Document, url: string, options?: InjectionOptions): IframeInjectionResult
injectJsIntoDocument(doc: Document, js: string, options?: InjectionOptions): IframeInjectionResult
injectJsUrlIntoDocument(doc: Document, url: string, options?: InjectionOptions): IframeInjectionResult
```

## Types

```ts
type IframeAssetPlacement = 'head' | 'body'
type IframeAssetType = 'css' | 'css-url' | 'js' | 'js-url'
type IframeErrorReason = 'cross-origin' | 'document-unavailable' | 'injection-failed'

interface InjectionOptions {
  id?: string
  placement?: IframeAssetPlacement
  replaceExisting?: boolean
  nonce?: string
}

interface IframeInjectionResult {
  id: string
  type: IframeAssetType
  placement: IframeAssetPlacement
  element: HTMLElement
}

interface IframeAssetConfig {
  css?: string | string[]
  cssUrls?: string | string[]
  js?: string | string[]
  jsUrls?: string | string[]
}

class IframeError extends Error {
  readonly reason: IframeErrorReason
  readonly cause?: unknown
}
```
