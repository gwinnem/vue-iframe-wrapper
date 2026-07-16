import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { mount } from '@vue/test-utils'
import IframeWrapper from '../src/components/IframeWrapper.vue'

describe('IframeWrapper accessibility', () => {
  it('has no axe violations when a title is provided', async () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>', title: 'Report preview' },
      attachTo: document.body,
    })

    const results = await axe(wrapper.element as HTMLElement, { iframes: false })
    expect(results).toHaveNoViolations()

    wrapper.unmount()
  })

  it('flags a missing accessible name when title is omitted', async () => {
    const wrapper = mount(IframeWrapper, {
      props: { srcdoc: '<p>hi</p>' },
      attachTo: document.body,
    })

    const results = await axe(wrapper.element as HTMLElement, {
      iframes: false,
      rules: { 'frame-title': { enabled: true } },
    })

    const frameTitleViolation = results.violations.find((v) => v.id === 'frame-title')
    expect(frameTitleViolation).toBeDefined()

    wrapper.unmount()
  })

  it('renders no violations with a full set of props (class/style/sandbox/title)', async () => {
    const wrapper = mount(IframeWrapper, {
      props: {
        srcdoc: '<p>hi</p>',
        title: 'Themed preview',
        iframeClass: 'custom-frame',
        iframeStyle: { height: '320px' },
        sandbox: 'allow-scripts allow-same-origin',
        css: 'body { margin: 0; }',
      },
      attachTo: document.body,
    })

    const results = await axe(wrapper.element as HTMLElement, { iframes: false })
    expect(results).toHaveNoViolations()

    wrapper.unmount()
  })
})
