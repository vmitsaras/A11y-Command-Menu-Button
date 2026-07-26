# Status Announcement Formatter

Shows the opt-in `announce` option for activated, unavailable, and loading command states.

## What this example shows

- A persistent polite status target for command menu announcements.
- Default-safe command markup with curated announcement strings.
- Custom `formatCommand`, `formatDisabled`, and `formatLoading` callbacks.
- Disabled and loading states that do not move focus or close the menu.
- Keyboard-discoverable disabled and loading items that can explain blocked activation.

## How to run

Build the package first:

```bash
npm run build
```

Then open or serve `examples/status-announcements/index.html`.

## What to try

- Open the Actions menu and choose Assign to me.
- Activate Request legal review to announce a disabled reason.
- Activate Generate summary to announce the loading state.
- Repeat the flow with Arrow keys, Home, End, Enter, Space, Escape, and typeahead.

## Accessibility notes

- The target is a persistent `role="status"` region with `aria-live="polite"` and `aria-atomic="true"`.
- The plugin does not move focus to force an announcement.
- Formatter copy avoids raw command IDs and customer-specific data.
- Automated tests can verify target text updates, but real screen reader output needs manual checks.
- Keep live-region messages short so they do not compete with menu item focus announcements.
- Repeating the same blocked action clears and rewrites the target so the host can request the message again; confirm actual speech with target browser and assistive-technology pairs.

## Code snippet

```js
createCommandMenuButton(root, {
  announce: {
    target: status,
    formatCommand: ({ item }) =>
      item.getAttribute("data-command-announcement") || "Command activated.",
    formatDisabled: ({ item }) =>
      item.getAttribute("data-command-disabled-announcement") || "Command unavailable.",
    formatLoading: ({ item }) =>
      item.getAttribute("data-command-loading-announcement") || "Command is still loading."
  }
});
```

## Files

- `index.html`
- `styles.css`
