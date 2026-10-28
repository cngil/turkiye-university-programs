// Firefox exposes the promise-based `browser` namespace, Chrome exposes `chrome`
// (which also returns promises in Manifest V3).
export const api = globalThis.browser ?? globalThis.chrome;

export const IS_FIREFOX = api.runtime.getURL('').startsWith('moz-extension:');
