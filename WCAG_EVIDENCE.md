# WCAG Evidence Map

This is engineering evidence, not a certification or claim of WCAG conformance. “Supports” means the repository contains relevant implementation and test evidence; rendered behavior still needs the listed manual checks.

| Criterion | Status | Evidence strength | Repository evidence | Remaining verification |
| --- | --- | --- | --- | --- |
| 1.3.1 Info and Relationships | Supports | Strong | Semantic trigger, menu/menuitem roles, preserved checkable roles and explicit radio groups, list-role normalization, labelled relationships, submenu controls | Inspect final host markup and AT navigation |
| 1.4.1 Use of Color | Supports | Moderate | Active, expanded, disabled, and focus states use more than color in markup/state | Manual visual review in host themes |
| 1.4.3 Contrast (Minimum) | Risk area | Manual | Dark default tokens and demo themes exist | Measure rendered text in normal and custom themes |
| 1.4.10 Reflow | Supports | Moderate | Mobile sheet rules, dynamic viewport units, wrapping labels, internal scrolling; 320px Chromium smoke test | 200% zoom across target browsers |
| 1.4.11 Non-text Contrast | Supports | Moderate | Default panel border measures above 3:1 against its background; the status-demo control border also exceeds 3:1; focus-ring tokens and forced-colors rules are present | Re-measure custom host themes and rendered focus indicators |
| 1.4.12 Text Spacing | Supports | Moderate | No fixed item height; labels wrap and panels scroll | Apply WCAG text-spacing overrides manually |
| 2.1.1 Keyboard | Supports | Strong | Trigger, activation, checkable Enter/Space behavior, arrow, Home/End, typeahead, submenu, link, disabled, busy, and RTL tests | Browser/AT smoke tests beyond Chromium |
| 2.1.2 No Keyboard Trap | Supports | Strong | Escape, Tab/Shift+Tab, outside dismissal, portal exit, and restoration tests | Safari and Firefox Tab-order checks |
| 2.3.3 Animation from Interactions | Supports | Moderate | Component-scoped reduced-motion override removes effective animation duration | OS-level reduced-motion comfort check |
| 2.4.3 Focus Order | Supports | Strong | Open/close, submenu, Tab exit, refresh fallback, and outside-focus tests | Complex host layouts and shadow DOM if used |
| 2.4.4 Link Purpose | Supports | Strong | Semantic anchor example with descriptive text; native navigation preserved and tested | Confirm destination copy in host integrations |
| 2.4.6 Headings and Labels | Supports | Moderate | Trigger-name validation and named demo sections | Review host-provided command names |
| 2.4.7 Focus Visible | Supports | Moderate | Explicit `:focus-visible` ring and forced-colors override | Rendered contrast and clipping checks |
| 2.4.11 Focus Not Obscured | Risk area | Manual | Viewport clamping and scrollable fixed layers | Zoom, mobile keyboard, sticky-host UI checks |
| 2.4.13 Focus Appearance | Risk area | Manual | Three-pixel default ring and forced-colors ring | Measure rendered perimeter/contrast |
| 2.5.3 Label in Name | Supports | Moderate | Visible-text names remain intact; icon-only triggers require an explicit usable name | Speech-input check for custom labels |
| 2.5.8 Target Size | Supports | Moderate | Three-rem items and 3.25rem coarse-pointer minimum | Touch-device comfort check |
| 3.2.1 On Focus | Supports | Strong | Focus movement does not activate commands; outside focus only dismisses | Host navigation integration |
| 3.2.2 On Input | Supports | Strong | State controls and commands use explicit activation; link navigation remains native | Confirm host command side effects |
| 4.1.2 Name, Role, Value | Supports | Strong | Trigger validation, ARIA setup/state synchronization, checkable role/state transitions, disabled/busy/submenu tests, cleanup | Manual screen-reader checked-state announcements |
| 4.1.3 Status Messages | Supports | Strong for DOM; manual for speech | Persistent opt-in polite target, formatter handling, repeat-message and teardown tests | VoiceOver/NVDA repeated-message quality |

## Automated evidence

- `npm test`: behavior-level Vitest coverage for initialization, lifecycle, keyboard, ARIA, announcements, dynamic refresh, multiple instances, portal cleanup, and destroy.
- `npm run typecheck`: public TypeScript surface and implementation validation.
- `npm run build`: distributable package and GitHub Pages generation.
- `npm run pack:check`: package-content dry run.

See `ACCESSIBILITY_TESTING.md` for manual browser, assistive-technology, responsive, forced-colors, touch, and reduced-motion scenarios.
