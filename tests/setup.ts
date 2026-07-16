import { expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import type { AxeResults, Result } from 'axe-core'

// jest-axe ships `axe()` (the runner) and a `toHaveNoViolations` matcher, but the
// matcher itself is built against Jest's matcher-context shape and throws under
// Vitest ("expectAssertion.call is not a function"). We only use jest-axe's `axe()`
// runner and implement the matcher ourselves against Vitest's `expect.extend` API,
// consuming the same `AxeResults` shape jest-axe would have.
function describeViolation(violation: Result): string {
  return `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help} (${violation.helpUrl})`
}

expect.extend({
  toHaveNoViolations(received: AxeResults) {
    const violations = received?.violations ?? []
    const pass = violations.length === 0
    return {
      pass,
      message: () =>
        pass
          ? 'expected axe results to contain violations, but none were found'
          : `expected no accessibility violations, but found ${violations.length}:\n\n${violations
              .map(describeViolation)
              .join('\n')}`,
    }
  },
})
