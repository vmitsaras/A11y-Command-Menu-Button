import { COMMAND_MENU_BUTTON_EVENTS } from "./index";

export interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repo?: string;
  npm?: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: string;
  selectors?: string[];
  keyboard?: Array<{
    key: string;
    description: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  events?: Array<{
    name: string;
    detail: string;
    description: string;
    bubbles: boolean;
    composed: boolean;
    cancelable: boolean;
  }>;
  examples?: Array<{
    name: string;
    description: string;
    path: string;
  }>;
}

export const docs = {
  slug: "a11y-command-menu-button",
  name: "A11y Command Menu Button",
  packageName: "a11y-command-menu-button",
  description: "Accessible command menu button behavior for compact application menus.",
  repo: "https://github.com/vmitsaras/a11y-command-menu-button",
  npm: "https://www.npmjs.com/package/a11y-command-menu-button",
  install: {
    npm: "npm install a11y-command-menu-button",
    pnpm: "pnpm add a11y-command-menu-button",
    yarn: "yarn add a11y-command-menu-button"
  },
  usage: `import { createCommandMenuButton } from "a11y-command-menu-button";
import "a11y-command-menu-button/styles.css";

const root = document.querySelector("[data-command-menu]");

if (root instanceof HTMLElement) {
  createCommandMenuButton(root, {
    typeahead: true
  });
}`,
  selectors: [
    "[data-command-menu]",
    "[data-command-trigger]",
    "[data-command-menu-panel]",
    "[data-command-item]",
    "[data-command-submenu-trigger]",
    "[data-command-submenu]"
  ],
  keyboard: [
    {
      key: "Enter / Space / ArrowDown",
      description: "Opens the menu from the trigger and moves focus to the first command."
    },
    {
      key: "ArrowUp",
      description: "Opens the menu from the trigger and moves focus to the last command."
    },
    {
      key: "ArrowUp / ArrowDown",
      description:
        "Moves focus between keyboard-discoverable menu items, including ARIA-disabled and busy commands."
    },
    {
      key: "Home / End",
      description:
        "Moves focus to the first or last keyboard-discoverable item in the current menu."
    },
    {
      key: "ArrowRight / ArrowLeft",
      description: "Opens or closes one-level submenus, adjusted for text direction."
    },
    {
      key: "Enter / Space",
      description:
        "Activates the focused command; enabled links retain native navigation and the optional checkable adapter updates explicit checked state."
    },
    {
      key: "Escape",
      description: "Closes the menu and restores focus to the trigger."
    },
    {
      key: "Tab / Shift+Tab",
      description: "Closes the menu and continues to the control after or before the trigger."
    }
  ],
  api: [
    {
      name: "createCommandMenuButton(root, options)",
      type: "(root: HTMLElement, options?: CommandMenuButtonOptions) => CommandMenuButtonInstance",
      description: "Initializes command menu behavior on one root element."
    },
    {
      name: "initCommandMenuButtons(options, root)",
      type: "(options?: CommandMenuButtonOptions, root?: ParentNode) => CommandMenuButtonInstance[]",
      description: "Initializes every command menu root inside a document or fragment."
    },
    {
      name: "open(options)",
      type: "(options?: { focus?: 'first' | 'last' | false }) => void",
      description: "Opens the menu and optionally moves focus."
    },
    {
      name: "close(options)",
      type: "(options?: { restoreFocus?: boolean }) => void",
      description: "Closes the menu and optionally restores focus to the opener."
    },
    {
      name: "toggle(options)",
      type: "(options?: { focus?: 'first' | 'last' | false }) => void",
      description: "Toggles the menu and optionally controls focus when opening."
    },
    {
      name: "refresh(options)",
      type: "(options?: { preserveFocus?: boolean }) => void",
      description:
        "Re-reads dynamic menu items and submenus, reapplies ARIA and roving focus, and optionally preserves focus."
    },
    {
      name: "createCheckableCommandAdapter(root)",
      type: "(root: HTMLElement) => CheckableCommandAdapter",
      description:
        "Adds host-owned menuitemcheckbox and explicitly grouped menuitemradio state transitions from the separate package/checkable entry point."
    },
    {
      name: "announce option",
      type: "false | { target: HTMLElement | string; formatCommand?; formatDisabled?; formatLoading? }",
      description:
        "Configures opt-in polite command, disabled-command, and loading announcements in a host-provided live region."
    },
    {
      name: "disabled and busy commands",
      type: "disabled | aria-disabled | aria-busy | data-command-loading",
      description:
        "Native-disabled controls are excluded; aria-disabled and busy commands remain arrow-key discoverable while activation is blocked."
    },
    {
      name: "destroy()",
      type: "() => void",
      description:
        "Removes listeners, timers, state classes, roving focus, moved layers, and plugin-managed attributes while restoring author markup."
    }
  ],
  events: [
    {
      name: COMMAND_MENU_BUTTON_EVENTS.init,
      detail: "{ instance, root }",
      description: "Initialization completed.",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: COMMAND_MENU_BUTTON_EVENTS.open,
      detail: "{ instance, root, trigger, menu, reason }",
      description: "The menu opened and requested focus settled.",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: COMMAND_MENU_BUTTON_EVENTS.close,
      detail: "{ instance, root, trigger, menu, reason }",
      description: "The menu closed and requested focus restoration settled.",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: COMMAND_MENU_BUTTON_EVENTS.command,
      detail: "{ instance, root, commandId, item, menu, trigger, originalEvent }",
      description: "An enabled command was activated.",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: COMMAND_MENU_BUTTON_EVENTS.disabledCommand,
      detail: "{ instance, root, commandId, item, menu, trigger, originalEvent }",
      description: "A disabled command activation was blocked.",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: COMMAND_MENU_BUTTON_EVENTS.submenuOpen,
      detail: "{ instance, root, trigger, submenu, reason }",
      description: "A submenu opened and requested focus settled.",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: COMMAND_MENU_BUTTON_EVENTS.submenuClose,
      detail: "{ instance, root, trigger, submenu, reason }",
      description: "A submenu closed and requested focus restoration settled.",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: COMMAND_MENU_BUTTON_EVENTS.destroy,
      detail: "{ instance, root }",
      description: "The instance completed its one-time cleanup.",
      bubbles: true,
      composed: false,
      cancelable: false
    }
  ],
  examples: [
    {
      name: "Basic",
      description:
        "A support-note command menu with disabled, loading, submenu, mobile sheet, portal, and keyboard walkthrough demo states.",
      path: "examples/basic"
    },
    {
      name: "Status Announcements",
      description: "A live-region formatter recipe with command, disabled, and loading announcement examples.",
      path: "examples/status-announcements"
    }
  ]
} satisfies PluginDocs;
