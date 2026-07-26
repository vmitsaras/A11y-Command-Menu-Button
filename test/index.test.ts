import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  A11yCommandMenuButton,
  COMMAND_MENU_BUTTON_EVENTS,
  createCommandMenuButton,
  initCommandMenuButtons,
  type CommandMenuButtonCommandEventDetail,
  type CommandMenuButtonEvent,
  type CommandMenuButtonEventDetailMap
} from "../src/index";

type CommandMenuEventDetail = CommandMenuButtonCommandEventDetail;

function createFixture(): HTMLElement {
  document.body.innerHTML = `
    <div class="a11y-command-menu-button" data-command-menu data-typeahead="true">
      <button
        id="command-trigger"
        type="button"
        class="a11y-command-menu-button__trigger"
        data-command-trigger
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="command-menu"
      >
        Open
      </button>
      <div
        id="command-menu"
        class="a11y-command-menu-button__panel"
        data-command-menu-panel
        role="menu"
        aria-labelledby="command-trigger"
        hidden
      >
        <ul class="a11y-command-menu-button__list" role="none">
          <li role="none">
            <button
              type="button"
              class="a11y-command-menu-button__item"
              data-command-item
              data-command-id="alpha"
              role="menuitem"
            >
              Alpha
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              class="a11y-command-menu-button__item"
              data-command-item
              id="submenu-trigger"
              data-command-submenu-trigger
              data-command-id="more"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-controls="submenu"
            >
              More
            </button>
            <div
              id="submenu"
              class="a11y-command-menu-button__submenu"
              data-command-submenu
              role="menu"
              hidden
            >
              <ul role="none">
                <li role="none">
                  <button
                    type="button"
                    class="a11y-command-menu-button__item"
                    data-command-item
                    data-command-id="nested"
                    role="menuitem"
                  >
                    Nested
                  </button>
                </li>
              </ul>
            </div>
          </li>
          <li role="none">
            <button
              type="button"
              class="a11y-command-menu-button__item"
              data-command-item
              data-command-id="disabled"
              role="menuitem"
              aria-disabled="true"
            >
              Disabled
            </button>
          </li>
        </ul>
      </div>
      <p id="command-status" data-command-status></p>
    </div>
  `;

  const root = document.querySelector("[data-command-menu]");

  if (!(root instanceof HTMLElement)) {
    throw new Error("Fixture root was not created.");
  }

  return root;
}

function getTrigger(root: HTMLElement): HTMLButtonElement {
  const trigger = root.querySelector("[data-command-trigger]");

  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error("Missing trigger.");
  }

  return trigger;
}

function getMenu(root: HTMLElement): HTMLElement {
  const menu = root.querySelector("[data-command-menu-panel]");

  if (!(menu instanceof HTMLElement)) {
    throw new Error("Missing menu.");
  }

  return menu;
}

function getStatus(root: HTMLElement): HTMLElement {
  const status = root.querySelector("[data-command-status]");

  if (!(status instanceof HTMLElement)) {
    throw new Error("Missing status target.");
  }

  return status;
}

function getItems(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-command-item]"));
}

function keydown(target: Element, key: string, options: { shiftKey?: boolean } = {}): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    shiftKey: options.shiftKey
  });
  target.dispatchEvent(event);
  return event;
}

function pointer(target: Element, type: "pointerover" | "pointerout", relatedTarget: EventTarget | null = null): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, relatedTarget });
  Object.defineProperty(event, "pointerType", { value: "mouse" });
  target.dispatchEvent(event);
}

beforeEach(() => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("A11yCommandMenuButton", () => {
  it("exports plugin-specific creation helpers", () => {
    expect(A11yCommandMenuButton).toBeTypeOf("function");
    expect(createCommandMenuButton).toBeTypeOf("function");
    expect(initCommandMenuButtons).toBeTypeOf("function");
  });

  it("exports a frozen, namespaced lifecycle event registry", () => {
    expect(Object.isFrozen(COMMAND_MENU_BUTTON_EVENTS)).toBe(true);
    expect(COMMAND_MENU_BUTTON_EVENTS).toEqual({
      init: "a11y-command-menu:init",
      open: "a11y-command-menu:open",
      close: "a11y-command-menu:close",
      command: "a11y-command-menu:command",
      disabledCommand: "a11y-command-menu:disabled-command",
      submenuOpen: "a11y-command-menu:submenu-open",
      submenuClose: "a11y-command-menu:submenu-close",
      destroy: "a11y-command-menu:destroy"
    });
  });

  it("initializes menu semantics and dispatches a bubbling init event", () => {
    const root = createFixture();
    const initListener = vi.fn();
    document.body.addEventListener("a11y-command-menu:init", initListener);

    const instance = createCommandMenuButton(root);
    const trigger = getTrigger(root);
    const menu = getMenu(root);

    expect(instance).toBeInstanceOf(A11yCommandMenuButton);
    expect(instance.refresh).toBeTypeOf("function");
    expect(root.classList.contains("is-initialized")).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menu.hidden).toBe(true);
    expect(initListener).toHaveBeenCalledOnce();
    const initEvent = initListener.mock.calls[0]?.[0] as CommandMenuButtonEvent<
      typeof COMMAND_MENU_BUTTON_EVENTS.init
    >;
    const typedDetail: CommandMenuButtonEventDetailMap[typeof COMMAND_MENU_BUTTON_EVENTS.init] =
      initEvent.detail;

    expect(typedDetail.instance).toBe(instance);
    expect(typedDetail.root).toBe(root);
    expect(initEvent.target).toBe(root);
    expect(initEvent.bubbles).toBe(true);
    expect(initEvent.composed).toBe(false);
    expect(initEvent.cancelable).toBe(false);
  });

  it("reports opening after focus settles with typed state detail", () => {
    const root = createFixture();
    const firstItem = getItems(root)[0];
    const openEvents: Array<CommandMenuButtonEvent<typeof COMMAND_MENU_BUTTON_EVENTS.open>> = [];
    let focusedWhenReported: Element | null = null;

    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.open, (event) => {
      openEvents.push(event as CommandMenuButtonEvent<typeof COMMAND_MENU_BUTTON_EVENTS.open>);
      focusedWhenReported = document.activeElement;
    });

    const instance = createCommandMenuButton(root);
    getTrigger(root).click();
    const openEvent = openEvents[0];

    expect(openEvent).toBeDefined();
    expect(focusedWhenReported).toBe(firstItem);
    expect(openEvent?.detail).toMatchObject({
      instance,
      root,
      trigger: getTrigger(root),
      menu: getMenu(root),
      reason: "trigger"
    });
    expect(openEvent?.bubbles).toBe(true);
    expect(openEvent?.composed).toBe(false);
    expect(openEvent?.cancelable).toBe(false);
  });

  it("reuses the same instance for duplicate initialization", () => {
    const root = createFixture();
    const first = createCommandMenuButton(root);
    const second = createCommandMenuButton(root);

    expect(second).toBe(first);
  });

  it("allows clean initialization after required markup is added", () => {
    document.body.innerHTML = '<div data-command-menu></div>';
    const root = document.querySelector<HTMLElement>("[data-command-menu]");

    if (!root) {
      throw new Error("Missing incomplete fixture.");
    }

    const incompleteInstance = createCommandMenuButton(root);
    root.innerHTML = `
      <button type="button" data-command-trigger>Commands</button>
      <div data-command-menu-panel>
        <button type="button" data-command-item>Alpha</button>
      </div>
    `;
    const initializedInstance = createCommandMenuButton(root);
    const trigger = root.querySelector<HTMLElement>("[data-command-trigger]");
    const item = root.querySelector<HTMLElement>("[data-command-item]");

    expect(initializedInstance).not.toBe(incompleteInstance);
    expect(root.classList.contains("is-initialized")).toBe(true);

    trigger?.click();

    expect(document.activeElement).toBe(item);
  });

  it("keeps status announcements disabled by default", () => {
    const root = createFixture();
    const status = getStatus(root);

    createCommandMenuButton(root);
    getTrigger(root).click();
    getItems(root)[0]?.click();

    expect(status.textContent).toBe("");
    expect(status.hasAttribute("role")).toBe(false);
    expect(status.hasAttribute("aria-live")).toBe(false);
  });

  it("announces command activation through the configured polite target", () => {
    const root = createFixture();
    const status = getStatus(root);
    const firstItem = getItems(root)[0];

    firstItem?.setAttribute("data-command-announcement", "Alpha command confirmed.");
    createCommandMenuButton(root, {
      announce: {
        target: "#command-status"
      }
    });

    getTrigger(root).click();
    firstItem?.click();

    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("aria-atomic")).toBe("true");
    expect(status.textContent).toBe("Alpha command confirmed.");
  });

  it("describes the default command outcome as activation", () => {
    const root = createFixture();
    const status = getStatus(root);

    createCommandMenuButton(root, {
      announce: {
        target: status
      }
    });

    getTrigger(root).click();
    getItems(root)[0]?.click();

    expect(status.textContent).toBe("Command activated.");
  });

  it("announces disabled command activation without closing the menu", () => {
    const root = createFixture();
    const status = getStatus(root);
    const disabledItem = root.querySelector("[data-command-id='disabled']");

    if (!(disabledItem instanceof HTMLElement)) {
      throw new Error("Missing disabled item.");
    }

    disabledItem.setAttribute("data-disabled-reason", "Choose a workspace before using this command.");
    createCommandMenuButton(root, {
      announce: {
        target: status
      }
    });

    getTrigger(root).click();
    disabledItem.click();

    expect(status.textContent).toBe("Choose a workspace before using this command.");
    expect(getMenu(root).hidden).toBe(false);
  });

  it("announces loading command activation and does not dispatch a command event", () => {
    const root = createFixture();
    const status = getStatus(root);
    const commandListener = vi.fn();
    const firstItem = getItems(root)[0];

    firstItem?.setAttribute("data-command-loading", "");
    firstItem?.setAttribute("data-command-loading-announcement", "Alpha command is still preparing.");
    root.addEventListener("a11y-command-menu:command", commandListener);
    createCommandMenuButton(root, {
      announce: {
        target: status
      }
    });

    getTrigger(root).click();
    firstItem?.click();

    expect(commandListener).not.toHaveBeenCalled();
    expect(status.textContent).toBe("Alpha command is still preparing.");
    expect(getMenu(root).hidden).toBe(false);
  });

  it("keeps loading commands keyboard discoverable and announces blocked activation", () => {
    const root = createFixture();
    const status = getStatus(root);
    const firstItem = getItems(root)[0];

    firstItem?.setAttribute("aria-busy", "true");
    firstItem?.setAttribute("data-command-loading-announcement", "Alpha is still preparing.");
    createCommandMenuButton(root, { announce: { target: status } });

    getTrigger(root).click();

    expect(document.activeElement).toBe(firstItem);
    expect(firstItem?.tabIndex).toBe(0);

    if (firstItem) {
      keydown(firstItem, "Enter");
    }

    expect(status.textContent).toBe("Alpha is still preparing.");
    expect(getMenu(root).hidden).toBe(false);
  });

  it("uses custom status announcement formatters", () => {
    const root = createFixture();
    const status = getStatus(root);

    createCommandMenuButton(root, {
      announce: {
        target: status,
        formatCommand: ({ item }) => {
          const label = item.textContent?.trim();
          return label ? `${label} queued.` : "Custom command queued.";
        }
      }
    });

    getTrigger(root).click();
    getItems(root)[0]?.click();

    expect(status.textContent).toBe("Alpha queued.");
  });

  it("restores managed status target attributes and text on destroy", () => {
    const root = createFixture();
    const status = getStatus(root);
    const firstItem = getItems(root)[0];

    status.textContent = "Ready.";
    firstItem?.setAttribute("data-command-announcement", "Alpha command confirmed.");
    const instance = createCommandMenuButton(root, {
      announce: {
        target: status
      }
    });

    getTrigger(root).click();
    firstItem?.click();
    expect(status.textContent).toBe("Alpha command confirmed.");

    instance.destroy();

    expect(status.textContent).toBe("Ready.");
    expect(status.hasAttribute("role")).toBe(false);
    expect(status.hasAttribute("aria-live")).toBe(false);
    expect(status.hasAttribute("aria-atomic")).toBe(false);
  });

  it("does not duplicate announcements after duplicate initialization", () => {
    const root = createFixture();
    const status = getStatus(root);
    const formatCommand = vi.fn(() => "Alpha selected once.");
    const options = {
      announce: {
        target: status,
        formatCommand
      }
    };

    const first = createCommandMenuButton(root, options);
    const second = createCommandMenuButton(root, options);

    getTrigger(root).click();
    getItems(root)[0]?.click();

    expect(second).toBe(first);
    expect(formatCommand).toHaveBeenCalledOnce();
    expect(status.textContent).toBe("Alpha selected once.");
  });

  it("re-announces the same status message on repeated activation", async () => {
    const root = createFixture();
    const status = getStatus(root);
    const disabledItem = root.querySelector<HTMLElement>("[data-command-id='disabled']");

    createCommandMenuButton(root, { announce: { target: status } });
    getTrigger(root).click();
    disabledItem?.click();
    expect(status.textContent).toBe("Command unavailable.");

    disabledItem?.click();
    expect(status.textContent).toBe("");

    await Promise.resolve();
    expect(status.textContent).toBe("Command unavailable.");
  });

  it("contains announcement formatter failures without throwing", () => {
    const root = createFixture();
    const status = getStatus(root);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    createCommandMenuButton(root, {
      announce: {
        target: status,
        formatCommand: () => {
          throw new Error("Formatter failed");
        }
      }
    });

    getTrigger(root).click();
    getItems(root)[0]?.click();

    expect(warn).toHaveBeenCalledWith(
      "[A11yCommandMenuButton] Announcement formatter failed.",
      expect.any(Error)
    );
    expect(status.textContent).toBe("");
  });

  it("warns when an icon-only trigger has no usable accessible name", () => {
    const root = createFixture();
    const trigger = getTrigger(root);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    trigger.innerHTML = '<span aria-hidden="true">+</span>';
    trigger.removeAttribute("aria-label");
    trigger.removeAttribute("aria-labelledby");

    createCommandMenuButton(root);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Trigger needs a usable accessible name"));
  });

  it("accepts aria-label and aria-labelledby as trigger names", () => {
    const firstRoot = createFixture();
    const firstTrigger = getTrigger(firstRoot);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    firstTrigger.innerHTML = '<span aria-hidden="true">+</span>';
    firstTrigger.setAttribute("aria-label", "Open command menu");
    createCommandMenuButton(firstRoot);

    document.body.innerHTML = `
      <span id="trigger-label">Open command menu</span>
      <div class="a11y-command-menu-button" data-command-menu>
        <button
          id="labelled-trigger"
          type="button"
          data-command-trigger
          aria-labelledby="trigger-label"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="labelled-menu"
        >
          <span aria-hidden="true">+</span>
        </button>
        <div id="labelled-menu" data-command-menu-panel role="menu" hidden>
          <button type="button" data-command-item data-command-id="alpha" role="menuitem">Alpha</button>
        </div>
      </div>
    `;

    const secondRoot = document.querySelector("[data-command-menu]");

    if (!(secondRoot instanceof HTMLElement)) {
      throw new Error("Missing labelled trigger fixture.");
    }

    createCommandMenuButton(secondRoot);

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("Trigger needs a usable accessible name"));
  });

  it("opens from the trigger, moves focus, and closes with Escape", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const trigger = getTrigger(root);
    const menu = getMenu(root);
    const firstItem = getItems(root)[0];

    trigger.focus();
    keydown(trigger, "ArrowDown");

    expect(menu.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(firstItem);
    expect(firstItem?.classList.contains("is-active")).toBe(true);

    keydown(firstItem, "Escape");

    expect(menu.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);

    instance.destroy();
  });

  it("moves focus past the trigger when Tab or Shift+Tab exits the menu", () => {
    const root = createFixture();
    root.insertAdjacentHTML("beforebegin", '<button id="before-menu" type="button">Before</button>');
    root.insertAdjacentHTML("afterend", '<button id="after-menu" type="button">After</button>');
    createCommandMenuButton(root);
    const trigger = getTrigger(root);
    const firstItem = getItems(root)[0];
    const before = document.querySelector("#before-menu");
    const after = document.querySelector("#after-menu");

    if (!(firstItem instanceof HTMLElement) || !(before instanceof HTMLElement) || !(after instanceof HTMLElement)) {
      throw new Error("Missing Tab exit fixture.");
    }

    trigger.click();
    const tabEvent = keydown(firstItem, "Tab");

    expect(tabEvent.defaultPrevented).toBe(true);
    expect(getMenu(root).hidden).toBe(true);
    expect(document.activeElement).toBe(after);

    keydown(trigger, "ArrowDown");
    const shiftTabEvent = keydown(firstItem, "Tab", { shiftKey: true });

    expect(shiftTabEvent.defaultPrevented).toBe(true);
    expect(getMenu(root).hidden).toBe(true);
    expect(document.activeElement).toBe(before);
  });

  it("keeps focus on the trigger when a menu has no keyboard-focusable commands", () => {
    const root = createFixture();
    getItems(root).forEach((item) => item.setAttribute("disabled", ""));
    createCommandMenuButton(root);
    const trigger = getTrigger(root);

    trigger.focus();
    keydown(trigger, "ArrowDown");

    expect(getMenu(root).hidden).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(getItems(root).every((item) => !item.hasAttribute("tabindex"))).toBe(true);
  });

  it("marks layers with the configured mobile mode for responsive styling", () => {
    const root = createFixture();
    createCommandMenuButton(root, {
      mobileMode: "menu"
    });
    const menu = getMenu(root);
    const submenu = root.querySelector("#submenu");

    if (!(submenu instanceof HTMLElement)) {
      throw new Error("Missing submenu fixture.");
    }

    expect(root.getAttribute("data-command-mobile-mode")).toBe("menu");
    expect(menu.getAttribute("data-command-mobile-mode")).toBe("menu");
    expect(submenu.getAttribute("data-command-mobile-mode")).toBe("menu");
  });

  it("parses dataset options safely and lets JavaScript options override them", () => {
    const root = createFixture();
    root.dataset.closeOnSelect = "false";
    root.dataset.loop = "false";
    root.dataset.mobileMode = "menu";
    const instance = createCommandMenuButton(root, {
      mobileMode: "sheet"
    });
    const firstItem = getItems(root)[0];

    getTrigger(root).click();
    keydown(firstItem, "ArrowUp");

    expect(document.activeElement).toBe(firstItem);
    expect(root.getAttribute("data-command-mobile-mode")).toBe("sheet");

    firstItem?.click();

    expect(getMenu(root).hidden).toBe(false);
    instance.destroy();

    const invalidRoot = createFixture();
    invalidRoot.dataset.closeOnSelect = "not-a-boolean";
    createCommandMenuButton(invalidRoot);
    getTrigger(invalidRoot).click();
    getItems(invalidRoot)[0]?.click();

    expect(getMenu(invalidRoot).hidden).toBe(true);
  });

  it("cycles typeahead through commands that start with the same character", () => {
    const root = createFixture();
    const list = getMenu(root).querySelector("ul");

    if (!(list instanceof HTMLElement)) {
      throw new Error("Missing command list.");
    }

    list.insertAdjacentHTML(
      "beforeend",
      `
        <li>
          <button type="button" data-command-item data-command-id="archive">
            Archive
          </button>
        </li>
      `
    );

    createCommandMenuButton(root, {
      typeahead: true
    });

    getTrigger(root).click();
    const alpha = root.querySelector("[data-command-id='alpha']");
    const archive = root.querySelector("[data-command-id='archive']");

    if (!(alpha instanceof HTMLElement) || !(archive instanceof HTMLElement)) {
      throw new Error("Missing typeahead fixture.");
    }

    keydown(alpha, "a");
    expect(document.activeElement).toBe(archive);

    keydown(archive, "a");
    expect(document.activeElement).toBe(alpha);
  });

  it("dispatches command events and closes on selection", () => {
    const root = createFixture();
    createCommandMenuButton(root);
    const commandListener = vi.fn();
    root.addEventListener("a11y-command-menu:command", commandListener);

    getTrigger(root).click();
    getItems(root)[0]?.click();

    expect(commandListener).toHaveBeenCalledOnce();
    const event = commandListener.mock.calls[0]?.[0] as CustomEvent<CommandMenuEventDetail>;
    expect(event.detail.commandId).toBe("alpha");
    expect(event.detail.instance).toBeInstanceOf(A11yCommandMenuButton);
    expect(getMenu(root).hidden).toBe(true);
  });

  it("preserves native anchor activation for pointer, Enter, and Space", () => {
    const root = createFixture();
    const list = getMenu(root).querySelector("ul");

    if (!(list instanceof HTMLElement)) {
      throw new Error("Missing command list.");
    }

    list.insertAdjacentHTML(
      "beforeend",
      '<li><a href="#destination" data-command-item data-command-id="destination">Destination</a></li>'
    );
    createCommandMenuButton(root);
    const link = root.querySelector("[data-command-id='destination']");
    const commandListener = vi.fn();
    root.addEventListener("a11y-command-menu:command", commandListener);

    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error("Missing link command.");
    }

    let clickDefaultPrevented = true;
    root.addEventListener("click", (event) => {
      if (event.target === link) {
        clickDefaultPrevented = event.defaultPrevented;
      }
    });

    getTrigger(root).click();
    link.click();

    expect(clickDefaultPrevented).toBe(false);
    expect(commandListener).toHaveBeenCalledOnce();
    expect(getMenu(root).hidden).toBe(true);

    keydown(getTrigger(root), "ArrowDown");
    link.focus();
    const enterEvent = keydown(link, "Enter");
    expect(enterEvent.defaultPrevented).toBe(false);

    const spaceEvent = keydown(link, " ");
    expect(spaceEvent.defaultPrevented).toBe(true);
    expect(commandListener).toHaveBeenCalledTimes(2);
  });

  it("keeps aria-disabled items focusable but blocks activation", () => {
    const root = createFixture();
    createCommandMenuButton(root);
    const disabledListener = vi.fn();
    root.addEventListener("a11y-command-menu:disabled-command", disabledListener);
    const disabledItem = getItems(root)[2];

    getTrigger(root).click();
    disabledItem?.click();

    expect(disabledListener).toHaveBeenCalledOnce();
    const event = disabledListener.mock.calls[0]?.[0] as CustomEvent<CommandMenuEventDetail>;
    expect(event.detail.commandId).toBe("disabled");
    expect(getMenu(root).hidden).toBe(false);
  });

  it("synchronizes class-only disabled state and restores it on refresh and destroy", () => {
    const root = createFixture();
    const firstItem = getItems(root)[0];

    firstItem?.classList.add("is-disabled");
    const instance = createCommandMenuButton(root);

    expect(firstItem?.getAttribute("aria-disabled")).toBe("true");

    firstItem?.classList.remove("is-disabled");
    instance.refresh();
    expect(firstItem?.hasAttribute("aria-disabled")).toBe(false);

    firstItem?.classList.add("is-disabled");
    instance.refresh();
    expect(firstItem?.getAttribute("aria-disabled")).toBe("true");

    instance.destroy();
    expect(firstItem?.hasAttribute("aria-disabled")).toBe(false);
  });

  it("refreshes added command items with roles and roving tabindex", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const commandListener = vi.fn();
    const list = getMenu(root).querySelector("ul");

    if (!(list instanceof HTMLElement)) {
      throw new Error("Missing command list.");
    }

    list.insertAdjacentHTML(
      "beforeend",
      `
        <li>
          <button type="button" data-command-item data-command-id="beta">
            Beta
          </button>
        </li>
      `
    );
    root.addEventListener("a11y-command-menu:command", commandListener);

    instance.refresh();
    const addedItem = root.querySelector("[data-command-id='beta']");

    if (!(addedItem instanceof HTMLElement)) {
      throw new Error("Missing refreshed command item.");
    }

    expect(addedItem.getAttribute("role")).toBe("menuitem");
    expect(addedItem.tabIndex).toBe(-1);

    getTrigger(root).click();
    addedItem.click();

    expect(commandListener).toHaveBeenCalledOnce();
    expect((commandListener.mock.calls[0]?.[0] as CustomEvent<CommandMenuEventDetail>).detail.commandId).toBe("beta");
  });

  it("moves focus to a fallback item when the focused command is removed", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const trigger = getTrigger(root);
    const firstItem = getItems(root)[0];
    const fallbackItem = root.querySelector("#submenu-trigger");

    if (!(firstItem instanceof HTMLElement) || !(fallbackItem instanceof HTMLElement)) {
      throw new Error("Missing refresh focus fixture.");
    }

    trigger.click();
    expect(document.activeElement).toBe(firstItem);

    firstItem.closest("li")?.remove();
    instance.refresh({ preserveFocus: true });

    expect(getMenu(root).hidden).toBe(false);
    expect(firstItem.hasAttribute("tabindex")).toBe(false);
    expect(document.activeElement).toBe(fallbackItem);
    expect(fallbackItem.tabIndex).toBe(0);
    expect(fallbackItem.classList.contains("is-active")).toBe(true);
  });

  it("retains focus on a loading command after refresh", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const firstItem = getItems(root)[0];
    if (!(firstItem instanceof HTMLElement)) {
      throw new Error("Missing loading refresh fixture.");
    }

    getTrigger(root).click();
    expect(document.activeElement).toBe(firstItem);

    firstItem.setAttribute("aria-busy", "true");
    instance.refresh({ preserveFocus: true });

    expect(firstItem.tabIndex).toBe(0);
    expect(document.activeElement).toBe(firstItem);
  });

  it("refreshes newly added submenu relationships and listeners", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const list = getMenu(root).querySelector("ul");

    if (!(list instanceof HTMLElement)) {
      throw new Error("Missing command list.");
    }

    list.insertAdjacentHTML(
      "beforeend",
      `
        <li>
          <button
            id="share-trigger"
            type="button"
            data-command-item
            data-command-submenu-trigger
            data-command-id="share"
          >
            Share
          </button>
          <div id="share-submenu" data-command-submenu>
            <ul>
              <li>
                <button type="button" data-command-item data-command-id="copy-link">
                  Copy link
                </button>
              </li>
            </ul>
          </div>
        </li>
      `
    );

    instance.refresh();

    const shareTrigger = root.querySelector("#share-trigger");
    const shareSubmenu = root.querySelector("#share-submenu");
    const nestedItem = root.querySelector("[data-command-id='copy-link']");

    if (
      !(shareTrigger instanceof HTMLElement) ||
      !(shareSubmenu instanceof HTMLElement) ||
      !(nestedItem instanceof HTMLElement)
    ) {
      throw new Error("Missing refreshed submenu fixture.");
    }

    expect(shareTrigger.getAttribute("role")).toBe("menuitem");
    expect(shareTrigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(shareTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(shareTrigger.getAttribute("aria-controls")).toBe("share-submenu");
    expect(shareSubmenu.getAttribute("role")).toBe("menu");
    expect(shareSubmenu.getAttribute("aria-labelledby")).toBe("share-trigger");
    expect(shareSubmenu.hidden).toBe(true);
    expect(nestedItem.getAttribute("role")).toBe("menuitem");
    expect(nestedItem.tabIndex).toBe(-1);

    getTrigger(root).click();
    shareTrigger.focus();
    keydown(shareTrigger, "ArrowRight");

    expect(shareSubmenu.hidden).toBe(false);
    expect(shareTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(nestedItem);
  });

  it("keeps duplicate initialization stable after refresh", () => {
    const root = createFixture();
    const first = createCommandMenuButton(root);
    const second = createCommandMenuButton(root);
    const commandListener = vi.fn();

    root.addEventListener("a11y-command-menu:command", commandListener);
    first.refresh();
    second.refresh();

    getTrigger(root).click();
    getItems(root)[0]?.click();

    expect(second).toBe(first);
    expect(commandListener).toHaveBeenCalledOnce();
  });

  it("destroy removes refreshed items and listeners after dynamic updates", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const list = getMenu(root).querySelector("ul");

    if (!(list instanceof HTMLElement)) {
      throw new Error("Missing command list.");
    }

    list.insertAdjacentHTML(
      "beforeend",
      `
        <li>
          <button type="button" data-command-item data-command-id="gamma">
            Gamma
          </button>
        </li>
      `
    );

    instance.refresh();
    const addedItem = root.querySelector("[data-command-id='gamma']");

    if (!(addedItem instanceof HTMLElement)) {
      throw new Error("Missing refreshed command item.");
    }

    expect(addedItem.tabIndex).toBe(-1);

    instance.destroy();
    getTrigger(root).click();

    expect(root.classList.contains("is-initialized")).toBe(false);
    expect(addedItem.hasAttribute("tabindex")).toBe(false);
    expect(addedItem.classList.contains("is-active")).toBe(false);
    expect(getMenu(root).hidden).toBe(true);
  });

  it("opens and closes a one-level submenu with arrow keys", () => {
    const root = createFixture();
    createCommandMenuButton(root);
    const trigger = getTrigger(root);
    const submenuTrigger = root.querySelector("#submenu-trigger");
    const submenu = root.querySelector("#submenu");

    if (!(submenuTrigger instanceof HTMLElement) || !(submenu instanceof HTMLElement)) {
      throw new Error("Missing submenu fixture.");
    }

    trigger.click();
    submenuTrigger.focus();
    keydown(submenuTrigger, "ArrowRight");

    expect(submenu.hidden).toBe(false);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");

    const nestedItem = submenu.querySelector("[data-command-item]");

    if (!(nestedItem instanceof HTMLElement)) {
      throw new Error("Missing nested item.");
    }

    keydown(nestedItem, "ArrowLeft");

    expect(submenu.hidden).toBe(true);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(submenuTrigger);
  });

  it("reverses submenu arrow keys in right-to-left layouts", () => {
    const root = createFixture();
    root.style.direction = "rtl";
    createCommandMenuButton(root);
    const submenuTrigger = root.querySelector("#submenu-trigger");
    const submenu = root.querySelector("#submenu");
    const nestedItem = submenu?.querySelector("[data-command-item]");

    if (
      !(submenuTrigger instanceof HTMLElement) ||
      !(submenu instanceof HTMLElement) ||
      !(nestedItem instanceof HTMLElement)
    ) {
      throw new Error("Missing RTL submenu fixture.");
    }

    getTrigger(root).click();
    submenuTrigger.focus();
    keydown(submenuTrigger, "ArrowLeft");

    expect(submenu.hidden).toBe(false);
    expect(document.activeElement).toBe(nestedItem);

    keydown(nestedItem, "ArrowRight");

    expect(submenu.hidden).toBe(true);
    expect(document.activeElement).toBe(submenuTrigger);
  });

  it("does not open disabled submenu triggers", () => {
    const root = createFixture();
    createCommandMenuButton(root);
    const disabledListener = vi.fn();
    root.addEventListener("a11y-command-menu:disabled-command", disabledListener);
    const submenuTrigger = root.querySelector("#submenu-trigger");
    const submenu = root.querySelector("#submenu");

    if (!(submenuTrigger instanceof HTMLElement) || !(submenu instanceof HTMLElement)) {
      throw new Error("Missing submenu fixture.");
    }

    submenuTrigger.setAttribute("aria-disabled", "true");
    getTrigger(root).click();
    submenuTrigger.click();

    expect(disabledListener).toHaveBeenCalledOnce();
    expect(submenu.hidden).toBe(true);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");

    keydown(submenuTrigger, "ArrowRight");

    expect(submenu.hidden).toBe(true);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes hover-opened submenus after the pointer leaves the submenu", () => {
    vi.useFakeTimers();
    const root = createFixture();
    createCommandMenuButton(root, {
      hoverSubmenus: true,
      hoverOpenDelay: 0,
      hoverCloseDelay: 0
    });
    const submenuTrigger = root.querySelector("#submenu-trigger");
    const submenu = root.querySelector("#submenu");

    if (!(submenuTrigger instanceof HTMLElement) || !(submenu instanceof HTMLElement)) {
      throw new Error("Missing submenu fixture.");
    }

    getTrigger(root).click();
    pointer(submenuTrigger, "pointerover");
    vi.runOnlyPendingTimers();

    expect(submenu.hidden).toBe(false);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");

    pointer(submenu, "pointerout", document.body);
    vi.runOnlyPendingTimers();

    expect(submenu.hidden).toBe(true);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("dismisses on outside pointer and focus without stealing the destination focus", () => {
    const root = createFixture();
    root.insertAdjacentHTML("afterend", '<button id="outside" type="button">Outside</button>');
    createCommandMenuButton(root);
    const outside = document.querySelector("#outside");

    if (!(outside instanceof HTMLButtonElement)) {
      throw new Error("Missing outside control.");
    }

    getTrigger(root).click();
    outside.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    expect(getMenu(root).hidden).toBe(true);

    getTrigger(root).click();
    outside.focus();

    expect(getMenu(root).hidden).toBe(true);
    expect(document.activeElement).toBe(outside);
  });

  it("keeps multiple initialized menus independent", () => {
    const firstRoot = createFixture();
    const secondMarkup = firstRoot.outerHTML
      .replaceAll('id="command-trigger"', 'id="second-trigger"')
      .replaceAll('aria-labelledby="command-trigger"', 'aria-labelledby="second-trigger"')
      .replaceAll('id="command-menu"', 'id="second-menu"')
      .replaceAll('aria-controls="command-menu"', 'aria-controls="second-menu"')
      .replaceAll('id="submenu-trigger"', 'id="second-submenu-trigger"')
      .replaceAll('id="submenu"', 'id="second-submenu"')
      .replaceAll('aria-controls="submenu"', 'aria-controls="second-submenu"');
    document.body.insertAdjacentHTML("beforeend", secondMarkup);
    const instances = initCommandMenuButtons();
    const roots = document.querySelectorAll<HTMLElement>("[data-command-menu]");

    expect(instances).toHaveLength(2);

    roots[0]?.querySelector<HTMLElement>("[data-command-trigger]")?.click();
    expect(roots[0]?.querySelector<HTMLElement>("[data-command-menu-panel]")?.hidden).toBe(false);
    expect(roots[1]?.querySelector<HTMLElement>("[data-command-menu-panel]")?.hidden).toBe(true);
  });

  it("warns about duplicate command IDs", () => {
    const root = createFixture();
    getItems(root)[1]?.setAttribute("data-command-id", "alpha");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    createCommandMenuButton(root);

    expect(warn).toHaveBeenCalledWith(
      '[A11yCommandMenuButton] Duplicate data-command-id value: "alpha".'
    );
  });

  it("restores portalled layers to their original positions on destroy", () => {
    const root = createFixture();
    root.style.setProperty("--a11y-command-menu-bg", "rgb(12 34 56)");
    const menu = getMenu(root);
    const submenu = root.querySelector("#submenu");
    const originalMenuParent = menu.parentElement;
    const originalSubmenuParent = submenu?.parentElement;

    if (!(submenu instanceof HTMLElement)) {
      throw new Error("Missing portal submenu fixture.");
    }

    const instance = createCommandMenuButton(root, { portal: true });

    expect(menu.parentElement).toBe(document.body);
    expect(submenu.parentElement).toBe(document.body);
    expect(menu.style.getPropertyValue("--a11y-command-menu-bg")).toBe("rgb(12 34 56)");
    expect(submenu.style.getPropertyValue("--a11y-command-menu-bg")).toBe("rgb(12 34 56)");

    instance.destroy();

    expect(menu.parentElement).toBe(originalMenuParent);
    expect(submenu.parentElement).toBe(originalSubmenuParent);
    expect(menu.style.getPropertyValue("--a11y-command-menu-bg")).toBe("");
    expect(submenu.style.getPropertyValue("--a11y-command-menu-bg")).toBe("");
  });

  it("restores a stale portalled submenu during refresh", () => {
    const root = createFixture();
    root.style.setProperty("--a11y-command-menu-bg", "rgb(12 34 56)");
    const submenuTrigger = root.querySelector<HTMLElement>("[data-command-submenu-trigger]");
    const submenu = root.querySelector<HTMLElement>("[data-command-submenu]");
    const originalParent = submenu?.parentElement;

    if (!submenuTrigger || !submenu || !originalParent) {
      throw new Error("Missing stale portal submenu fixture.");
    }

    const instance = createCommandMenuButton(root, { portal: true });

    expect(submenu.parentElement).toBe(document.body);
    expect(submenu.style.getPropertyValue("--a11y-command-menu-bg")).toBe(
      "rgb(12 34 56)"
    );

    submenuTrigger.removeAttribute("data-command-submenu-trigger");
    instance.refresh();

    expect(submenu.parentElement).toBe(originalParent);
    expect(submenu.style.getPropertyValue("--a11y-command-menu-bg")).toBe("");
  });

  it("destroy removes listeners, state classes, and roving tabindex", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const trigger = getTrigger(root);
    const firstItem = getItems(root)[0];

    trigger.click();
    expect(getMenu(root).hidden).toBe(false);

    instance.destroy();
    trigger.click();

    expect(root.classList.contains("is-initialized")).toBe(false);
    expect(root.classList.contains("is-open")).toBe(false);
    expect(firstItem?.hasAttribute("tabindex")).toBe(false);
    expect(firstItem?.classList.contains("is-active")).toBe(false);
    expect(getMenu(root).hidden).toBe(true);
  });

  it("restores author-owned attributes, roles, IDs, and positioning on destroy", () => {
    document.body.innerHTML = `
      <span id="author-label">Author menu</span>
      <div data-command-menu data-command-mobile-mode="author-mode">
        <button
          type="button"
          data-command-trigger
          aria-haspopup="dialog"
          tabindex="2"
        >
          Commands
        </button>
        <section
          data-command-menu-panel
          role="list"
          aria-labelledby="author-label"
        >
          <ul role="list">
            <li role="listitem">
              <button
                type="button"
                data-command-item
                role="option"
                tabindex="5"
              >
                Alpha
              </button>
            </li>
          </ul>
        </section>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-command-menu]");

    if (!root) {
      throw new Error("Missing author-owned attribute fixture.");
    }

    const trigger = root.querySelector<HTMLElement>("[data-command-trigger]");
    const menu = root.querySelector<HTMLElement>("[data-command-menu-panel]");
    const list = root.querySelector<HTMLElement>("ul");
    const listItem = root.querySelector<HTMLElement>("li");
    const item = root.querySelector<HTMLElement>("[data-command-item]");

    if (!trigger || !menu || !list || !listItem || !item) {
      throw new Error("Incomplete author-owned attribute fixture.");
    }

    const instance = createCommandMenuButton(root);
    trigger.click();
    instance.destroy();

    expect(root.getAttribute("data-command-mobile-mode")).toBe("author-mode");
    expect(trigger.id).toBe("");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.hasAttribute("aria-expanded")).toBe(false);
    expect(trigger.hasAttribute("aria-controls")).toBe(false);
    expect(trigger.getAttribute("tabindex")).toBe("2");
    expect(menu.id).toBe("");
    expect(menu.getAttribute("role")).toBe("list");
    expect(menu.getAttribute("aria-labelledby")).toBe("author-label");
    expect(menu.hidden).toBe(false);
    expect(menu.hasAttribute("data-command-mobile-mode")).toBe(false);
    expect(menu.hasAttribute("data-placement")).toBe(false);
    expect(menu.style.getPropertyValue("--_command-menu-x")).toBe("");
    expect(menu.style.getPropertyValue("--_command-menu-y")).toBe("");
    expect(list.getAttribute("role")).toBe("list");
    expect(listItem.getAttribute("role")).toBe("listitem");
    expect(item.getAttribute("role")).toBe("option");
    expect(item.getAttribute("tabindex")).toBe("5");
    expect(item.hasAttribute("data-command-id")).toBe(false);
  });

  it("reports submenu closure before parent closure and after focus settles", () => {
    const root = createFixture();
    const sequence: string[] = [];
    const focusAtSubmenuOpen: Array<Element | null> = [];
    const submenuTrigger = root.querySelector("#submenu-trigger");
    const nestedItem = root.querySelector("#submenu [data-command-item]");

    if (!(submenuTrigger instanceof HTMLElement) || !(nestedItem instanceof HTMLElement)) {
      throw new Error("Missing submenu lifecycle fixture.");
    }

    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.submenuOpen, (event) => {
      const submenuEvent = event as CommandMenuButtonEvent<
        typeof COMMAND_MENU_BUTTON_EVENTS.submenuOpen
      >;
      sequence.push(`${submenuEvent.type}:${submenuEvent.detail.reason}`);
      focusAtSubmenuOpen.push(document.activeElement);
    });
    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.submenuClose, (event) => {
      const submenuEvent = event as CommandMenuButtonEvent<
        typeof COMMAND_MENU_BUTTON_EVENTS.submenuClose
      >;
      sequence.push(`${submenuEvent.type}:${submenuEvent.detail.reason}`);
    });
    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.close, (event) => {
      const closeEvent = event as CommandMenuButtonEvent<typeof COMMAND_MENU_BUTTON_EVENTS.close>;
      sequence.push(`${closeEvent.type}:${closeEvent.detail.reason}`);
    });

    createCommandMenuButton(root);
    getTrigger(root).focus();
    keydown(getTrigger(root), "ArrowDown");
    submenuTrigger.focus();
    keydown(submenuTrigger, "ArrowRight");
    keydown(nestedItem, "Escape");

    expect(focusAtSubmenuOpen).toEqual([nestedItem]);
    expect(sequence).toEqual([
      "a11y-command-menu:submenu-open:keyboard",
      "a11y-command-menu:submenu-close:escape",
      "a11y-command-menu:close:escape"
    ]);
    expect(document.activeElement).toBe(getTrigger(root));
  });

  it("preserves an open submenu across refresh without duplicate lifecycle noise", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const submenuTrigger = root.querySelector("#submenu-trigger");
    const submenu = root.querySelector("#submenu");
    const openListener = vi.fn();

    if (!(submenuTrigger instanceof HTMLElement) || !(submenu instanceof HTMLElement)) {
      throw new Error("Missing submenu refresh fixture.");
    }

    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.submenuOpen, openListener);
    keydown(getTrigger(root), "ArrowDown");
    submenuTrigger.focus();
    keydown(submenuTrigger, "ArrowRight");

    instance.refresh({ preserveFocus: true });

    expect(openListener).toHaveBeenCalledOnce();
    expect(submenu.hidden).toBe(false);
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("reports refresh-driven closure when required menu markup disappears", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const trigger = getTrigger(root);
    const menu = getMenu(root);
    const closeEvents: Array<CommandMenuButtonEvent<typeof COMMAND_MENU_BUTTON_EVENTS.close>> = [];

    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.close, (event) => {
      closeEvents.push(event as CommandMenuButtonEvent<typeof COMMAND_MENU_BUTTON_EVENTS.close>);
    });

    keydown(trigger, "ArrowDown");
    menu.remove();
    instance.refresh({ preserveFocus: true });
    const closeEvent = closeEvents[0];

    expect(closeEvent).toBeDefined();
    expect(closeEvent?.detail).toMatchObject({
      instance,
      root,
      trigger,
      menu,
      reason: "refresh"
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(root.classList.contains("is-open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("makes destruction terminal, idempotent, and observably ordered", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const sequence: string[] = [];
    const openListener = vi.fn();

    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.close, () => sequence.push("close"));
    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.destroy, () => sequence.push("destroy"));
    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.open, openListener);

    instance.open({ focus: false });
    expect(openListener).toHaveBeenCalledOnce();

    instance.destroy();
    instance.destroy();
    instance.open();
    instance.toggle();
    instance.refresh();

    expect(sequence).toEqual(["close", "destroy"]);
    expect(openListener).toHaveBeenCalledOnce();
    expect(getMenu(root).hidden).toBe(true);
    expect(root.classList.contains("is-initialized")).toBe(false);
  });

  it("defers reentrant destruction until an in-progress close contract completes", () => {
    const root = createFixture();
    const instance = createCommandMenuButton(root);
    const submenuTrigger = root.querySelector("#submenu-trigger");
    const nestedItem = root.querySelector("#submenu [data-command-item]");
    const sequence: string[] = [];

    if (!(submenuTrigger instanceof HTMLElement) || !(nestedItem instanceof HTMLElement)) {
      throw new Error("Missing reentrant lifecycle fixture.");
    }

    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.submenuClose, () => {
      sequence.push("submenu-close");
      instance.destroy();
    });
    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.close, () => sequence.push("close"));
    root.addEventListener(COMMAND_MENU_BUTTON_EVENTS.destroy, () => sequence.push("destroy"));

    getTrigger(root).focus();
    keydown(getTrigger(root), "ArrowDown");
    submenuTrigger.focus();
    keydown(submenuTrigger, "ArrowRight");
    keydown(nestedItem, "Escape");

    expect(sequence).toEqual(["submenu-close", "close", "destroy"]);
    expect(root.classList.contains("is-initialized")).toBe(false);
  });
});
