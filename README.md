# A11y Command Menu Button

Accessible command menu button behavior for compact application menus.

## Installation

```bash
npm install a11y-command-menu-button
pnpm add a11y-command-menu-button
yarn add a11y-command-menu-button
```

## Usage

```ts
import { createCommandMenuButton } from "a11y-command-menu-button";
import "a11y-command-menu-button/styles.css";

const root = document.querySelector("[data-command-menu]");

if (root instanceof HTMLElement) {
  createCommandMenuButton(root, {
    typeahead: true,
    hoverSubmenus: true
  });
}
```

Use `initCommandMenuButtons()` when a page or fragment contains multiple command menus.

## CSS

Import `a11y-command-menu-button/styles.css` for the default menu, submenu, focus, disabled, and reduced-motion styles.

Public custom properties are scoped to `.a11y-command-menu-button`, including:

- `--a11y-command-menu-bg`
- `--a11y-command-menu-color`
- `--a11y-command-menu-muted-color`
- `--a11y-command-menu-border-color`
- `--a11y-command-menu-item-active-bg`
- `--a11y-command-menu-focus-ring`

### Shortcut labels

The default CSS includes `.a11y-command-menu-button__shortcut` for visible shortcut labels:

```html
<button
  type="button"
  class="a11y-command-menu-button__item"
  data-command-item
  data-command-id="upload-file"
  role="menuitem"
>
  <span class="a11y-command-menu-button__item-label">Upload file</span>
  <span class="a11y-command-menu-button__shortcut" aria-hidden="true">Cmd+U</span>
</button>
```

Shortcut labels are display-only. The plugin does not register global keyboard shortcuts; route global shortcuts in the host app so they can respect editable fields, platform conventions, user settings, and app-level conflict handling.

## HTML structure

Start with semantic HTML. The trigger must be a real button, and command items should be buttons or links with stable `data-command-id` values.

```html
<div class="a11y-command-menu-button" data-command-menu>
  <button
    type="button"
    class="a11y-command-menu-button__trigger"
    data-command-trigger
    aria-haspopup="menu"
    aria-expanded="false"
    aria-controls="command-menu"
    aria-label="Open command menu"
  >
    <span aria-hidden="true">+</span>
  </button>

  <div
    id="command-menu"
    class="a11y-command-menu-button__panel"
    data-command-menu-panel
    role="menu"
    hidden
  >
    <ul class="a11y-command-menu-button__list" role="none">
      <li role="none">
        <button
          type="button"
          class="a11y-command-menu-button__item"
          data-command-item
          data-command-id="upload-file"
          role="menuitem"
        >
          Upload file
        </button>
      </li>
    </ul>
  </div>
</div>
```

Optional root dataset settings are parsed safely before use: `data-close-on-select`, `data-restore-focus`, `data-loop`, `data-placement`, `data-submenu-placement`, `data-hover-submenus`, `data-hover-open-delay`, `data-hover-close-delay`, `data-typeahead`, `data-mobile-mode`, and `data-portal`.

## API

### `createCommandMenuButton(root, options)`

Initializes one command menu root and returns a `CommandMenuButtonInstance`.

### `initCommandMenuButtons(options, root)`

Initializes every `[data-command-menu]` inside a document or fragment.

### Options

```ts
interface CommandMenuButtonAnnouncementContext {
  commandId: string | null;
  item: HTMLElement;
  menu: HTMLElement;
  trigger: HTMLElement;
  originalEvent: Event;
}

interface CommandMenuButtonAnnouncementOptions {
  target: HTMLElement | string;
  formatCommand?: (context: CommandMenuButtonAnnouncementContext) => string | false | null | undefined;
  formatDisabled?: (context: CommandMenuButtonAnnouncementContext) => string | false | null | undefined;
  formatLoading?: (context: CommandMenuButtonAnnouncementContext) => string | false | null | undefined;
}

interface CommandMenuButtonRefreshOptions {
  preserveFocus?: boolean;
}

interface CommandMenuButtonOptions {
  closeOnSelect?: boolean;
  restoreFocus?: boolean;
  loop?: boolean;
  placement?: "auto" | "top" | "bottom";
  submenuPlacement?: "auto" | "left" | "right";
  hoverSubmenus?: boolean;
  hoverOpenDelay?: number;
  hoverCloseDelay?: number;
  typeahead?: boolean;
  mobileMode?: "sheet" | "menu";
  portal?: boolean;
  announce?: false | CommandMenuButtonAnnouncementOptions;
}
```

### Instance methods

- `open({ focus })`
- `close({ restoreFocus })`
- `toggle({ focus })`
- `refresh({ preserveFocus })`
- `destroy()`

`destroy()` is terminal for that instance. It removes listeners and timers, restores
portalled layers, and restores author-owned roles, ARIA attributes, IDs, `hidden`,
`tabindex`, mobile/placement data attributes, and private positioning properties that
the plugin managed.

### Dynamic menu content

Call `instance.refresh()` after the host app adds, removes, disables, loads, or replaces command markup. Refresh re-reads `[data-command-item]` and submenu markup, preserves supported explicit item roles, reapplies default `role="menuitem"`, roving `tabindex`, submenu `aria-controls`/`aria-expanded`, native `disabled`, and loading states.

```ts
const instance = createCommandMenuButton(root);

function renderCommands(commands: Command[]) {
  menuList.replaceChildren(...commands.map(renderCommandButton));
  instance.refresh({ preserveFocus: true });
}
```

Use `preserveFocus: true` when the menu may be open while commands change. If the focused command still exists, focus stays there; if it was removed or became unavailable, focus moves to the next safe command or back to the trigger.

Keep dynamically rendered commands semantic. Use real `<button type="button">` elements for actions and real `<a href="...">` elements for navigation, keep stable `data-command-id` values where possible, and avoid nesting interactive controls inside a command item.

Enabled link commands keep native navigation while dispatching the command event and closing the menu. Enter uses the link's native activation behavior; Space activates a focused link command through the menu pattern. Link activation does not restore focus to the trigger because the navigation destination owns the resulting focus behavior.

Keep `data-command-id` values unique within an instance. The runtime generates IDs for missing values and warns when duplicate values are found because duplicate IDs make focus preservation after `refresh()` ambiguous.

### Checkable commands

Use the separate `a11y-command-menu-button/checkable` helper for small checkbox commands and mutually exclusive radio commands. The host owns the initial state and any persistence; the adapter only updates explicit `aria-checked` markup after an allowed activation.

```html
<button
  type="button"
  class="a11y-command-menu-button__item"
  data-command-item
  data-command-id="comments"
  role="menuitemcheckbox"
  aria-checked="false"
>
  <span class="a11y-command-menu-button__checkmark" aria-hidden="true"></span>
  <span class="a11y-command-menu-button__item-content">Show comments</span>
</button>

<li role="group" aria-label="View mode">
  <button type="button" data-command-item data-command-id="comfortable" role="menuitemradio" aria-checked="true">
    Comfortable
  </button>
  <button type="button" data-command-item data-command-id="compact" role="menuitemradio" aria-checked="false">
    Compact
  </button>
</li>
```

```ts
import { createCheckableCommandAdapter } from "a11y-command-menu-button/checkable";
import { createCommandMenuButton } from "a11y-command-menu-button";

const menu = createCommandMenuButton(root);
const checkable = createCheckableCommandAdapter(root);

root.addEventListener("a11y-command-menu:command", (event) => {
  const { item } = (event as CustomEvent<{ item: HTMLElement }>).detail;

  // The adapter updates aria-checked before this event. Persist or render the
  // host application's state here only when the application requires it.
  saveViewState(item.dataset.commandId, item.getAttribute("aria-checked"));

  // Closing remains an explicit host decision for checkable commands.
  // menu.close();
});
```

Enter, Space, and pointer activation use the existing command flow. Checkbox values toggle between `true` and `false`; `mixed` resolves to `true`. Selecting a radio sets it to `true` and sets valid radio peers in the same explicit `role="group"` to `false`. Activating the selected radio leaves it selected. Arrow navigation remains unchanged.

Disabled and loading commands keep their current state and do not dispatch the normal command event. The adapter retains focus and keeps the menu open for checkable commands even when ordinary commands use `closeOnSelect: true`; call `menu.close()` explicitly when the host workflow requires closure. The existing `command` event observes the updated checked state, and no live-region message is added because checked-state semantics should provide the relevant information without duplicate announcements.

Call both `menu.refresh({ preserveFocus: true })` and `checkable.refresh()` after replacing checkable markup. Invalid or missing `aria-checked` values and radio items without an explicit `role="group"` are left unchanged and produce a developer warning. `checkable.destroy()` removes adapter behavior but preserves the host's roles and checked values; destroying the base menu also cleans up its adapter automatically.

The helper never writes to local storage, cookies, analytics, or a remote service. It is not a preference store. Any persistence is an explicit host responsibility and should follow the host application's privacy policy.

Set `announce` when the host app wants the plugin to write command, disabled-command, or loading status text into a live region. Items can provide `data-command-announcement`, `data-command-disabled-announcement`, or `data-command-loading-announcement`; otherwise the option formatters or default messages are used.

Live-region recipe:

```html
<p id="command-status" role="status" aria-live="polite" aria-atomic="true"></p>
```

```ts
createCommandMenuButton(root, {
  announce: {
    target: "#command-status",
    formatCommand: ({ item }) =>
      item.getAttribute("data-command-announcement") || "Command activated.",
    formatDisabled: ({ item }) =>
      item.getAttribute("data-command-disabled-announcement") ||
      item.getAttribute("data-disabled-reason") ||
      "Command unavailable.",
    formatLoading: ({ item }) =>
      item.getAttribute("data-command-loading-announcement") || "Command is still loading."
  }
});
```

The built-in announcement messages never use `data-command-id`. Keep formatter output short, polite, and free of private filenames, emails, ticket details, or account data. Return `false`, `null`, `undefined`, or an empty string to skip an announcement for a command.

### Lifecycle and action events

Import `COMMAND_MENU_BUTTON_EVENTS` instead of repeating event-name strings. Every event is dispatched from the component root with `bubbles: true`, `composed: false`, and `cancelable: false`. Every detail includes `instance` and `root`.

| Constant | Event | Additional detail | Trigger |
| --- | --- | --- | --- |
| `init` | `a11y-command-menu:init` | None | Successful initialization |
| `open` | `a11y-command-menu:open` | `trigger`, `menu`, `reason` | The menu finishes opening and focus settles |
| `close` | `a11y-command-menu:close` | `trigger`, `menu`, `reason` | The menu finishes closing and focus settles |
| `command` | `a11y-command-menu:command` | `commandId`, `item`, `menu`, `trigger`, `originalEvent` | An enabled command is activated |
| `disabledCommand` | `a11y-command-menu:disabled-command` | Command detail | A disabled command activation is blocked |
| `submenuOpen` | `a11y-command-menu:submenu-open` | `trigger`, `submenu`, `reason` | A submenu finishes opening and focus settles |
| `submenuClose` | `a11y-command-menu:submenu-close` | `trigger`, `submenu`, `reason` | A submenu finishes closing and focus settles |
| `destroy` | `a11y-command-menu:destroy` | None | The instance finishes its one-time cleanup |

```ts
import {
  COMMAND_MENU_BUTTON_EVENTS,
  createCommandMenuButton,
  type CommandMenuButtonEvent
} from "a11y-command-menu-button";

const instance = createCommandMenuButton(root);

root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.open, (event) => {
  const openEvent = event as CommandMenuButtonEvent<
    typeof COMMAND_MENU_BUTTON_EVENTS.open
  >;

  console.log(openEvent.detail.reason);
});
```

Events report completed observations and cannot cancel commands. Closing a menu with an open submenu emits `submenu-close` before `close`; destroying an open instance emits any required close events before one `destroy`. Calls that do not change public state do not emit duplicate state events. Events intentionally do not cross a Shadow DOM boundary; attach listeners inside the same shadow root when the component is hosted there.

Privacy note: `data-command-id` values and command event payloads can reveal user intent when forwarded to analytics or logs. Prefer stable, non-sensitive IDs, avoid sending raw item text or document-specific values, and group or redact command IDs before sending telemetry.

## Keyboard and focus behavior

| Key | Behavior |
| --- | --- |
| Enter / Space / ArrowDown on trigger | Opens the menu and focuses the first keyboard-discoverable command. |
| ArrowUp on trigger | Opens the menu and focuses the last keyboard-discoverable command. |
| ArrowUp / ArrowDown | Moves through commands in the current menu. |
| Home / End | Moves to the first or last command in the current menu. |
| ArrowRight / ArrowLeft | Opens or closes one submenu level, reversed automatically for right-to-left layouts. |
| Enter / Space | Activates the focused command. Enabled links retain native navigation. |
| Escape | Closes the complete menu and restores focus to the opener. |
| Tab / Shift+Tab | Closes the menu and continues to the control after or before the trigger. |

Commands using `aria-disabled="true"`, `.is-disabled`, `aria-busy="true"`, or `data-command-loading` remain discoverable with arrow keys. Disabled and busy commands do not dispatch the normal command event; configure `announce` when the host needs to explain why activation was blocked. Native `disabled` controls are excluded from roving focus. If every command uses native `disabled`, the menu opens but focus remains on the trigger.

Outside pointer or focus movement closes the menu without moving focus back to the trigger. Portal mode preserves the same focus order and copies the component's public CSS custom properties to the moved layers; `destroy()` restores their original DOM positions and inline custom-property values.

## Accessibility notes

- Uses `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` on the trigger.
- Requires a usable trigger name from meaningful button text, `aria-label`, or `aria-labelledby`; icon-only symbols such as `+` should be hidden from assistive technology and paired with a real name.
- Sets `role="menu"` and `role="menuitem"` for application-style command menus.
- Preserves explicit `menuitemcheckbox` and `menuitemradio` roles for the optional checkable adapter.
- Keeps disabled menu items keyboard-discoverable when they use `aria-disabled="true"`.
- Keeps busy menu items keyboard-discoverable while blocking duplicate activation.
- Supports Arrow keys, Home, End, Enter, Space, Escape, optional typeahead, and one level of submenus.
- Restores focus to the opener when the menu closes unless disabled by option.
- Lets Tab and Shift+Tab close the menu and continue around the trigger, including in portal mode.
- Keeps command status announcements opt-in and polite by default through a host-provided live region.
- Respects `prefers-reduced-motion` in the default CSS.
- Allows long command labels to wrap instead of truncating essential text.
- Avoid nested interactive elements inside menu items.

## Limitations

| Topic | Supported pattern | What to avoid |
| --- | --- | --- |
| Submenu depth | One submenu level opened from a top-level command. | Nested submenus inside submenus. The runtime logs a warning when nested `data-command-submenu` elements are detected. |
| Shortcut handling | Visual shortcut labels with `.a11y-command-menu-button__shortcut`. | Expecting the plugin to register global shortcuts. The host app should own shortcut routing. |
| Checkable commands | Explicit valid `aria-checked` markup; radios inside a named `role="group"`; host-controlled closure and persistence. | Inferring radio groups, silently repairing invalid checked state, or treating the helper as a preference store. |
| Event telemetry | Bubbling events for app reactions and local UI updates. | Forwarding raw command IDs, labels, or event payloads to analytics without privacy review. |
| Empty/unavailable menu | If no command can receive roving focus because every item is natively disabled, the menu opens and focus remains on the trigger. | Moving focus into a native-disabled control. |
| Portal styling | Public `--a11y-command-menu-*` values are copied from the root to portalled layers and restored on destroy. | Depending on unrelated inherited styles from `document.body`. |

## Examples

- [`examples/basic`](examples/basic): support-note command menu with disabled, loading, submenu, mobile sheet, portal, and keyboard walkthrough demo states.
- [`examples/status-announcements`](examples/status-announcements): live-region formatter recipe with command, disabled, and loading announcements.
- [`ACCESSIBILITY_TESTING.md`](ACCESSIBILITY_TESTING.md): manual browser, keyboard, screen reader, zoom, forced-colors, touch, and reduced-motion scenarios.
- [`WCAG_EVIDENCE.md`](WCAG_EVIDENCE.md): cautious implementation and test evidence mapped to likely WCAG criteria.

## Docs metadata

```ts
import { docs } from "a11y-command-menu-button/docs";
```
