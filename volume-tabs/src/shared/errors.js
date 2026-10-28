// An error with a stable `code` the popup can translate.
// Codes: no-access, restricted, busy, capture-failed, error
export class EngineError extends Error {
  constructor(code, detail) {
    super(detail || code);
    this.name = 'EngineError';
    this.code = code;
  }
}
