# Accessibility

## What the library guarantees

- The rendered `<iframe>` accepts a `title` prop and passes it straight through as the
  native `title` attribute — the mechanism browsers and assistive technology use to
  announce what an iframe contains.
- Component tests run [`axe-core`](https://github.com/dequelabs/axe-core) (via
  `jest-axe`'s runner, adapted for Vitest — see `tests/setup.ts`) against the rendered
  markup on every CI run, covering the `frame-title` rule and general markup validity
  for the props surface (`iframeClass`, `iframeStyle`, `sandbox`, `css`).
- Nothing in the component's own template or styles relies on color alone to convey
  information, traps focus, or interferes with keyboard navigation — the component
  renders a single native `<iframe>` element with no additional interactive chrome.

## What the library does **not** guarantee

Accessibility inside the iframe's **content** is entirely the consumer's
responsibility — the library has no visibility into or control over a `srcdoc` string
or a `src` document's own markup, beyond injecting the `css`/`js` you provide.

Specifically out of this library's control:

- Whether the document loaded via `src`/`srcdoc` itself has correct heading structure,
  color contrast, alt text, form labels, etc.
- Whether injected `css` introduces contrast or focus-visibility regressions inside the
  iframe document.
- Whether injected `js` introduces or removes keyboard traps, live regions, or other
  dynamic accessibility behavior inside the iframe document.
- Focus management **between** the host page and the iframe (e.g. moving focus into the
  iframe after it loads) — this is left to the consumer since the right behavior is
  highly context-dependent (a report preview vs. a modal-hosted iframe have different
  expectations).

## Required consumer responsibility: always set `title`

`title` is optional at the type level (an empty title is technically legal HTML) but
**omitting it is treated as an accessibility bug** in this library's own test suite and
should be treated the same way in consuming applications:

```vue
<!-- ❌ fails the frame-title axe rule -->
<IframeWrapper srcdoc="<p>hi</p>" />

<!-- ✅ -->
<IframeWrapper srcdoc="<p>hi</p>" title="Report preview" />
```

Write the title from the _user's_ point of view — describe what the frame contains
("Q3 report preview"), not how it's implemented ("iframe wrapper component").

## Testing your own usage

Because the library's own tests only cover the component's props surface, not your
specific `srcdoc`/`src` content, add your own axe (or equivalent) check against the
_rendered contents_ of the iframe if that content is dynamic or user-generated:

```ts
import { axe } from 'jest-axe'

it('injected report content has no obvious a11y violations', async () => {
  const wrapper = mount(IframeWrapper, {
    props: { srcdoc: reportHtml, title: 'Report preview' },
    attachTo: document.body,
  })
  await wrapper.get('iframe').trigger('load')

  const doc = (wrapper.vm.getDocument() as Document | null)?.body
  if (doc) {
    const results = await axe(doc, { iframes: false })
    expect(results.violations).toHaveLength(0)
  }
})
```

See [Testing](/guide/testing) for the general test-setup pattern this builds on.

## Roadmap

Real-browser accessibility automation (screen-reader-level checks, keyboard-navigation
E2E across the demo app) is tracked as
[Phase 4 of the Enterprise Readiness plan](/enterprise-readiness#phase-4--real-browser-e2e-suite-sds-phase-9-1–2-weeks) —
today's `axe-core`-in-jsdom coverage catches markup-level issues but cannot verify real
assistive-technology behavior.
