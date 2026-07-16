# Examples

## Basic injection

Declarative props are the simplest way to get CSS/JS into the iframe on load.

```vue
<script setup lang="ts">
const css = 'body { font-family: system-ui; padding: 1.5rem; }'
const js = "document.title = 'Patched from the host app'"
</script>

<template>
  <IframeWrapper srcdoc="<h1>Report preview</h1>" :css="css" :js="js" />
</template>
```

## Manual API

Reach for the exposed methods when injection needs to happen in response to something
other than `load` — a button click, a websocket message, a form submission.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { IframeWrapper } from '@enterprise/vue-iframe-wrapper'

const frame = ref<InstanceType<typeof IframeWrapper> | null>(null)

function applyDarkTheme() {
  frame.value?.injectCss('body { background: #111; color: #eee; }', { id: 'theme' })
}
</script>

<template>
  <IframeWrapper ref="frame" srcdoc="<p>Hello</p>" :auto-inject="false" />
  <button @click="applyDarkTheme">Apply dark theme</button>
</template>
```

Passing the same `id` on repeated calls replaces the previous element instead of
stacking duplicates — handy for a theme toggle like the one above.

## External assets

```vue
<template>
  <IframeWrapper
    src="/preview/index.html"
    :css-urls="['/themes/brand.css']"
    :js-urls="['/scripts/analytics-stub.js']"
  />
</template>
```

## Reacting to lifecycle events

```vue
<template>
  <IframeWrapper
    srcdoc="<p>Hi</p>"
    :css="css"
    @load="(_, iframe) => console.log('loaded', iframe)"
    @injected="(results) => console.log('injected', results)"
    @error="(error) => console.error(error.reason, error.message)"
  />
</template>
```
