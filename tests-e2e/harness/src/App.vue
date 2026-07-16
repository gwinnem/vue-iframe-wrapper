<script setup lang="ts">
import { reactive, ref } from 'vue'
import { IframeWrapper } from '@enterprise/vue-iframe-wrapper'
import type { IframeError, IframeInjectionResult } from '@enterprise/vue-iframe-wrapper'

const params = new URLSearchParams(window.location.search)

function stringParam(name: string): string | undefined {
  return params.has(name) ? (params.get(name) ?? undefined) : undefined
}

function boolParam(name: string, fallback: boolean): boolean {
  if (!params.has(name)) return fallback
  return params.get(name) !== 'false'
}

const frameProps = {
  src: stringParam('src'),
  srcdoc: stringParam('srcdoc'),
  sandbox: stringParam('sandbox') ?? 'allow-scripts allow-same-origin',
  title: stringParam('title') ?? 'E2E harness frame',
  css: stringParam('css'),
  cssUrls: stringParam('cssUrls'),
  js: stringParam('js'),
  jsUrls: stringParam('jsUrls'),
  autoInject: boolParam('autoInject', true),
  injectOnLoad: boolParam('injectOnLoad', true),
}

const state = reactive({
  loadCount: 0,
  injectedCount: 0,
  lastInjectedCount: 0,
  errorCount: 0,
  lastErrorReason: '',
})

const reloadKey = ref(0)

function onLoad(): void {
  state.loadCount += 1
}

function onInjected(results: IframeInjectionResult[]): void {
  state.injectedCount += 1
  state.lastInjectedCount = results.length
}

function onError(error: IframeError): void {
  state.errorCount += 1
  state.lastErrorReason = error.reason
}

function triggerReload(): void {
  reloadKey.value += 1
}
</script>

<template>
  <div>
    <IframeWrapper
      data-testid="preview-frame"
      v-bind="frameProps"
      :reload-key="reloadKey"
      style="width: 600px; height: 400px; display: block"
      @load="onLoad"
      @injected="onInjected"
      @error="onError"
    />

    <dl>
      <dt>load-count</dt>
      <dd data-testid="load-count">{{ state.loadCount }}</dd>

      <dt>injected-count</dt>
      <dd data-testid="injected-count">{{ state.injectedCount }}</dd>

      <dt>last-injected-count</dt>
      <dd data-testid="last-injected-count">{{ state.lastInjectedCount }}</dd>

      <dt>error-count</dt>
      <dd data-testid="error-count">{{ state.errorCount }}</dd>

      <dt>last-error-reason</dt>
      <dd data-testid="last-error-reason">{{ state.lastErrorReason }}</dd>
    </dl>

    <button data-testid="reload-button" type="button" @click="triggerReload">Reload</button>
  </div>
</template>
