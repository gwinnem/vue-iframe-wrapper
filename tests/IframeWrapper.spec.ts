import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import IframeWrapper from '../src/components/IframeWrapper.vue'

describe('IframeWrapper', () => {
  it('renders an iframe with the given src and sandbox default', () => {
    const wrapper = mount(IframeWrapper, {
      props: { src: 'https://example.com' },
    })
    const iframe = wrapper.get('iframe')
    expect(iframe.attributes('src')).toBe('https://example.com')
    expect(iframe.attributes('sandbox')).toBe('allow-scripts allow-same-origin')
  })

  it('renders srcdoc content', () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>' },
    })
    expect(wrapper.get('iframe').attributes('srcdoc')).toBe('<p>hi</p>')
  })

  it('applies iframeClass and title', () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>', iframeClass: 'my-frame', title: 'Preview' },
    })
    const iframe = wrapper.get('iframe')
    expect(iframe.classes()).toContain('my-frame')
    expect(iframe.attributes('title')).toBe('Preview')
  })

  it('emits "load" with the native event and iframe element', async () => {
    const wrapper = mount(IframeWrapper, { props: { srcdoc: '<p>hi</p>' } })
    await wrapper.get('iframe').trigger('load')

    const loadEvents = wrapper.emitted('load')
    expect(loadEvents).toBeTruthy()
    expect(loadEvents?.[0][1]).toBeInstanceOf(HTMLIFrameElement)
  })

  it('auto-injects configured CSS/JS on load and emits "injected"', async () => {
    const wrapper = mount(IframeWrapper, {
      props: {
        srcdoc: '<p>hi</p>',
        css: 'body { color: red; }',
        js: 'window.__ran = true;',
      },
      attachTo: document.body,
    })

    await wrapper.get('iframe').trigger('load')

    const injectedEvents = wrapper.emitted('injected')
    expect(injectedEvents).toBeTruthy()
    expect(injectedEvents?.[0][0]).toHaveLength(2)

    wrapper.unmount()
  })

  it('does not auto-inject when autoInject is false', async () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>', css: 'body{}', autoInject: false },
      attachTo: document.body,
    })

    await wrapper.get('iframe').trigger('load')

    expect(wrapper.emitted('injected')).toBeFalsy()
    wrapper.unmount()
  })

  it('only injects once when injectOnLoad is false', async () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>', css: 'body{}', injectOnLoad: false },
      attachTo: document.body,
    })

    await wrapper.get('iframe').trigger('load')
    await wrapper.get('iframe').trigger('load')

    expect(wrapper.emitted('injected')).toHaveLength(1)
    wrapper.unmount()
  })

  it('exposes imperative methods via defineExpose', () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>' },
      attachTo: document.body,
    })

    expect(typeof wrapper.vm.reload).toBe('function')
    expect(typeof wrapper.vm.getIframe).toBe('function')
    expect(typeof wrapper.vm.injectCss).toBe('function')
    expect(wrapper.vm.getIframe()).toBeInstanceOf(HTMLIFrameElement)

    wrapper.unmount()
  })

  it('triggers a reload when reloadKey changes', async () => {
    const wrapper = mount(IframeWrapper, {
      props: { src: 'https://example.com', reloadKey: 1 },
      attachTo: document.body,
    })

    const iframe = wrapper.get('iframe').element as HTMLIFrameElement
    const srcSetter = vi.spyOn(iframe, 'src', 'set')

    await wrapper.setProps({ reloadKey: 2 })

    expect(srcSetter).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('emits "error" when an injection fails', async () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>', css: 'body{}' },
      attachTo: document.body,
    })

    const iframe = wrapper.get('iframe').element as HTMLIFrameElement
    Object.defineProperty(iframe, 'contentDocument', { value: null, configurable: true })

    await wrapper.get('iframe').trigger('load')

    const errorEvents = wrapper.emitted('error')
    expect(errorEvents).toBeTruthy()
    expect(errorEvents?.[0][0]).toMatchObject({ reason: 'document-unavailable' })

    wrapper.unmount()
  })
})
