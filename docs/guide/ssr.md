# SSR / Nuxt Guidance

This library has no dedicated Nuxt module. Per
[Enterprise Readiness → Phase 6](/enterprise-readiness), a dedicated
`@enterprise/nuxt-iframe-wrapper` package is deliberately deferred until there's
validated demand for it — it's the one item on that plan that opens a new long-term
maintenance surface rather than hardening the existing library, and building it
speculatively is the wrong tradeoff. What follows instead is the "guidance-only" path:
what's already SSR-safe, the one real bug an SSR audit actually found and fixed, and
the pattern to use in Nuxt, Vite SSR, or any other SSR framework today.

## What "SSR-safe" means here

The library never executes injected JavaScript during server rendering — injection
(`injectCss`, `injectJs`, etc.) is a **client-side DOM operation by design**: it
requires a real, loaded `<iframe>` with a `contentDocument` to write into, which simply
doesn't exist on the server. There is no server-side sandboxing question to answer,
only a hydration-timing one: does any of this library's code touch `window`/`document`
_before_ the client-side hydration phase, when running inside a component's `setup()`
during server rendering?

## Audit result

**`<IframeWrapper />` itself and `useIframeInjection`**: safe. Every `window`/`document`
access is inside `onMounted`, an event handler (`handleLoad`, `reload`), or a function
the consumer calls imperatively (`injectCss`, `getDocument`, etc.) — none of which
execute during SSR's server-side render pass. `useId()` (used for the Devtools
registry's per-instance id) is Vue's own SSR-safe unique-id primitive, by design.

**`useIframeMessage`**: this one **did** have a real bug, found by this same audit —
`window.location.origin` and `window.addEventListener` executed unconditionally the
moment the composable was called, which would throw `ReferenceError: window is not
defined` if used inside a component's `setup()` during server rendering. Fixed: every
`window` access is now guarded behind a `typeof window !== 'undefined'` check;
`send()`/`onMessage()` become safe no-ops on the server and the real listener attaches
once the same code runs again during client-side hydration. Verified with a dedicated
test that runs in a genuine Node environment with no `window` global at all
(`tests/useIframeMessage.ssr.spec.ts`) — not just asserted by inspection.

**`useIframeTheme`**: safe — it only ever operates on a `Document` object passed to it
or reached via an `IframeWrapper` instance's own (already-safe) `injectCss` method.

## The pattern to use today

Nothing in this library needs a Nuxt-specific integration to work correctly — the
iframe genuinely has nothing useful to render on the server (there's no content to
inject until the client-side `load` event fires), so the standard SSR pattern is to
defer rendering the whole component to the client, the same way you would for any
component whose real work only makes sense in a browser:

```vue
<template>
  <ClientOnly>
    <IframeWrapper :srcdoc="srcdoc" :css="css" @load="onLoad" />
    <template #fallback>
      <div class="preview-placeholder">Loading preview…</div>
    </template>
  </ClientOnly>
</template>
```

`<ClientOnly>` is built into Nuxt 3+. For Vite SSR or any other framework without a
built-in equivalent, the same effect is a few lines:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isClient = ref(false)
onMounted(() => {
  isClient.value = true
})
</script>

<template>
  <IframeWrapper v-if="isClient" :srcdoc="srcdoc" :css="css" />
  <div v-else class="preview-placeholder">Loading preview…</div>
</template>
```

This isn't a workaround for a limitation in the library — it's the correct pattern
regardless, since there's no meaningful server-rendered iframe content to produce in
the first place. The audit above exists to confirm the library doesn't _also_ throw or
misbehave if you skip this and render it directly; it does not change the
recommendation.

## If you need a real Nuxt module later

Per Phase 6, that would mean: a new `@enterprise/nuxt-iframe-wrapper` package
registering `IframeWrapper` as a Nuxt component/plugin with the `<ClientOnly>` pattern
above built in automatically, its own versioning/release pipeline (duplicating much of
[Phases 1-2](/enterprise-readiness) for a second artifact), and its own test suite
under Nuxt's test utils. Open an issue using the
[feature request template](https://github.com/enterprise/vue-iframe-wrapper/issues/new?template=feature_request.md)
if this is something your team actually needs — real usage evidence is exactly what's
missing to justify starting it.
