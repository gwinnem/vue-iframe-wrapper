import { IframeError } from '../types/iframe'
import type {
  IframeAssetPlacement,
  IframeAssetType,
  IframeInjectionResult,
  InjectionOptions,
} from '../types/iframe'

const DEFAULT_PLACEMENT: IframeAssetPlacement = 'head'
const ID_PREFIX = 'viw'

let idCounter = 0

/**
 * Normalises a value that may be a single string, an array of strings,
 * `undefined`, or `null` into a flat array of non-empty strings.
 */
export function normaliseArray(value?: string | string[] | null): string[] {
  if (!value) return []
  const arr = Array.isArray(value) ? value : [value]
  return arr.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

/**
 * Generates a stable, collision-resistant id for injected elements when the
 * caller does not supply one explicitly.
 */
export function createInjectionId(type: IframeAssetType): string {
  idCounter += 1
  return `${ID_PREFIX}-${type}-${idCounter}-${Date.now().toString(36)}`
}

/** Resets the internal id counter. Exposed for deterministic tests only. */
export function resetInjectionIdCounter(): void {
  idCounter = 0
}

/** Builds a typed `IframeError` with a consistent message shape. */
export function createIframeError(
  reason: 'cross-origin' | 'document-unavailable' | 'injection-failed',
  detail: string,
  cause?: unknown,
): IframeError {
  return new IframeError(reason, detail, cause)
}

/**
 * Safely resolves the `document` object of an iframe, guarding against
 * cross-origin access (which throws a SecurityError in browsers) and
 * against the iframe not being mounted/loaded yet.
 */
export function getSameOriginDocument(iframe: HTMLIFrameElement | null | undefined): Document {
  if (!iframe) {
    throw createIframeError('document-unavailable', 'Iframe element is not available.')
  }

  let doc: Document | null = null
  try {
    doc = iframe.contentDocument
  } catch (cause) {
    throw createIframeError(
      'cross-origin',
      'Unable to access the iframe document because it is cross-origin.',
      cause,
    )
  }

  if (!doc) {
    throw createIframeError(
      'document-unavailable',
      'The iframe document is not yet available. Wait for the "load" event before injecting.',
    )
  }

  return doc
}

function resolveParent(doc: Document, placement: IframeAssetPlacement): HTMLElement {
  const parent = placement === 'body' ? doc.body : doc.head
  if (!parent) {
    throw createIframeError(
      'document-unavailable',
      `The iframe document has no <${placement}> element to inject into.`,
    )
  }
  return parent
}

function applyCommonAttributes(el: HTMLElement, id: string, nonce?: string): void {
  el.setAttribute('data-viw-id', id)
  if (nonce) {
    el.setAttribute('nonce', nonce)
  }
}

function insertOrReplace(
  doc: Document,
  id: string,
  placement: IframeAssetPlacement,
  replaceExisting: boolean,
  build: () => HTMLElement,
): HTMLElement {
  try {
    const existing = doc.querySelector<HTMLElement>(`[data-viw-id="${id}"]`)
    if (existing && replaceExisting) {
      const replacement = build()
      existing.replaceWith(replacement)
      return replacement
    }

    // Either there's no existing element, or replaceExisting is false — either way,
    // fall through and append a new element (a duplicate, in the latter case).
    const el = build()
    resolveParent(doc, placement).appendChild(el)
    return el
  } catch (cause) {
    if (cause instanceof IframeError) throw cause
    throw createIframeError('injection-failed', `Failed to inject element with id "${id}".`, cause)
  }
}

/** Injects an inline `<style>` block containing the given CSS text. */
export function injectCssIntoDocument(
  doc: Document,
  css: string,
  options: InjectionOptions = {},
): IframeInjectionResult {
  const id = options.id ?? createInjectionId('css')
  const placement = options.placement ?? DEFAULT_PLACEMENT
  const replaceExisting = options.replaceExisting ?? true

  const element = insertOrReplace(doc, id, placement, replaceExisting, () => {
    const style = doc.createElement('style')
    style.textContent = css
    applyCommonAttributes(style, id, options.nonce)
    return style
  })

  return { id, type: 'css', placement, element }
}

/** Injects a `<link rel="stylesheet">` pointing at an external CSS asset. */
export function injectCssUrlIntoDocument(
  doc: Document,
  url: string,
  options: InjectionOptions = {},
): IframeInjectionResult {
  const id = options.id ?? createInjectionId('css-url')
  const placement = options.placement ?? DEFAULT_PLACEMENT
  const replaceExisting = options.replaceExisting ?? true

  const element = insertOrReplace(doc, id, placement, replaceExisting, () => {
    const link = doc.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    applyCommonAttributes(link, id, options.nonce)
    return link
  })

  return { id, type: 'css-url', placement, element }
}

/** Injects an inline `<script>` block containing the given JavaScript text. */
export function injectJsIntoDocument(
  doc: Document,
  js: string,
  options: InjectionOptions = {},
): IframeInjectionResult {
  const id = options.id ?? createInjectionId('js')
  const placement = options.placement ?? 'body'
  const replaceExisting = options.replaceExisting ?? true

  const element = insertOrReplace(doc, id, placement, replaceExisting, () => {
    const script = doc.createElement('script')
    script.textContent = js
    applyCommonAttributes(script, id, options.nonce)
    return script
  })

  return { id, type: 'js', placement, element }
}

/** Injects a `<script src="...">` pointing at an external JS asset. */
export function injectJsUrlIntoDocument(
  doc: Document,
  url: string,
  options: InjectionOptions = {},
): IframeInjectionResult {
  const id = options.id ?? createInjectionId('js-url')
  const placement = options.placement ?? 'body'
  const replaceExisting = options.replaceExisting ?? true

  const element = insertOrReplace(doc, id, placement, replaceExisting, () => {
    const script = doc.createElement('script')
    script.src = url
    applyCommonAttributes(script, id, options.nonce)
    return script
  })

  return { id, type: 'js-url', placement, element }
}
