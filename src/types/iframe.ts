/**
 * Type definitions for the Vue Iframe Wrapper library.
 *
 * These types describe the public contract of the component, composable,
 * and the low-level injection utilities. Keeping them in a single module
 * makes it possible to import them independently of the Vue component,
 * e.g. from server-side tooling or unit tests.
 */

/** Where an injected asset should be placed within the iframe document. */
export type IframeAssetPlacement = 'head' | 'body'

/** The kind of asset that was (or is being) injected. */
export type IframeAssetType = 'css' | 'css-url' | 'js' | 'js-url'

/**
 * Machine-readable reasons an injection or access attempt can fail.
 * These are intentionally coarse-grained; consumers that need more detail
 * should inspect `IframeError.cause`.
 */
export type IframeErrorReason = 'cross-origin' | 'document-unavailable' | 'injection-failed'

/**
 * Options accepted by every injection method (`injectCss`, `injectJs`, etc).
 */
export interface InjectionOptions {
  /**
   * A stable identifier for the injected element. Supplying the same id
   * across calls allows an asset to be replaced/updated in place rather
   * than duplicated. When omitted, an id is generated automatically.
   */
  id?: string
  /** Where in the document the asset should be inserted. Defaults to `head`. */
  placement?: IframeAssetPlacement
  /**
   * When true (default), an existing element with the same `id` is
   * replaced. When false, a duplicate element is appended instead.
   */
  replaceExisting?: boolean
  /** An optional CSP nonce applied to `<style>`/`<script>` elements. */
  nonce?: string
}

/**
 * Describes a single asset that has been injected into the iframe document.
 * Returned from imperative injection calls and included in the `injected`
 * event payload.
 */
export interface IframeInjectionResult {
  /** The (resolved) id of the injected element. */
  id: string
  /** The kind of asset injected. */
  type: IframeAssetType
  /** Where the element was placed. */
  placement: IframeAssetPlacement
  /** The DOM element that was created/updated inside the iframe document. */
  element: HTMLElement
}

/**
 * A declarative description of the assets that should be injected
 * automatically once the iframe finishes loading (or immediately, if
 * `autoInject` is enabled and the document is already accessible).
 */
export interface IframeAssetConfig {
  css?: string | string[]
  cssUrls?: string | string[]
  js?: string | string[]
  jsUrls?: string | string[]
}

/**
 * A typed error raised by the library. Instances are also emitted via the
 * component's `error` event, so consumers can rely on `error instanceof
 * IframeError` for narrowing.
 */
export class IframeError extends Error {
  readonly reason: IframeErrorReason
  readonly cause?: unknown

  constructor(reason: IframeErrorReason, message: string, cause?: unknown) {
    super(message)
    this.name = 'IframeError'
    this.reason = reason
    this.cause = cause
  }
}

/** Props accepted by the `<IframeWrapper />` component. */
export interface IframeWrapperProps {
  /** Same-origin URL to load into the iframe. Mutually exclusive with `srcdoc`. */
  src?: string
  /** Inline HTML document to load into the iframe via `srcdoc`. */
  srcdoc?: string
  /** CSS class(es) applied to the underlying `<iframe>` element. */
  iframeClass?: string
  /** Inline style applied to the underlying `<iframe>` element. */
  iframeStyle?: string | Record<string, string>
  /** `sandbox` attribute value. Defaults to `allow-scripts allow-same-origin`. */
  sandbox?: string
  /** `title` attribute value, recommended for accessibility. */
  title?: string
  /** Inline CSS (single string or array) to inject once the document loads. */
  css?: string | string[]
  /** External stylesheet URL(s) to inject once the document loads. */
  cssUrls?: string | string[]
  /** Inline JavaScript (single string or array) to inject once the document loads. */
  js?: string | string[]
  /** External script URL(s) to inject once the document loads. */
  jsUrls?: string | string[]
  /**
   * When true, configured assets (`css`/`cssUrls`/`js`/`jsUrls`) are
   * injected automatically. Defaults to true.
   */
  autoInject?: boolean
  /**
   * When true, auto-injection runs on every `load` event (including
   * reloads and navigations). When false, it only runs once. Defaults to true.
   */
  injectOnLoad?: boolean
  /**
   * Changing this value forces the iframe to reload (re-assigns `src`/`srcdoc`).
   * Useful as a cheap "refresh" trigger from a parent component.
   */
  reloadKey?: string | number
}

/** Events emitted by `<IframeWrapper />`. */
export interface IframeWrapperEmits {
  /** Fired when the native iframe `load` event fires. */
  load: [event: Event, iframe: HTMLIFrameElement]
  /** Fired after auto-injection completes, with the results of each asset injected. */
  injected: [results: IframeInjectionResult[]]
  /** Fired whenever an `IframeError` is raised, whether from auto- or manual injection. */
  error: [error: IframeError]
}
