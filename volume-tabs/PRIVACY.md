# Privacy Policy

**In short: Volume Tabs does not collect, store or share any personal data.**

- The extension has no servers and makes no network requests. There is no analytics, telemetry, crash reporting or advertising.
- Audio is processed entirely inside your browser with the Web Audio API. It is never recorded, stored or transmitted.
- Page content is never read. The extension only touches a page when you open its popup on that tab (`activeTab`).
- Only the following is kept, locally in your browser's extension storage:
  - Your settings (theme, audio engine, memory preferences) in `storage.local`.
  - If "Remember the volume I use on each site" is on: the host name (for example `www.youtube.com`) and the level you used there, in `storage.local`. At most 1000 sites are kept. Clear them with *Settings > Forget saved sites*. Uninstalling the extension removes everything.
  - The audio state of open tabs in `storage.session`, which is cleared when the browser closes.
- Tab icons: Chrome shows them from its own local favicon cache. Firefox shows the icon URL the browser reports for the tab, which is the site's own icon, requested without a referrer.
