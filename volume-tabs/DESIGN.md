---
name: Volume Tabs
description: A plain, modern per-tab volume popup in two themes, with a neutral grey ground, white or near-black cards and one blue accent.
colors:
  bg: "#f4f5f7"
  surface: "#ffffff"
  surface-2: "#eef0f3"
  surface-3: "#e3e6eb"
  border: "#e1e4e9"
  border-strong: "#c9ced6"
  text: "#15181d"
  muted: "#5d6573"
  faint: "#626975"
  control-off: "#8e95a0"
  accent: "#2563eb"
  accent-soft: "#e8effd"
  accent-text: "#1d4ed8"
  high: "#c2410c"
  warn: "#a16207"
  error: "#b91c1c"
  knob: "#ffffff"
  bg-dark: "#111214"
  surface-dark: "#1b1c1f"
  surface-2-dark: "#242529"
  surface-3-dark: "#2e3034"
  border-dark: "#2b2d31"
  border-strong-dark: "#3c3f45"
  text-dark: "#ececee"
  muted-dark: "#a0a4ab"
  faint-dark: "#8d929a"
  control-off-dark: "#676c75"
  accent-dark: "#5b8ef0"
  accent-soft-dark: "#1d2a42"
  accent-text-dark: "#8fb1f5"
  high-dark: "#f0864f"
  warn-dark: "#e0b453"
  error-dark: "#f07a7a"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "36px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.4
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
  body-strong:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  tick:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tnum"
rounded:
  inner: "7px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  full: "999px"
spacing:
  hairline: "2px"
  inset: "3px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  card: "14px"
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "14px"
  setting-group:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "12px 14px 10px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    size: "30px"
  button-icon-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "30px"
    padding: "0 12px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
  button-mute:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    size: "38px"
  button-mute-hover:
    backgroundColor: "{colors.surface-3}"
  segmented-track:
    backgroundColor: "{colors.surface-2}"
    rounded: "{rounded.md}"
    padding: "3px"
  segmented-item:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.inner}"
    height: "26px"
  segmented-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  segmented-item-active-dark:
    backgroundColor: "{colors.surface-3-dark}"
    textColor: "{colors.text-dark}"
  sound-mode:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    height: "32px"
    padding: "0 6px"
  sound-mode-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-text}"
  slider-track:
    backgroundColor: "{colors.control-off}"
    rounded: "{rounded.full}"
    height: "6px"
  slider-fill:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
    height: "6px"
  slider-fill-high:
    backgroundColor: "{colors.high}"
  slider-thumb:
    backgroundColor: "{colors.knob}"
    rounded: "{rounded.full}"
    size: "18px"
  switch-off:
    backgroundColor: "{colors.control-off}"
    rounded: "{rounded.full}"
    width: "34px"
    height: "20px"
  switch-on:
    backgroundColor: "{colors.accent}"
  chip-mode:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  tab-row:
    backgroundColor: "transparent"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "7px 8px"
  tab-row-hover:
    backgroundColor: "{colors.surface}"
  status-callout:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "9px 10px"
  link:
    textColor: "{colors.accent-text}"
    typography: "{typography.label}"
  toast:
    backgroundColor: "{colors.text}"
    textColor: "{colors.bg}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "7px 12px"
---

# Design System: Volume Tabs

## Overview

**Creative North Star: "The Category Standard, Played Straight"**

Volume Tabs looks like the volume popup people already expect from a well-made browser extension, and nothing more. There is no concept, no metaphor and no ornament: a neutral grey ground, one white (light) or near-black (dark) card that holds every control for the current tab, a row list of other playing tabs below it, and a single blue accent that marks what is filled, toggled, focused or clickable. The craft shows in alignment, contrast and state, not in decoration.

The popup is dense and fixed at 340px wide, built for a few seconds of use on a tab that is already playing. The level numeral is the largest thing on screen; every other element is a familiar control (slider, segmented presets, toggle buttons, iOS-style switches, a round mute button) at small product-UI sizes. Exactly two themes exist. The first open follows the operating system, then one header toggle switches and remembers the choice.

The voice is calm. Orange is the only second hue, and it appears only when the level is high enough to risk distortion. Volume Master is the bar for scope and finish, but the system is its own and must not drift into a clone of it.

**Key Characteristics:**
- Neutral grey ground, one lifted card, flat rows and settings groups.
- One blue accent; orange reserved for levels above 300%.
- System sans only, hierarchy by size and weight, tabular numerals everywhere numbers change.
- Gently rounded corners (8px to 12px) with concentric nested radii.
- Quiet 150ms ease-out state changes, removed under reduced motion.
- Two complete themes with mirrored token names.

## Colors

A cool neutral grey family carries the whole interface; one saturated blue and one warning orange are the only hues with a job.

### Primary
- **Signal Blue** (`accent`, `accent-dark`): the slider fill below 301%, checked switches and radios, the focus ring, the text caret and the selected sound mode. It fills and marks; it never decorates a surface.
- **Pale Blue Wash** (`accent-soft`, `accent-soft-dark`): the background of the selected sound mode, the inner halo of the focused slider thumb, the focused level numeral and text selection.
- **Ink Blue** (`accent-text`, `accent-text-dark`): blue used as text, for links, the selected sound mode label, a playing-tab speaker icon and the level badge of boosted tabs. It is a deeper blue than the fill in light and a lighter one in dark so it reads at AA on surfaces.

### Secondary
- **Loud Orange** (`high`, `high-dark`): the level state above 300%. It replaces the blue slider fill, colors the level numeral and colors that tab's badge in the playing list. It means "this may distort", nothing else.

### Tertiary
- **Amber Notice** (`warn`, `warn-dark`) and **Fault Red** (`error`, `error-dark`): icon color inside the status callout only. Warnings and errors tint the icon; the text stays in the neutral ramp (error text moves up to full `text`).

### Neutral
- **Cool Grey Ground** (`bg`, `bg-dark`): the popup background behind the card and under the playing-tab rows.
- **Card White / Card Charcoal** (`surface`, `surface-dark`): the control card, settings groups, ghost buttons, the active preset segment and a hovered tab row.
- **Soft Fill** (`surface-2`, `surface-2-dark`): hover fills, the segmented track, the mute button, the mode chip, favicon wells and the status callout.
- **Pressed Fill** (`surface-3`, `surface-3-dark`): pressed states, a hovered mute button and the active preset segment in dark.
- **Hairline** (`border`, `border-dark`): 1px edges on the card, settings groups, ghost buttons and unselected sound mode buttons.
- **Strong Hairline** (`border-strong`, `border-strong-dark`): the scrollbar thumb.
- **Ink** (`text`, `text-dark`): primary text, the level numeral, titles. Also the toast background, inverted against `bg`.
- **Secondary Ink** (`muted`, `muted-dark`): hosts, section headings, hints, idle icons, idle presets and sound modes.
- **Tertiary Ink** (`faint`, `faint-dark`): tick labels, disabled text and silent tab icons.
- **Off Control** (`control-off`, `control-off-dark`): the empty slider track, off switches and unchecked radio rings, tuned to 3:1 against the card.
- **Knob White** (`knob`): the slider thumb and switch knob in both themes, lifted by a small shadow.

### Named Rules
**The One Blue Rule.** Blue is the only accent. It marks filled, on, focused and clickable things; no surface, heading or border is ever blue at rest.

**The Orange Means Loud Rule.** Orange appears only when the level is above 300% (slider fill, level numeral, tab badge). It is never decorative and never used below that threshold.

**The Mirrored Theme Rule.** Every color has exactly a light and a dark value under the same token name. A new color is not done until both exist and both pass WCAG AA.

## Typography

**Display Font:** system-ui (with -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, sans-serif)
**Body Font:** the same system stack
**Label/Mono Font:** the same system stack, with tabular figures for numbers

**Character:** One native sans in every role, because the popup ships no remote assets. Hierarchy comes from size and a narrow weight band (400, 500, 600, 650), which keeps the popup feeling like part of the browser.

### Hierarchy
- **Display** (650, 36px, 1.1, -0.02em, tabular): the editable level numeral only, followed by a muted 15px/600 percent sign.
- **Headline** (650, 15px, 1.4): the settings view title.
- **Title** (650, 14px, 1.4): the Volume Tabs name in the header.
- **Body Strong** (600, 13px, 1.4): the current tab title and settings option names.
- **Body** (400, 13px, 1.4): default running text.
- **Label** (600, 12px, 1.4): buttons, presets, sound modes, links, section headings, the status text and tab badges. Playing-tab titles use this size at 500.
- **Caption** (400, 11px, 1.4): tab hosts in the list, settings hints; the mode chip sets it in 600.
- **Tick** (400, 10px, tabular): the 0 to 500 scale under the slider.

### Named Rules
**The Tabular Numbers Rule.** Every number that changes or lines up (level numeral, ticks, presets, tab badges) uses tabular figures so values never jitter.

**The Sentence Case Rule.** Headings and labels are sentence case in `muted` at 12px/600. No uppercase, no letter-spaced labels, no small text above a heading.

## Layout

A single 340px column. The header runs 10px 10px 8px 14px with the brand at left and two 30px icon buttons at right. The main view sits inside a 10px side gutter: one control card (14px padding), then the playing-tab section (14px above) as a scrolling list capped at 200px. The footer centers a shield and the privacy line under everything. Settings replace the main view in place, with a back button and a stack of settings groups 8px apart.

Inside the card, the order is fixed by use: tab identity, then the level readout row (mute, numeral, reset), slider with ticks, presets, sound mode, then the optional restore button and status line. Vertical rhythm steps through 8px, 12px and 14px; horizontal gaps through 6px, 8px and 10px. Ticks are inset 9px on each side so their centers sit under the thumb's center at 0% and 600%. There are no breakpoints; the width is the browser popup's.

## Elevation & Depth

Mostly flat with one lifted plane. The control card carries a soft two-layer shadow so the controls read as one object over the grey ground; everything else separates by tonal fill or a 1px hairline. In dark, the same structure uses deeper, more opaque shadows because the surfaces are close in value.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 1px 2px rgba(21, 24, 29, 0.05), 0 4px 12px rgba(21, 24, 29, 0.06)`; dark `0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25)`): the control card and the transient toast.
- **Segment lift** (`box-shadow: 0 1px 2px rgba(21, 24, 29, 0.06)`; dark `0 1px 2px rgba(0, 0, 0, 0.3)`): the active preset inside the segmented track.
- **Knob lift** (`box-shadow: 0 0 0 1px rgba(21, 24, 29, 0.12), 0 1px 3px rgba(21, 24, 29, 0.3)`): the slider thumb; the switch knob uses `0 1px 2px rgba(0, 0, 0, 0.25)`.
- **Thumb focus** (`box-shadow: 0 0 0 3px accent-soft, 0 0 0 5px accent`): the keyboard focus ring for the slider thumb.

### Named Rules
**The One Lifted Card Rule.** Only the control card (and the toast while it shows) casts a card shadow. Settings groups, rows, buttons and the status line stay flat.

## Shapes

Gently rounded and concentric. Containers use 12px (card, settings groups), controls 8px (buttons, sound mode buttons, status, toast), list rows and the segmented track 10px, and items nested inside a padded container take the outer radius minus the inset (7px segments inside the 10px track with a 3px inset; 7px favicon wells). Continuous controls are fully round: the 6px slider track, the 34 by 20px switch, the mode chip, the 38px mute button and the 18px thumb. Borders are 1px hairlines; radio rings are 1.5px. Icons are 24-unit stroked line icons drawn at 16px (12px to 18px in places) with a 1.75 stroke and round caps and joins.

### Named Rules
**The Nested Radius Rule.** An element inside a padded rounded container takes the container's radius minus the padding, so curves stay parallel.

## Components

Familiar, quiet and precise: every control is the standard one, sized for a dense popup, with state shown by fill and tint rather than by motion or color shifts across the whole surface.

### Buttons
- **Shape:** gently rounded (8px); the mute button is a full circle (38px).
- **Icon button:** 30px square, transparent, `muted` icon; hover fills `surface-2` and darkens the icon to `text`; pressed fills `surface-3`.
- **Ghost button:** `surface` fill, 1px hairline, 30px tall, 12px side padding, label type with an optional 16px leading icon. Hover `surface-2`, pressed `surface-3`. A full-width variant sits 8px below related settings.
- **Mute button:** round `surface-2` well with an 18px speaker icon; hover `surface-3`. When muted the icon switches to the crossed speaker in `muted`.
- **Restore button:** full width, 32px, borderless `surface-2` fill, label type with a leading icon; hover `surface-3`.
- **Link:** `accent-text` label type, underline offset 3px that fades in on hover.
- **Hover / Focus:** background and color transition over 150ms ease-out. Keyboard focus is a 2px `accent` outline at 2px offset on every control.

### Chips
- **Style:** the engine mode chip is a pill (999px) in `surface-2` with `muted` caption text at 600, padding 2px 8px. It labels state; it is not interactive.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** `surface`.
- **Shadow Strategy:** card lift on the control card only; settings groups are flat (see Elevation & Depth).
- **Border:** 1px `border` on both.
- **Internal Padding:** 14px on the control card, 12px 14px 10px on settings groups.

### Inputs / Fields
- **Level numeral:** a borderless text input in display type, right aligned in 3.1ch. Hover shows a `surface-2` wash; focus replaces the outline with an `accent-soft` wash, 4px corners.
- **Switch:** iOS-style 34 by 20px pill, `control-off` when off, `accent` when on, with a 16px white knob that slides 14px over 150ms. Disabled drops to 50% opacity.
- **Radio:** 16px ring in 1.5px `control-off`; checked turns the ring `accent` with a 3.5px `accent` dot.
- **Disabled:** text goes to `faint` and the cursor to not-allowed.

### Navigation
- **Header:** brand lockup (22px icon with 7px corners plus the title) at left, theme toggle and settings as icon buttons at right. The theme toggle shows the moon in light and the sun in dark.
- **Settings:** an in-place view with a back icon button beside the headline; no tabs, no routing chrome.
- **Playing tabs:** full-width rows with 10px corners, a 26px favicon well, title in 12px/500 and host in caption, an optional level badge (12px/650, `accent-text`, or `high` above 300%), and a speaker icon that turns `accent-text` while the tab is audible. Hover lifts the row to `surface`; pressed `surface-2`.

### Volume Slider (signature)
A native range input restyled identically in both engines: 24px hit area, 6px fully round track in `control-off`, fill in `accent` (or `high` above 300%) up to the current position, and an 18px white thumb with the knob lift. The thumb grows to 1.1 while dragged. A 0 to 500 tick scale in tick type sits 2px below.

### Preset Segmented Control (signature)
Six equal segments (50, 100, 200, 300, 400, 500) in a `surface-2` track with 3px inset and 2px gaps. Idle segments are transparent `muted` label type; hover darkens text to `text`. The segment matching the current level fills with `surface` (dark: `surface-3`), `text` color and the segment lift.

### Sound Mode Selector (signature)
One choice of three, in this order: Default, Voice, Bass (Turkish UI: Normal, Konuşma, Bas). Three equal buttons in a row with 6px gaps, exposed as a radio group (`role="radiogroup"`, arrow keys move the selection): 32px tall, 6px side padding, 1px hairline, transparent, a 14px `muted` icon and label that ellipsizes if a translation runs long. Hover fills `surface-2`. The selected mode (`aria-checked="true"`) drops the border and fills `accent-soft` with `accent-text`. Default leaves the sound untouched; Voice lifts the presence band; Bass adds a low shelf. There is no limiter.

### Status Line
An inline callout with a 14px info icon in a `surface-2` box at 8px corners and `muted` label text; the icon turns `warn` or `error` with the severity. When the only content is an engine-switch link, it collapses to a plain link row with no fill and no icon.

## Do's and Don'ts

### Do:
- **Do** take every color from the token set and supply both the light and the dark value under the same name.
- **Do** keep blue (`accent`) for fill, on, focus and link states, and switch the level color to `high` only above 300%.
- **Do** use the system sans stack with tabular figures for any number that changes.
- **Do** separate elements with tonal fills (`surface-2`, `surface-3`) and 1px hairlines; give the card lift only to the control card and the toast.
- **Do** keep corners concentric: 12px containers, 10px rows and tracks, 8px controls, 7px nested items, full round for continuous controls.
- **Do** animate only color, background and small transforms at 150ms ease-out, and remove transitions under `prefers-reduced-motion`.
- **Do** show keyboard focus with the 2px `accent` outline at 2px offset (the slider thumb uses its double ring instead).

### Don't:
- **Don't** add a second accent hue, a gradient surface or a tinted background; the ground stays neutral grey.
- **Don't** use orange for anything but a level above 300%.
- **Don't** load remote fonts, images or icon fonts; icons are inline SVG line icons.
- **Don't** add a visual concept, metaphor or illustration; the popup stays plain and familiar.
- **Don't** add uppercase labels, letter-spaced labels or small text above headings.
- **Don't** put card shadows on settings groups, list rows or buttons.
- **Don't** copy Volume Master's layout or styling; match its scope and finish, not its look.
