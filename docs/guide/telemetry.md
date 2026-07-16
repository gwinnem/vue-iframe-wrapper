# Telemetry Integration

The library has no built-in telemetry — it doesn't phone home, and it doesn't depend on
any specific observability SDK. What it does provide is a small, structured event
surface (`load`, `injected`, `error`) specifically designed to be forwarded to whatever
your organization already uses. This page is a reference for wiring that up.

::: tip
None of the code below ships with the package. Copy what's relevant into your own
application — that's deliberate, since bundling a specific telemetry SDK (Sentry,
Datadog, an internal beacon endpoint) into a UI component library would force every
consumer to either adopt it or tree-shake it back out.
:::

## What's worth reporting

| Event      | Useful fields                                                                                                     | Why it matters operationally                                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`    | `error.reason` (`'cross-origin' \| 'document-unavailable' \| 'injection-failed'`), `error.message`, `error.cause` | The `reason` is a stable, low-cardinality field — good for a metric dimension (count by reason) rather than just free-text logging.                                     |
| `injected` | `results.length`, `results.map(r => r.type)`                                                                      | A sudden drop to `0` injected assets across many sessions is a leading indicator of a broken deploy (e.g. a `cssUrls` pointing at a 404) before support tickets arrive. |
| `load`     | timestamp only, really                                                                                            | Mostly useful as a denominator — `error count / load count` is a more meaningful rate than a raw error count.                                                           |

`IframeError.reason` is intentionally the field to key metrics on, not
`error.message` — messages are human-readable prose (see
[Parameters → `IframeError`](/api/parameters#iframeerror)) and can change wording
between versions without that being a breaking change; `reason` is part of the
library's stable public API.

## Generic pattern

Every integration below follows the same shape: attach handlers to the three events,
translate them into whatever your telemetry client expects, and — for `error`
specifically — decide once, in one place, which `reason`s are worth alerting on versus
just counting.

```vue
<script setup lang="ts">
import type { IframeError, IframeInjectionResult } from 'vue-iframe-wrapper'

// Swap this for your real client — Sentry, a custom `track()` wrapper, etc.
import { telemetry } from '@/lib/telemetry'

function onLoad() {
  telemetry.increment('iframe_wrapper.load')
}

function onInjected(results: IframeInjectionResult[]) {
  telemetry.increment('iframe_wrapper.injected', {
    count: results.length,
    types: results.map((r) => r.type),
  })
}

function onError(error: IframeError) {
  telemetry.increment('iframe_wrapper.error', { reason: error.reason })

  // Only genuinely actionable reasons page someone — a cross-origin misconfiguration
  // is a code/config bug; document-unavailable during a fast reload cycle usually
  // isn't.
  if (error.reason === 'injection-failed') {
    telemetry.captureException(error)
  }
}
</script>

<template>
  <IframeWrapper
    :srcdoc="srcdoc"
    :css="css"
    @load="onLoad"
    @injected="onInjected"
    @error="onError"
  />
</template>
```

## Sentry

```vue
<script setup lang="ts">
import * as Sentry from '@sentry/vue'
import type { IframeError, IframeInjectionResult } from 'vue-iframe-wrapper'

function onLoad() {
  Sentry.addBreadcrumb({
    category: 'iframe-wrapper',
    message: 'iframe loaded',
    level: 'info',
  })
}

function onInjected(results: IframeInjectionResult[]) {
  Sentry.addBreadcrumb({
    category: 'iframe-wrapper',
    message: `injected ${results.length} asset(s)`,
    data: { types: results.map((r) => r.type) },
    level: 'info',
  })
}

function onError(error: IframeError) {
  Sentry.addBreadcrumb({
    category: 'iframe-wrapper',
    message: error.message,
    data: { reason: error.reason },
    level: 'warning',
  })

  // Tag the reason so it's filterable in the Sentry UI without parsing message text.
  Sentry.withScope((scope) => {
    scope.setTag('iframe_wrapper.error_reason', error.reason)
    Sentry.captureException(error)
  })
}
</script>
```

Breadcrumbs on `load`/`injected` matter here even though they're not errors themselves
— when an `error` does get captured, Sentry attaches the recent breadcrumb trail, so
you can see "loaded → injected 2 assets → injected 0 assets → error: cross-origin"
instead of just the error in isolation.

## Generic HTTP beacon (no SDK dependency)

For teams with an internal logging endpoint instead of a third-party SDK,
`navigator.sendBeacon` avoids blocking navigation and doesn't need a request/response:

```vue
<script setup lang="ts">
import type { IframeError, IframeInjectionResult } from 'vue-iframe-wrapper'

function send(event: string, payload: Record<string, unknown>) {
  const body = JSON.stringify({
    event,
    payload,
    timestamp: Date.now(),
    component: 'IframeWrapper',
  })
  navigator.sendBeacon('/api/telemetry', body)
}

function onLoad() {
  send('load', {})
}

function onInjected(results: IframeInjectionResult[]) {
  send('injected', { count: results.length, types: results.map((r) => r.type) })
}

function onError(error: IframeError) {
  send('error', { reason: error.reason, message: error.message })
}
</script>
```

## A reusable composable, if you have many instances

If your application mounts `<IframeWrapper>` in several places, wrapping the three
handlers once avoids repeating them at every call site:

```ts
// composables/useIframeTelemetry.ts — example code, not exported by this library
import type { IframeError, IframeInjectionResult } from '/vue-iframe-wrapper'
import { telemetry } from '@/lib/telemetry'

export function useIframeTelemetry(scope: string) {
  return {
    onLoad: () => telemetry.increment(`${scope}.load`),
    onInjected: (results: IframeInjectionResult[]) =>
      telemetry.increment(`${scope}.injected`, { count: results.length }),
    onError: (error: IframeError) =>
      telemetry.increment(`${scope}.error`, { reason: error.reason }),
  }
}
```

```vue
<script setup lang="ts">
import { useIframeTelemetry } from '@/composables/useIframeTelemetry'

const { onLoad, onInjected, onError } = useIframeTelemetry('report-preview')
</script>

<template>
  <IframeWrapper :srcdoc="srcdoc" @load="onLoad" @injected="onInjected" @error="onError" />
</template>
```

This intentionally mirrors the shape of the library's own
[`useIframeInjection`](/api/#useiframeinjection-options) composable — an `onError`
callback plus event-shaped handlers — so it composes naturally alongside it if you're
also using the imperative injection API directly.

## What not to send

- **Injected CSS/JS content itself.** `error.message`/`results` don't include the
  source strings you passed in, by design — don't add them yourself either, since
  `css`/`js` props may contain content you don't want logged verbatim (see
  [Security](/security)).
- **The full `error.cause`** in a beacon payload if it might contain a native
  `DOMException` with implementation-specific detail you haven't reviewed — prefer
  logging `error.reason` and `error.message` and keep `cause` for local debugging or a
  properly-scoped error-tracking SDK (Sentry, etc.) rather than a raw HTTP body.
