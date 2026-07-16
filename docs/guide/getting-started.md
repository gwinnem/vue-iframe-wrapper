# Getting Started

## Installation

```bash
npm install vue-iframe-wrapper vue
```

`vue` is a peer dependency — the library targets Vue `^3.0.0`.

## Basic Usage

```vue
<script setup lang="ts">
import { IframeWrapper } from 'vue-iframe-wrapper'
import 'vue-iframe-wrapper/style.css'
</script>

<template>
  <IframeWrapper
    srcdoc="<h1>Hello from inside the iframe</h1>"
    css="h1 { color: teal; font-family: sans-serif; }"
    js="console.log('injected!')"
  />
</template>
```

That's it — once the iframe fires its native `load` event, the configured `css` and `js`
are injected automatically.

## Loading a same-origin URL instead of `srcdoc`

```vue
<template>
  <IframeWrapper src="/preview/report.html" :css="reportTheme" />
</template>
```

`src` and `srcdoc` are mutually exclusive; supply whichever fits your use case. Only
**same-origin** documents can be inspected or injected into — see [Security](/security)
for the full model and recommended `sandbox` values.

## Sizing the iframe

The component ships a minimal default style (`width: 100%; height: 100%; border: none;`).
Wrap it in a sized container, or pass your own `iframeClass` / `iframeStyle`:

```vue
<template>
  <div style="height: 480px">
    <IframeWrapper srcdoc="<p>Sized by the parent container</p>" />
  </div>
</template>
```

## Next steps

- Browse runnable [Examples](/guide/examples)
- Read the full [API Reference](/api/)
- Review the [Security model](/security) before injecting untrusted content
