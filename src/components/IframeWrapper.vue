<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIframeInjection } from '../composables/useIframeInjection'
import type {
  IframeError,
  IframeInjectionResult,
  IframeWrapperEmits,
  IframeWrapperProps,
} from '../types/iframe'

const props = withDefaults(defineProps<IframeWrapperProps>(), {
  sandbox: 'allow-scripts allow-same-origin',
  autoInject: true,
  injectOnLoad: true,
})

const emit = defineEmits<IframeWrapperEmits>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let hasInjectedOnce = false

const {
  getIframe,
  getWindow,
  getDocument,
  injectCss,
  injectCssUrl,
  injectJs,
  injectJsUrl,
  injectConfiguredAssets,
} = useIframeInjection({
  iframeRef,
  onError: (error: IframeError) => emit('error', error),
})

function runAutoInjection(): void {
  if (!props.autoInject) return
  if (hasInjectedOnce && !props.injectOnLoad) return

  const results: IframeInjectionResult[] = injectConfiguredAssets({
    css: props.css,
    cssUrls: props.cssUrls,
    js: props.js,
    jsUrls: props.jsUrls,
  })

  hasInjectedOnce = true
  if (results.length > 0) {
    emit('injected', results)
  }
}

function handleLoad(event: Event): void {
  const iframe = getIframe()
  if (iframe) {
    emit('load', event, iframe)
  }
  runAutoInjection()
}

function reload(): void {
  const iframe = getIframe()
  if (!iframe) return

  if (props.srcdoc !== undefined) {
    const current = iframe.srcdoc
    iframe.srcdoc = ''
    // Re-assign on next tick-equivalent so the browser registers a change
    // even when the content is identical.
    requestAnimationFrame(() => {
      iframe.srcdoc = current
    })
  } else if (props.src !== undefined) {
    iframe.src = iframe.src
  }
}

watch(
  () => props.reloadKey,
  (next, prev) => {
    if (next !== prev) reload()
  },
)

defineExpose({
  reload,
  getIframe,
  getWindow,
  getDocument,
  injectCss,
  injectCssUrl,
  injectJs,
  injectJsUrl,
  injectConfiguredAssets,
})
</script>

<template>
  <iframe
    ref="iframeRef"
    class="viw-iframe"
    :class="iframeClass"
    :style="iframeStyle"
    :src="src"
    :srcdoc="srcdoc"
    :sandbox="sandbox"
    :title="title"
    @load="handleLoad"
  />
</template>

<style>
.viw-iframe {
  border: none;
  width: 100%;
  height: 100%;
}
</style>
