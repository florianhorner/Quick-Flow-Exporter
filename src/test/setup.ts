import '@testing-library/jest-dom/vitest';

// Node's server-side Web Storage must not shadow the current jsdom window.
const dom = (globalThis as typeof globalThis & { jsdom?: { window: Window } }).jsdom;
if (dom) {
  Object.defineProperties(globalThis, {
    localStorage: {
      configurable: true,
      writable: true,
      value: dom.window.localStorage,
    },
    sessionStorage: {
      configurable: true,
      writable: true,
      value: dom.window.sessionStorage,
    },
  });
}
