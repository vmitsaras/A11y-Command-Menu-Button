# A11y Command Menu Button Basic Demo

Interactive command menu demo for a support-note composer. The page includes a state playground for disabled, loading, submenu, mobile sheet, and portal modes, plus a keyboard walkthrough panel.

## What this example shows

- A real command menu button initialized from `../../dist/index.js`.
- Default package CSS imported from `../../dist/styles.css`.
- Disabled command behavior with `aria-disabled="true"`.
- Loading command behavior with `aria-busy="true"` and `data-command-loading`.
- One-level submenu behavior with ArrowRight and ArrowLeft.
- Mobile sheet and portal options through demo-only controls.
- The `announce` option writing activated, unavailable, and loading messages to a polite status region.

## How to run

Build the package first:

```bash
npm run build
```

Then open or serve `examples/basic/index.html`.

## What to try

- Open the menu with Enter, Space, ArrowDown, or the pointer.
- Move through commands with ArrowUp, ArrowDown, Home, End, or typeahead.
- Open the Templates submenu with ArrowRight and close it with ArrowLeft or Escape.
- Use Tab or Shift+Tab to close the menu and continue after or before the trigger.
- Activate Open usage notes with Enter or Space and confirm native link navigation reaches the Usage section.
- Toggle Disabled command, Loading command, Disabled submenu, Mobile sheet mode, and Portal mode.
- Start the keyboard walkthrough and confirm the active step updates as focus moves.

## Accessibility notes

- The trigger is a real button with a usable accessible name.
- Menu items are real buttons or links and are enhanced with `role="menuitem"`.
- Disabled items use `aria-disabled="true"` so they remain discoverable in arrow-key navigation.
- Busy items use `aria-busy="true"` and `data-command-loading`; they remain arrow-key discoverable while activation is ignored.
- Native-disabled controls are excluded. If all commands are natively disabled, focus remains on the trigger.
- Portal mode preserves Tab order and copies the component's public CSS custom properties to the moved layers.
- Long command labels wrap instead of truncating essential text.
- Status text uses the opt-in `announce` option with a polite live region for activated, unavailable, and loading command messages.
- The demo documents expected behavior but does not replace assistive technology testing in a final product.

## Files

- `index.html`
- `README.md`
