import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { mount } from '@vue/test-utils'
import App from '../src/App.vue'

// The one item ENTERPRISE_READINESS.md Phase 3 explicitly deferred: an a11y smoke test
// on the demo app's own interactive controls (checkboxes, textareas, buttons), not just
// the library's IframeWrapper component (already covered by
// tests/IframeWrapper.a11y.spec.ts). The demo is a reference app, not a published
// artifact, so it's excluded from the coverage gate (see vitest.config.ts), but its
// accessibility is still worth catching regressions on — it's the first thing anyone
// evaluating this library actually clicks around in.

describe('demo app accessibility', () => {
  it('has no axe violations on initial render', async () => {
    const wrapper = mount(App, { attachTo: document.body })

    // iframes: false — same reasoning as tests/IframeWrapper.a11y.spec.ts: axe's
    // cross-frame postMessage traversal isn't supported in jsdom.
    const results = await axe(wrapper.element as HTMLElement, { iframes: false })
    expect(results).toHaveNoViolations()

    wrapper.unmount()
  })

  it('gives both textareas an accessible name via aria-labelledby', () => {
    const wrapper = mount(App, { attachTo: document.body })

    const cssTextarea = wrapper.get('#css-label + textarea')
    const jsTextarea = wrapper.get('#js-label + textarea')

    expect(cssTextarea.attributes('aria-labelledby')).toBe('css-label')
    expect(jsTextarea.attributes('aria-labelledby')).toBe('js-label')

    wrapper.unmount()
  })

  it('associates each checkbox with its label text via native <label> wrapping', () => {
    const wrapper = mount(App, { attachTo: document.body })

    const toggles = wrapper.findAll('.panel__toggle')
    expect(toggles).toHaveLength(2)
    for (const toggle of toggles) {
      expect(toggle.element.tagName).toBe('LABEL')
      expect(toggle.find('input[type="checkbox"]').exists()).toBe(true)
      expect(toggle.text().length).toBeGreaterThan(0)
    }

    wrapper.unmount()
  })

  it('gives the reload button a real accessible name', () => {
    const wrapper = mount(App, { attachTo: document.body })

    const button = wrapper.get('.panel__button')
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.text()).toBe('Reload iframe')

    wrapper.unmount()
  })

  it('marks the event tape as a labelled, live-announcing region', () => {
    const wrapper = mount(App, { attachTo: document.body })

    const tape = wrapper.get('.tape__list')
    expect(tape.attributes('aria-labelledby')).toBe('tape-label')
    expect(tape.attributes('aria-live')).toBe('polite')

    wrapper.unmount()
  })

  it('remains free of axe violations after logging events and reloading', async () => {
    const wrapper = mount(App, { attachTo: document.body })

    await wrapper.find('iframe').trigger('load')
    await wrapper.get('.panel__button').trigger('click')
    await wrapper.find('iframe').trigger('load')

    const results = await axe(wrapper.element as HTMLElement, { iframes: false })
    expect(results).toHaveNoViolations()

    wrapper.unmount()
  })
})
