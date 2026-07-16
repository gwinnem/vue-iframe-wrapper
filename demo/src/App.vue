<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IframeWrapper } from '@enterprise/vue-iframe-wrapper'
import type { IframeError, IframeInjectionResult } from '@enterprise/vue-iframe-wrapper'

type LogLevel = 'load' | 'injected' | 'error'

interface LogEntry {
  id: number
  level: LogLevel
  message: string
  time: string
}

const srcdoc = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <main>
      <h1>Sandboxed document</h1>
      <p>This content lives inside the iframe. Use the panel to inject CSS or JS at runtime.</p>
    </main>
  </body>
</html>`

const state = reactive({
  css: 'body { font-family: ui-monospace, monospace; background: #fdf6ec; color: #2a2a2a; padding: 2rem; }\nh1 { color: #b5651d; }',
  js: 'document.querySelector("h1")?.insertAdjacentHTML("afterend", "<p><em>Injected by the host app.</em></p>");',
  autoInject: true,
  injectOnLoad: true,
})

const reloadKey = ref(0)
const log = ref<LogEntry[]>([])
let logId = 0

function pushLog(level: LogLevel, message: string) {
  logId += 1
  log.value.unshift({
    id: logId,
    level,
    message,
    time: new Date().toLocaleTimeString([], { hour12: false }),
  })
  log.value = log.value.slice(0, 12)
}

function handleLoad() {
  pushLog('load', 'iframe document loaded')
}

function handleInjected(results: IframeInjectionResult[]) {
  pushLog('injected', `injected ${results.length} asset${results.length === 1 ? '' : 's'}`)
}

function handleError(error: IframeError) {
  pushLog('error', `${error.reason}: ${error.message}`)
}

function triggerReload() {
  reloadKey.value += 1
  pushLog('load', 'manual reload requested')
}

const levelLabel = computed(() => (level: LogLevel) => {
  if (level === 'load') return 'LOAD'
  if (level === 'injected') return 'INJECT'
  return 'ERROR'
})
</script>

<template>
  <div class="stage">
    <header class="stage__header">
      <span class="stage__eyebrow">// vue-iframe-wrapper</span>
      <h1 class="stage__title">Sandbox console</h1>
      <p class="stage__subtitle">
        Compose CSS and JavaScript, then watch them land inside a live, same-origin iframe.
      </p>
    </header>

    <div class="stage__grid">
      <section class="panel">
        <h2 id="css-label" class="panel__title">01 · Inject CSS</h2>
        <textarea
          v-model="state.css"
          class="panel__textarea"
          spellcheck="false"
          rows="6"
          aria-labelledby="css-label"
        />

        <h2 id="js-label" class="panel__title">02 · Inject JS</h2>
        <textarea
          v-model="state.js"
          class="panel__textarea"
          spellcheck="false"
          rows="4"
          aria-labelledby="js-label"
        />

        <div class="panel__row">
          <label class="panel__toggle">
            <input v-model="state.autoInject" type="checkbox" />
            Auto-inject on load
          </label>
          <label class="panel__toggle">
            <input v-model="state.injectOnLoad" type="checkbox" />
            Re-inject every load
          </label>
        </div>

        <button class="panel__button" type="button" @click="triggerReload">Reload iframe</button>
      </section>

      <section class="preview">
        <div class="preview__frame">
          <IframeWrapper
            :key="reloadKey"
            :srcdoc="srcdoc"
            :css="state.css"
            :js="state.js"
            :auto-inject="state.autoInject"
            :inject-on-load="state.injectOnLoad"
            sandbox="allow-scripts allow-same-origin"
            title="Live preview"
            @load="handleLoad"
            @injected="handleInjected"
            @error="handleError"
          />
        </div>

        <div class="tape">
          <div id="tape-label" class="tape__header">event tape</div>
          <ol class="tape__list" aria-labelledby="tape-label" aria-live="polite">
            <li v-for="entry in log" :key="entry.id" class="tape__entry" :data-level="entry.level">
              <span class="tape__time">{{ entry.time }}</span>
              <span class="tape__level">{{ levelLabel(entry.level) }}</span>
              <span class="tape__message">{{ entry.message }}</span>
            </li>
            <li v-if="log.length === 0" class="tape__entry tape__entry--empty">
              <span class="tape__message">Waiting for the iframe to load…</span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #14171c;
  color: #e7e9ec;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.stage {
  max-width: 1180px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
}

.stage__eyebrow {
  font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: #e0a458;
}

.stage__title {
  margin: 0.5rem 0 0.4rem;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stage__subtitle {
  margin: 0;
  max-width: 46ch;
  color: #8b93a1;
  line-height: 1.5;
}

.stage__grid {
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: minmax(280px, 340px) 1fr;
  gap: 1.5rem;
}

@media (max-width: 880px) {
  .stage__grid {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: #1c2029;
  border: 1px solid #2c313a;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.panel__title {
  margin: 0.4rem 0 0;
  font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  color: #8b93a1;
  text-transform: uppercase;
}

.panel__textarea {
  width: 100%;
  resize: vertical;
  background: #14171c;
  color: #e7e9ec;
  border: 1px solid #2c313a;
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
}

.panel__textarea:focus-visible {
  outline: 2px solid #5fb8b3;
  outline-offset: 1px;
}

.panel__row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.panel__toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #c3c8d1;
}

.panel__button {
  margin-top: 0.6rem;
  background: #e0a458;
  color: #1c1206;
  border: none;
  border-radius: 6px;
  padding: 0.55rem 0.9rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.panel__button:hover {
  background: #ecb36a;
}

.panel__button:focus-visible {
  outline: 2px solid #5fb8b3;
  outline-offset: 2px;
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview__frame {
  background: #1c2029;
  border: 1px solid #2c313a;
  border-radius: 10px;
  padding: 0.6rem;
  height: 320px;
}

.preview__frame iframe {
  border-radius: 6px;
}

.tape {
  background: #14171c;
  border: 1px solid #2c313a;
  border-radius: 10px;
  overflow: hidden;
}

.tape__header {
  font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8b93a1;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid #2c313a;
}

.tape__list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
}

.tape__entry {
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.45rem 0.9rem;
  font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace;
  font-size: 0.78rem;
  border-bottom: 1px solid #1c2029;
}

.tape__entry--empty {
  color: #5a6170;
}

.tape__time {
  color: #5a6170;
  min-width: 5.5em;
}

.tape__level {
  min-width: 4.5em;
  font-weight: 700;
  color: #5fb8b3;
}

.tape__entry[data-level='injected'] .tape__level {
  color: #e0a458;
}

.tape__entry[data-level='error'] .tape__level {
  color: #e2685f;
}

.tape__message {
  color: #c3c8d1;
}
</style>
