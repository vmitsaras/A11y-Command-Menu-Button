# Accessibility Testing

This checklist records expected behavior for the command menu package. Automated DOM tests provide implementation evidence, but they do not prove assistive-technology output or full WCAG conformance.

## Keyboard behavior matrix

| Key or action | Expected behavior | Focus result | Automated evidence |
| --- | --- | --- | --- |
| Enter / Space / ArrowDown on trigger | Open menu | First discoverable command | Vitest |
| ArrowUp on trigger | Open menu | Last discoverable command | Vitest |
| ArrowUp / ArrowDown | Move through current menu, with optional looping | Previous / next command | Vitest |
| Home / End | Move to boundary | First / last command | Vitest |
| ArrowRight / ArrowLeft | Open / close submenu; reverse in RTL | First submenu item / parent command | Vitest |
| Enter / Space on button command | Dispatch command and close when configured | Opener unless focus restoration is disabled | Vitest |
| Enter / Space on a checkable command | Update `aria-checked` before dispatching command; remain open when `closeOnSelect` is false | Checkable command | Vitest |
| Enter / Space on link command | Preserve native navigation and dispatch command | Navigation destination owns the result | Vitest and Chromium smoke test |
| Enter / Space on disabled or busy command | Block normal command and optionally announce why | Command remains focused | Vitest and Chromium smoke test |
| Escape | Close the complete menu | Opener | Vitest |
| Tab / Shift+Tab | Close menu and continue around trigger | Next / previous document control | Vitest and Chromium smoke test, including portal mode |
| Outside pointer or focus | Close without stealing focus | Pointer/focus destination | Vitest |

## Interaction state matrix

| State | Visual and DOM state | Keyboard / likely screen-reader information | Lifecycle / cleanup | Evidence |
| --- | --- | --- | --- | --- |
| Closed | Panel `hidden`; trigger `aria-expanded="false"` | Trigger exposes name and popup relationship | Initial and after close | Strong: source + tests |
| Open | Panel visible; root `is-open`; trigger expanded | Focus moves to requested command | `open` event | Strong: source + tests |
| `aria-disabled` | Disabled styling; `aria-disabled="true"` | Remains arrow-key discoverable; normal command blocked | `disabled-command` event | Strong: source + tests |
| `.is-disabled` only | Runtime adds `aria-disabled="true"` | Same behavior as explicit ARIA-disabled state | Original value restored on refresh/destroy | Strong: source + tests |
| Busy / loading | `aria-busy` or `data-command-loading` remains exposed | Remains discoverable; activation can update polite status | No command event | Strong: source + tests |
| Native disabled | Native disabled state | Excluded from roving focus | No activation | Strong: source + tests |
| No focusable commands | Menu can open | Focus remains on trigger | Escape/outside dismissal remains available | Strong: source + tests |
| Submenu open | Submenu visible; parent expanded | Focus enters first submenu command before the completion event | Submenu open/close events; parent close reports submenu close first | Strong: source + tests |
| Portal | Layers move to `document.body`; public theme properties copied inline | Same keyboard model and relationships | Positions/styles restored on destroy | Strong: source + tests + Chromium screenshot |
| Dynamic refresh | Roles, states, items, and relationships recollected | Retained command or safe fallback receives focus | Listeners rebound once; preserved open state does not emit duplicate events | Strong: source + tests |
| Checkable checkbox | Explicit role is preserved; `false`/`true` toggles and `mixed` resolves to `true` | Checked state is likely exposed while focus remains on the command | Adapter destroy preserves host state | Strong: source + tests; manual AT required |
| Checkable radio group | Selecting one radio clears only valid peers in the same explicit `role="group"` | Selected state is likely exposed; arrow navigation does not select | Duplicate initialization adds no duplicate transition | Strong: source + tests; manual AT required |
| Repeated announcement | Status target is cleared and rewritten in a microtask | Expected to request the same polite message again | Pending work is invalidated on teardown | Moderate: source + DOM test; manual AT required |
| Destroyed | Listeners, timers, active state, managed ARIA, portal styles, and moved layers cleaned up | Component returns to host markup | One terminal `destroy` event; later method calls are inert | Strong: source + tests |

## Focus path matrix

| Step | Action | Expected focus |
| --- | --- | --- |
| 1 | Tab through page | Trigger |
| 2 | Open with ArrowDown | First discoverable top-level command, including busy or ARIA-disabled commands |
| 3 | Move with arrows/Home/End/typeahead | Matching command in current menu |
| 4 | Open submenu with directional arrow | First discoverable submenu command |
| 5 | Close submenu with reverse arrow | Parent submenu trigger |
| 6 | Escape | Original opener |
| 7 | Tab / Shift+Tab | Control after / before trigger |
| 8 | Remove focused command and refresh with preservation | Retained command ID, safe sibling, or trigger |
| 9 | Destroy and reinitialize | No stale roving tabindex or duplicate handler |

## Manual browser scenarios

1. Test the basic example in current Chrome, Firefox, and Safari with keyboard only. Cover trigger keys, arrows, Home/End, typeahead, disabled, busy, submenu, Escape, Tab, and Shift+Tab.
2. Repeat with `portal: true`; confirm Tab reaches the support-note textbox, custom styling is preserved, and focus rings are not clipped.
3. At 320 CSS pixels and 200% zoom, open sheet mode and confirm no essential label is truncated, the menu scrolls internally, and focused commands remain visible.
4. Enable reduced motion; confirm menu state changes are immediate, no movement delays interaction, and smooth scrolling is disabled in the demos.
5. Enable forced colors; confirm panel boundaries, active state, disabled state, and focus remain distinguishable.
6. Use a coarse pointer or touch device; confirm commands are comfortable to target and hover is not required.
7. Test RTL content; confirm ArrowLeft opens and ArrowRight closes a submenu.
8. Observe lifecycle events from the component root; confirm state and focus are settled when each completion event arrives, submenu closure precedes parent closure, and no event is cancelable or crosses a shadow boundary.
9. Activate checkbox and radio commands with Enter, Space, and pointer input. Confirm the visible checkmark is not color-only, focus remains on the command when configured, radio groups remain independent, and forced-colors mode preserves each checked indicator.

## Recorded local browser evidence

On 2026-07-25, Google Chrome 150.0.7871.186 on macOS was exercised through
the DevTools protocol against the locally built examples:

- At an exact 320 CSS-pixel viewport, the basic demo reported no document
  horizontal overflow. The status demo also matched its 390-pixel viewport.
- ArrowDown opened the menu and focused the first command; ArrowDown moved
  through commands; ArrowRight entered the submenu; ArrowLeft returned to its
  trigger; Escape closed the menu and restored trigger focus; Tab closed the
  menu and moved focus to the adjacent text input.
- The accessibility tree exposed a named expanded button, a named menu,
  named menu items, `busy` on the loading command, and `disabled` on the
  unavailable command.
- Loading and disabled activation kept the menu open and updated the
  persistent status target with the configured message.
- With `prefers-reduced-motion: reduce`, the menu animation duration computed
  to `0.001ms` and document smooth scrolling computed to `auto`.
- Default panel borders measure 3.12:1 and the status-demo panel border
  measures 3.11:1 against their respective backgrounds. The status-demo
  strong control border measures 3.44:1 against the page background.

These checks are browser evidence, not screen-reader evidence. Firefox,
Safari, VoiceOver, NVDA, TalkBack, forced-colors rendering, touch hardware,
and custom host themes remain manual release checks.

## Manual screen-reader scenarios

- VoiceOver with Safari on macOS: trigger name/expanded state, menu item names, busy/disabled state, submenu entry/exit, link navigation, and repeated polite messages.
- NVDA with Firefox or Chrome on Windows: the same core flow plus Tab exit and dynamic refresh.
- For both desktop combinations, verify checked and unchecked checkbox/radio states before and after activation. Confirm no duplicate live-region announcement competes with the checked-state change.
- TalkBack with Chrome on Android when mobile support is release-critical: sheet navigation, touch exploration, activation, and dismissal.

Record actual spoken output, browser/AT versions, unexpected verbosity, missing announcements, and focus loss. Do not infer a pass from DOM tests alone.

## Visual regression note

No pre-existing screenshot baseline or visual-test script was found. Current
Chrome screenshots were captured as task artifacts for desktop, exact 320px,
and an open 390px mobile menu. Treat these as initial evidence rather than a
cross-browser baseline; add repository baselines only after the remaining
manual browser, forced-colors, and assistive-technology checks are complete.
