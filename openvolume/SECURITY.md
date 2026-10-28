# Security

## Design principles

- **No remote code.** Everything ships in the package. No `eval`, `new Function` or `innerHTML` (a test enforces this).
- **No dependencies.** No third-party packages at runtime or build time. Only the CI lint step runs Mozilla's `web-ext`.
- **Least privilege.** No persistent content scripts and no permanent site access. The page script is injected only when the user opens the popup on that tab, and it runs in the extension's isolated world, out of reach of page scripts.
- **No `web_accessible_resources`**, so websites cannot detect the extension or load its files.
- **Strict CSP:** `script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`.
- **Message validation:** the background only accepts messages from the extension's own pages, and every value is validated and clamped.
- External data such as tab titles is written to the DOM with `textContent` only.

## Reporting a vulnerability

Please report security issues privately through GitHub's **Security > Report a vulnerability** instead of opening a public issue.
