import { type Ref, unref } from 'vue'
import {
  createIframeError,
  getSameOriginDocument,
  injectCssIntoDocument,
  injectCssUrlIntoDocument,
  injectJsIntoDocument,
  injectJsUrlIntoDocument,
  normaliseArray,
} from '../utils/iframe-injection'
import type {
  IframeAssetConfig,
  IframeError,
  IframeInjectionResult,
  InjectionOptions,
} from '../types/iframe'

export interface UseIframeInjectionOptions {
  /** Ref to the underlying `<iframe>` element. */
  iframeRef: Ref<HTMLIFrameElement | null | undefined>
  /** Called whenever an injection (or document access) attempt fails. */
  onError?: (error: IframeError) => void
}

export interface UseIframeInjectionReturn {
  getIframe: () => HTMLIFrameElement | null
  getWindow: () => Window | null
  getDocument: () => Document | null
  injectCss: (css: string | string[], options?: InjectionOptions) => IframeInjectionResult[]
  injectCssUrl: (url: string | string[], options?: InjectionOptions) => IframeInjectionResult[]
  injectJs: (js: string | string[], options?: InjectionOptions) => IframeInjectionResult[]
  injectJsUrl: (url: string | string[], options?: InjectionOptions) => IframeInjectionResult[]
  injectConfiguredAssets: (config: IframeAssetConfig) => IframeInjectionResult[]
}

/**
 * Provides imperative helpers for reading and mutating the document inside
 * a same-origin iframe. All methods are synchronous and fail soft: instead
 * of throwing, errors are reported via `onError` and the method returns an
 * empty array (for batch operations) or `null` (for accessors), so a single
 * bad asset never interrupts the rest of a batch injection.
 */
export function useIframeInjection(options: UseIframeInjectionOptions): UseIframeInjectionReturn {
  const { iframeRef, onError } = options

  function reportError(error: unknown): IframeError {
    const iframeError =
      error && typeof error === 'object' && 'reason' in error
        ? (error as IframeError)
        : createIframeError('injection-failed', 'An unexpected error occurred.', error)
    onError?.(iframeError)
    return iframeError
  }

  function getIframe(): HTMLIFrameElement | null {
    return unref(iframeRef) ?? null
  }

  function getWindow(): Window | null {
    try {
      return getSameOriginDocument(getIframe()).defaultView ?? null
    } catch (error) {
      reportError(error)
      return null
    }
  }

  function getDocument(): Document | null {
    try {
      return getSameOriginDocument(getIframe())
    } catch (error) {
      reportError(error)
      return null
    }
  }

  function runBatch(
    values: string | string[] | undefined,
    inject: (doc: Document, value: string, options?: InjectionOptions) => IframeInjectionResult,
    options?: InjectionOptions,
  ): IframeInjectionResult[] {
    const items = normaliseArray(values)
    if (items.length === 0) return []

    let doc: Document
    try {
      doc = getSameOriginDocument(getIframe())
    } catch (error) {
      reportError(error)
      return []
    }

    const results: IframeInjectionResult[] = []
    for (const item of items) {
      try {
        results.push(inject(doc, item, options))
      } catch (error) {
        reportError(error)
      }
    }
    return results
  }

  function injectCss(css: string | string[], injectionOptions?: InjectionOptions) {
    return runBatch(css, injectCssIntoDocument, injectionOptions)
  }

  function injectCssUrl(url: string | string[], injectionOptions?: InjectionOptions) {
    return runBatch(url, injectCssUrlIntoDocument, injectionOptions)
  }

  function injectJs(js: string | string[], injectionOptions?: InjectionOptions) {
    return runBatch(js, injectJsIntoDocument, injectionOptions)
  }

  function injectJsUrl(url: string | string[], injectionOptions?: InjectionOptions) {
    return runBatch(url, injectJsUrlIntoDocument, injectionOptions)
  }

  function injectConfiguredAssets(config: IframeAssetConfig): IframeInjectionResult[] {
    return [
      ...injectCss(config.css ?? []),
      ...injectCssUrl(config.cssUrls ?? []),
      ...injectJs(config.js ?? []),
      ...injectJsUrl(config.jsUrls ?? []),
    ]
  }

  return {
    getIframe,
    getWindow,
    getDocument,
    injectCss,
    injectCssUrl,
    injectJs,
    injectJsUrl,
    injectConfiguredAssets,
  }
}
