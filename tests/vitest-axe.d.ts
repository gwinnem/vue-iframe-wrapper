import 'vitest'

// @types/jest-axe only augments Jest's `expect`. This project uses Vitest, so we
// declare the same matcher on Vitest's `Assertion` interface ourselves; the runtime
// implementation is still the one registered via `expect.extend` in `tests/setup.ts`.
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void
  }
}
