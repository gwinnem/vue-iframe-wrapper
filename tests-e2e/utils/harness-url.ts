/**
 * Builds a relative URL to the E2E harness (`tests-e2e/harness`) with the given props
 * encoded as query parameters, matching the parsing logic in `harness/src/App.vue`.
 *
 * Usage: `page.goto(harnessUrl({ srcdoc: '<p>hi</p>', css: 'body{color:red}' }))`
 */
export function harnessUrl(params: Record<string, string | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `/?${query}` : '/'
}
