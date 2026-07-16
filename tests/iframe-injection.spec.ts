import { describe, expect, it, beforeEach } from 'vitest'
import { IframeError } from '../src/types/iframe'
import {
  createInjectionId,
  createIframeError,
  getSameOriginDocument,
  injectCssIntoDocument,
  injectCssUrlIntoDocument,
  injectJsIntoDocument,
  injectJsUrlIntoDocument,
  normaliseArray,
  resetInjectionIdCounter,
} from '../src/utils/iframe-injection'

describe('normaliseArray', () => {
  it('returns an empty array for undefined/null', () => {
    expect(normaliseArray(undefined)).toEqual([])
    expect(normaliseArray(null)).toEqual([])
  })

  it('wraps a single string in an array', () => {
    expect(normaliseArray('body { color: red; }')).toEqual(['body { color: red; }'])
  })

  it('passes arrays through, filtering falsy/empty values', () => {
    expect(normaliseArray(['a', '', 'b'])).toEqual(['a', 'b'])
  })
})

describe('createInjectionId', () => {
  beforeEach(() => resetInjectionIdCounter())

  it('generates ids prefixed with the asset type', () => {
    const id = createInjectionId('css')
    expect(id).toMatch(/^viw-css-\d+-/)
  })

  it('generates unique ids across calls', () => {
    const first = createInjectionId('js')
    const second = createInjectionId('js')
    expect(first).not.toEqual(second)
  })
})

describe('createIframeError', () => {
  it('produces a typed IframeError with the given reason', () => {
    const error = createIframeError('cross-origin', 'nope')
    expect(error).toBeInstanceOf(IframeError)
    expect(error.reason).toBe('cross-origin')
    expect(error.message).toBe('nope')
  })
})

describe('getSameOriginDocument', () => {
  it('throws document-unavailable when the iframe is null', () => {
    expect(() => getSameOriginDocument(null)).toThrowError(
      expect.objectContaining({ reason: 'document-unavailable' }),
    )
  })

  it('throws document-unavailable when contentDocument is null', () => {
    const iframe = document.createElement('iframe')
    Object.defineProperty(iframe, 'contentDocument', { value: null, configurable: true })
    expect(() => getSameOriginDocument(iframe)).toThrowError(
      expect.objectContaining({ reason: 'document-unavailable' }),
    )
  })

  it('throws cross-origin when accessing contentDocument throws', () => {
    const iframe = document.createElement('iframe')
    Object.defineProperty(iframe, 'contentDocument', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
    expect(() => getSameOriginDocument(iframe)).toThrowError(
      expect.objectContaining({ reason: 'cross-origin' }),
    )
  })

  it('returns the contentDocument when accessible', () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const doc = getSameOriginDocument(iframe)
    expect(doc).toBeDefined()
    document.body.removeChild(iframe)
  })
})

describe('injectCssIntoDocument', () => {
  let doc: Document

  beforeEach(() => {
    resetInjectionIdCounter()
    doc = document.implementation.createHTMLDocument('test')
  })

  it('creates a <style> element in <head> by default', () => {
    const result = injectCssIntoDocument(doc, 'body { color: red; }')
    expect(result.type).toBe('css')
    expect(result.placement).toBe('head')
    expect(result.id).toMatch(/^viw-css-\d+-/)
    expect(result.element.tagName).toBe('STYLE')
    expect(doc.head.contains(result.element)).toBe(true)
    expect(result.element.textContent).toBe('body { color: red; }')
    expect(result.element.hasAttribute('nonce')).toBe(false)
  })

  it('places the element in <body> when requested', () => {
    const result = injectCssIntoDocument(doc, 'a{}', { placement: 'body' })
    expect(doc.body.contains(result.element)).toBe(true)
  })

  it('replaces an existing element with the same id by default', () => {
    const first = injectCssIntoDocument(doc, 'a{}', { id: 'theme' })
    const second = injectCssIntoDocument(doc, 'b{}', { id: 'theme' })
    expect(doc.querySelectorAll('[data-viw-id="theme"]').length).toBe(1)
    expect(second.element.textContent).toBe('b{}')
    expect(doc.head.contains(first.element)).toBe(false)
  })

  it('appends a duplicate when replaceExisting is false', () => {
    injectCssIntoDocument(doc, 'a{}', { id: 'theme' })
    injectCssIntoDocument(doc, 'b{}', { id: 'theme', replaceExisting: false })
    expect(doc.querySelectorAll('[data-viw-id="theme"]').length).toBe(2)
  })

  it('applies a nonce attribute when provided', () => {
    const result = injectCssIntoDocument(doc, 'a{}', { nonce: 'abc123' })
    expect(result.element.getAttribute('nonce')).toBe('abc123')
  })
})

describe('injectCssUrlIntoDocument', () => {
  let doc: Document

  beforeEach(() => {
    resetInjectionIdCounter()
    doc = document.implementation.createHTMLDocument('test')
  })

  it('creates a <link rel="stylesheet"> element in <head> by default', () => {
    const result = injectCssUrlIntoDocument(doc, 'https://example.com/style.css')
    expect(result.type).toBe('css-url')
    expect(result.placement).toBe('head')
    expect(result.id).toMatch(/^viw-css-url-\d+-/)
    expect(result.element.tagName).toBe('LINK')
    expect((result.element as HTMLLinkElement).rel).toBe('stylesheet')
    expect((result.element as HTMLLinkElement).href).toBe('https://example.com/style.css')
    expect(doc.head.contains(result.element)).toBe(true)
  })

  it('respects an explicit id, placement, and replaceExisting: false', () => {
    const first = injectCssUrlIntoDocument(doc, 'https://example.com/a.css', {
      id: 'brand-css',
      placement: 'body',
    })
    expect(first.id).toBe('brand-css')
    expect(first.placement).toBe('body')
    expect(doc.body.contains(first.element)).toBe(true)

    injectCssUrlIntoDocument(doc, 'https://example.com/b.css', {
      id: 'brand-css',
      placement: 'body',
      replaceExisting: false,
    })
    expect(doc.querySelectorAll('[data-viw-id="brand-css"]').length).toBe(2)
  })

  it('applies a nonce attribute when provided', () => {
    const result = injectCssUrlIntoDocument(doc, 'https://example.com/a.css', { nonce: 'xyz' })
    expect(result.element.getAttribute('nonce')).toBe('xyz')
  })

  it('defaults replaceExisting to true, replacing a prior element with the same id', () => {
    const first = injectCssUrlIntoDocument(doc, 'https://example.com/a.css', { id: 'brand-css' })
    injectCssUrlIntoDocument(doc, 'https://example.com/b.css', { id: 'brand-css' })
    expect(doc.querySelectorAll('[data-viw-id="brand-css"]').length).toBe(1)
    expect(doc.head.contains(first.element)).toBe(false)
  })
})

describe('injectJsIntoDocument', () => {
  let doc: Document

  beforeEach(() => {
    resetInjectionIdCounter()
    doc = document.implementation.createHTMLDocument('test')
  })

  it('creates a <script> element defaulting to body placement', () => {
    const result = injectJsIntoDocument(doc, 'window.__x = 1;')
    expect(result.type).toBe('js')
    expect(result.placement).toBe('body')
    expect(result.id).toMatch(/^viw-js-\d+-/)
    expect(result.element.tagName).toBe('SCRIPT')
    expect(result.element.textContent).toBe('window.__x = 1;')
    expect(doc.body.contains(result.element)).toBe(true)
  })

  it('respects an explicit id, placement, and replaceExisting: false', () => {
    const first = injectJsIntoDocument(doc, 'window.__a = 1;', {
      id: 'init-script',
      placement: 'head',
    })
    expect(first.placement).toBe('head')
    expect(doc.head.contains(first.element)).toBe(true)

    injectJsIntoDocument(doc, 'window.__b = 2;', {
      id: 'init-script',
      placement: 'head',
      replaceExisting: false,
    })
    expect(doc.querySelectorAll('[data-viw-id="init-script"]').length).toBe(2)
  })

  it('applies a nonce attribute when provided', () => {
    const result = injectJsIntoDocument(doc, 'window.__x = 1;', { nonce: 'abc' })
    expect(result.element.getAttribute('nonce')).toBe('abc')
  })

  it('defaults replaceExisting to true, replacing a prior element with the same id', () => {
    const first = injectJsIntoDocument(doc, 'window.__a = 1;', { id: 'init-script' })
    injectJsIntoDocument(doc, 'window.__b = 2;', { id: 'init-script' })
    expect(doc.querySelectorAll('[data-viw-id="init-script"]').length).toBe(1)
    expect(doc.body.contains(first.element)).toBe(false)
  })
})

describe('injectJsUrlIntoDocument', () => {
  let doc: Document

  beforeEach(() => {
    resetInjectionIdCounter()
    doc = document.implementation.createHTMLDocument('test')
  })

  it('creates a <script src> element defaulting to body placement', () => {
    const result = injectJsUrlIntoDocument(doc, 'https://example.com/script.js')
    expect(result.type).toBe('js-url')
    expect(result.placement).toBe('body')
    expect(result.id).toMatch(/^viw-js-url-\d+-/)
    expect((result.element as HTMLScriptElement).src).toBe('https://example.com/script.js')
    expect(doc.body.contains(result.element)).toBe(true)
  })

  it('respects an explicit id, placement, and replaceExisting: false', () => {
    const first = injectJsUrlIntoDocument(doc, 'https://example.com/a.js', {
      id: 'analytics',
      placement: 'head',
    })
    expect(first.placement).toBe('head')
    expect(doc.head.contains(first.element)).toBe(true)

    injectJsUrlIntoDocument(doc, 'https://example.com/b.js', {
      id: 'analytics',
      placement: 'head',
      replaceExisting: false,
    })
    expect(doc.querySelectorAll('[data-viw-id="analytics"]').length).toBe(2)
  })

  it('applies a nonce attribute when provided', () => {
    const result = injectJsUrlIntoDocument(doc, 'https://example.com/a.js', { nonce: 'nnn' })
    expect(result.element.getAttribute('nonce')).toBe('nnn')
  })

  it('defaults replaceExisting to true, replacing a prior element with the same id', () => {
    const first = injectJsUrlIntoDocument(doc, 'https://example.com/a.js', { id: 'analytics' })
    injectJsUrlIntoDocument(doc, 'https://example.com/b.js', { id: 'analytics' })
    expect(doc.querySelectorAll('[data-viw-id="analytics"]').length).toBe(1)
    expect(doc.body.contains(first.element)).toBe(false)
  })
})
