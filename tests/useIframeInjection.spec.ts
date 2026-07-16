import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useIframeInjection } from '../src/composables/useIframeInjection'

function createAccessibleIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  return iframe
}

describe('useIframeInjection', () => {
  it('getIframe/getDocument/getWindow return null before mount', () => {
    const iframeRef = ref<HTMLIFrameElement | null>(null)
    const { getIframe, getDocument, getWindow } = useIframeInjection({ iframeRef })

    expect(getIframe()).toBeNull()
    expect(getDocument()).toBeNull()
    expect(getWindow()).toBeNull()
  })

  it('reports an error and returns null when the document is unavailable', () => {
    const iframe = document.createElement('iframe')
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const onError = vi.fn()

    Object.defineProperty(iframe, 'contentDocument', { value: null, configurable: true })

    const { getDocument } = useIframeInjection({ iframeRef, onError })
    const result = getDocument()

    expect(result).toBeNull()
    expect(onError).toHaveBeenCalledOnce()
    expect(onError.mock.calls[0][0].reason).toBe('document-unavailable')
  })

  it('injects CSS into an accessible iframe document', () => {
    const iframe = createAccessibleIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const { injectCss } = useIframeInjection({ iframeRef })

    const results = injectCss('body { color: blue; }')

    expect(results).toHaveLength(1)
    expect(iframe.contentDocument?.head.contains(results[0].element)).toBe(true)

    document.body.removeChild(iframe)
  })

  it('injects multiple assets and skips failures without throwing', () => {
    const iframe = createAccessibleIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const onError = vi.fn()
    const { injectConfiguredAssets } = useIframeInjection({ iframeRef, onError })

    const results = injectConfiguredAssets({
      css: ['a{}', 'b{}'],
      cssUrls: 'https://example.com/style.css',
      js: 'window.__loaded = true;',
      jsUrls: ['https://example.com/one.js', 'https://example.com/two.js'],
    })

    expect(results).toHaveLength(6)
    expect(onError).not.toHaveBeenCalled()

    document.body.removeChild(iframe)
  })

  it('returns an empty array and reports an error when injecting into an unavailable document', () => {
    const iframe = document.createElement('iframe')
    Object.defineProperty(iframe, 'contentDocument', { value: null, configurable: true })
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const onError = vi.fn()
    const { injectJs } = useIframeInjection({ iframeRef, onError })

    const results = injectJs('window.__x = 1;')

    expect(results).toEqual([])
    expect(onError).toHaveBeenCalledOnce()
  })

  it('getWindow returns the iframe defaultView when accessible', () => {
    const iframe = createAccessibleIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const { getWindow } = useIframeInjection({ iframeRef })

    expect(getWindow()).toBe(iframe.contentWindow)

    document.body.removeChild(iframe)
  })

  it('injectConfiguredAssets returns no results when no assets are configured', () => {
    const iframe = createAccessibleIframe()
    const iframeRef = ref<HTMLIFrameElement | null>(iframe)
    const { injectConfiguredAssets } = useIframeInjection({ iframeRef })

    const results = injectConfiguredAssets({})

    expect(results).toEqual([])
    expect(iframe.contentDocument?.querySelectorAll('[data-viw-id]')).toHaveLength(0)

    document.body.removeChild(iframe)
  })
})
