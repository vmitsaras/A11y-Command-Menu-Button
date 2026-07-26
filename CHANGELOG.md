# Changelog

This package uses Changesets for release notes.

## 1.0.0 - 2026-07-26

- Add a separate checkable-command adapter for host-owned `menuitemcheckbox` and explicitly grouped `menuitemradio` state.
- Export typed lifecycle event constants, detail maps, and event types; make completion ordering, submenu closure, refresh behavior, and one-time destruction deterministic.
- Preserve native navigation for link commands while dispatching command events.
- Keep ARIA-disabled and busy commands keyboard discoverable while blocking activation.
- Add deterministic Tab/Shift+Tab exit, RTL submenu coverage, repeated status announcements, and duplicate command ID warnings.
- Preserve component theming when menu layers use portal mode.
- Allow long command labels to wrap and use dynamic viewport sizing in sheet mode.
- Allow a root with initially incomplete markup to initialize cleanly after required markup is added.
- Restore author-owned roles, ARIA, IDs, hidden state, tabindex, and private positioning state on destroy.
- Restore stale portalled submenu placement and copied theme properties during dynamic refresh.
- Strengthen default panel and status-demo control borders to meet the 3:1 non-text contrast target in their default themes.
