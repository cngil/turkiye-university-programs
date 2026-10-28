# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Everyday listeners on laptops and desktops with quiet speakers or headphones: people watching videos, sitting in browser calls, or playing podcasts and music whose source is too quiet even at full system volume. They open the toolbar popup, set a level, and close it again within a few seconds, often while something is already playing.

## Product Purpose

OpenVolume is a browser extension for Chrome (and Chromium browsers) and Firefox that changes the volume of a single tab from 0% to 600%, with optional bass boost, voice boost and a limiter. Success means the tab is audibly louder (or quieter) immediately, without distortion, and the user never has to think about how it works.

## Positioning

An open-source, dependency-free alternative to closed volume boosters: no data collection, no network requests, no remote code, and the shipped code is the repository code. In Chrome it boosts the page's own media first, so fullscreen video keeps working, and only falls back to tab capture when needed. It is the trustworthy option that works on both Chrome and Firefox.

## Operating Context

- Used from the browser toolbar popup (about 340px wide), opened on the tab that is playing.
- Typical session: open, drag or type a level (or press a preset), maybe toggle an effect, close. Keyboard shortcuts (Alt+Shift+Up/Down/0) for adjusting without the popup.
- Secondary jobs: jump to another tab that is playing audio; restore the level last used on a site; reset to 100%.
- Inspired by the Chrome extension Volume Master, whose users expect the same range and quick tab switching.

## Capabilities and Constraints

- Volume 0 to 600% in 1% steps; presets; mute; reset; per-site restore (stored locally).
- Effects: bass boost, voice boost, limiter.
- Engines: page audio (both browsers) and tab capture (Chrome only). Some media (DRM, cross-origin without CORS) cannot use the page engine; Chrome falls back to capture, Firefox cannot boost it.
- Settings: light/dark theme, engine choice (Chrome), per-site memory, optional all-sites access (Firefox), shortcuts.
- UI is localized in English and Turkish.
- Plain HTML/CSS/JS, no framework, no build-time dependencies, no remote fonts or assets (strict CSP, no network requests).
- All features stay; the redesign changes the look only.

## Brand Commitments

- Name: OpenVolume. Existing toolbar icon in `src/icons/` (speaker with two waves).
- Voice: plain and calm; states what happens, never hypes.
- The user asked for a modest interface with exactly two themes, light and dark: first open follows the OS theme, then a single toggle switches and remembers the choice.
- Standing preference: a plain, modern, familiar interface with no visual concept or metaphor. Volume Master is the reference for scope and craft level, but the UI must not be a clone of it.

## Evidence on Hand

No user testimonials, store ratings or download counts exist yet; none may be invented.

## Product Principles

1. Seconds, not minutes: the current tab's level is the first thing seen and the fastest thing changed.
2. Honest state: always show what is actually applied and why something cannot be boosted.
3. Trust by restraint: no data, no network, minimal permissions, and an interface that does not shout.
4. Familiar controls: standard sliders, buttons and switches that work with mouse, wheel and keyboard.

## Accessibility & Inclusion

Full keyboard operation (slider focused on open, arrow keys, M to mute, 0 to reset), visible focus, WCAG AA contrast in both themes, and respect for reduced motion.
