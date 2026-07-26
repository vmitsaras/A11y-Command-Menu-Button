import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCheckableCommandAdapter } from "../src/checkable";
import { createCommandMenuButton } from "../src/index";

function createFixture(): HTMLElement {
  document.body.innerHTML = `
    <div class="a11y-command-menu-button" data-command-menu>
      <button type="button" data-command-trigger>Commands</button>
      <div data-command-menu-panel hidden>
        <ul role="none">
          <li role="none">
            <button
              type="button"
              data-command-item
              data-command-id="comments"
              role="menuitemcheckbox"
              aria-checked="false"
            >
              <span class="a11y-command-menu-button__checkmark" aria-hidden="true"></span>
              Show comments
            </button>
          </li>
          <li role="group" aria-label="View mode">
            <button
              type="button"
              data-command-item
              data-command-id="comfortable"
              role="menuitemradio"
              aria-checked="true"
            >Comfortable</button>
            <button
              type="button"
              data-command-item
              data-command-id="compact"
              role="menuitemradio"
              aria-checked="false"
            >Compact</button>
          </li>
        </ul>
      </div>
    </div>
  `;

  const root = document.querySelector<HTMLElement>("[data-command-menu]");

  if (!root) {
    throw new Error("Missing checkable fixture.");
  }

  return root;
}

function getItem(root: HTMLElement, id: string): HTMLElement {
  const item = root.querySelector<HTMLElement>(`[data-command-id="${id}"]`);

  if (!item) {
    throw new Error(`Missing ${id} item.`);
  }

  return item;
}

function getMenu(root: HTMLElement): HTMLElement {
  const menu = root.querySelector<HTMLElement>("[data-command-menu-panel]");

  if (!menu) {
    throw new Error("Missing menu.");
  }

  return menu;
}

function keydown(target: Element, key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
  target.dispatchEvent(event);
  return event;
}

describe("checkable command adapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("preserves explicit checkable item and group roles during initialization and refresh", () => {
    const root = createFixture();
    const menu = createCommandMenuButton(root, { closeOnSelect: false });
    const comments = getItem(root, "comments");
    const group = root.querySelector('[role="group"]');

    expect(comments.getAttribute("role")).toBe("menuitemcheckbox");
    expect(getItem(root, "compact").getAttribute("role")).toBe("menuitemradio");
    expect(group?.getAttribute("role")).toBe("group");

    menu.refresh();

    expect(comments.getAttribute("role")).toBe("menuitemcheckbox");
    expect(group?.getAttribute("role")).toBe("group");
  });

  it("toggles a checkbox with Enter and Space while retaining focus and leaving the menu open", () => {
    const root = createFixture();
    createCommandMenuButton(root);
    createCheckableCommandAdapter(root);
    const comments = getItem(root, "comments");
    const trigger = root.querySelector<HTMLElement>("[data-command-trigger]");

    trigger?.click();
    comments.focus();
    keydown(comments, "Enter");

    expect(comments.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(comments);
    expect(getMenu(root).hidden).toBe(false);

    keydown(comments, " ");
    expect(comments.getAttribute("aria-checked")).toBe("false");
  });

  it("resolves a mixed checkbox to checked on activation", () => {
    const root = createFixture();
    const comments = getItem(root, "comments");
    comments.setAttribute("aria-checked", "mixed");
    createCommandMenuButton(root, { closeOnSelect: false });
    createCheckableCommandAdapter(root);

    comments.click();

    expect(comments.getAttribute("aria-checked")).toBe("true");
  });

  it("updates checkbox state before dispatching the existing command event", () => {
    const root = createFixture();
    createCommandMenuButton(root, { closeOnSelect: false });
    createCheckableCommandAdapter(root);
    const comments = getItem(root, "comments");
    const observedState = vi.fn();

    root.addEventListener("a11y-command-menu:command", (event) => {
      const item = (event as CustomEvent<{ item: HTMLElement }>).detail.item;
      observedState(item.getAttribute("aria-checked"));
    });
    comments.click();

    expect(observedState).toHaveBeenCalledOnce();
    expect(observedState).toHaveBeenCalledWith("true");
  });

  it("lets the host close explicitly after observing the updated state", () => {
    const root = createFixture();
    const menu = createCommandMenuButton(root);
    createCheckableCommandAdapter(root);
    const comments = getItem(root, "comments");

    root.addEventListener("a11y-command-menu:command", () => menu.close());
    root.querySelector<HTMLElement>("[data-command-trigger]")?.click();
    comments.click();

    expect(comments.getAttribute("aria-checked")).toBe("true");
    expect(getMenu(root).hidden).toBe(true);
  });

  it("keeps ordinary commands on the configured close-on-select path", () => {
    const root = createFixture();
    getMenu(root).querySelector("ul")?.insertAdjacentHTML(
      "beforeend",
      '<li><button type="button" data-command-item data-command-id="save" role="menuitem">Save</button></li>'
    );
    createCommandMenuButton(root);
    createCheckableCommandAdapter(root);

    root.querySelector<HTMLElement>("[data-command-trigger]")?.click();
    getItem(root, "save").click();

    expect(getMenu(root).hidden).toBe(true);
  });

  it("updates checkable commands when the menu is portalled", () => {
    const root = createFixture();
    const comments = getItem(root, "comments");
    const menuElement = getMenu(root);
    const menu = createCommandMenuButton(root, { portal: true });
    createCheckableCommandAdapter(root);

    comments.click();

    expect(comments.getAttribute("aria-checked")).toBe("true");
    expect(menuElement.parentElement).toBe(document.body);
    menu.destroy();
  });

  it("selects one radio without affecting a separate explicit group", () => {
    const root = createFixture();
    const list = getMenu(root).querySelector("ul");
    list?.insertAdjacentHTML(
      "beforeend",
      `<li role="group" aria-label="Theme">
        <button type="button" data-command-item data-command-id="light" role="menuitemradio" aria-checked="true">Light</button>
      </li>`
    );
    createCommandMenuButton(root, { closeOnSelect: false });
    createCheckableCommandAdapter(root);

    getItem(root, "compact").click();

    expect(getItem(root, "comfortable").getAttribute("aria-checked")).toBe("false");
    expect(getItem(root, "compact").getAttribute("aria-checked")).toBe("true");
    expect(getItem(root, "light").getAttribute("aria-checked")).toBe("true");
  });

  it("does not toggle an already selected radio off", () => {
    const root = createFixture();
    createCommandMenuButton(root, { closeOnSelect: false });
    createCheckableCommandAdapter(root);
    const comfortable = getItem(root, "comfortable");

    comfortable.click();

    expect(comfortable.getAttribute("aria-checked")).toBe("true");
  });

  it("honors disabled and loading activation blocking", () => {
    const root = createFixture();
    const comments = getItem(root, "comments");
    const compact = getItem(root, "compact");
    comments.setAttribute("aria-disabled", "true");
    compact.setAttribute("data-command-loading", "");
    createCommandMenuButton(root, { closeOnSelect: false });
    createCheckableCommandAdapter(root);
    const commandListener = vi.fn();
    root.addEventListener("a11y-command-menu:command", commandListener);

    comments.click();
    compact.click();

    expect(comments.getAttribute("aria-checked")).toBe("false");
    expect(compact.getAttribute("aria-checked")).toBe("false");
    expect(commandListener).not.toHaveBeenCalled();
  });

  it("handles checkable items added during refresh", () => {
    const root = createFixture();
    const menu = createCommandMenuButton(root, { closeOnSelect: false });
    const adapter = createCheckableCommandAdapter(root);
    getMenu(root).querySelector("ul")?.insertAdjacentHTML(
      "beforeend",
      '<li><button type="button" data-command-item data-command-id="wrap" role="menuitemcheckbox" aria-checked="false">Wrap lines</button></li>'
    );

    menu.refresh();
    adapter.refresh();
    const wrap = getItem(root, "wrap");
    wrap.click();

    expect(wrap.getAttribute("role")).toBe("menuitemcheckbox");
    expect(wrap.getAttribute("aria-checked")).toBe("true");
  });

  it("deduplicates initialization and removes behavior on destroy", () => {
    const root = createFixture();
    createCommandMenuButton(root, { closeOnSelect: false });
    const first = createCheckableCommandAdapter(root);
    const second = createCheckableCommandAdapter(root);
    const comments = getItem(root, "comments");

    expect(second).toBe(first);
    comments.click();
    expect(comments.getAttribute("aria-checked")).toBe("true");

    first.destroy();
    comments.click();
    expect(comments.getAttribute("aria-checked")).toBe("true");
  });

  it("cleans up automatically when the command menu is destroyed", () => {
    const root = createFixture();
    const menu = createCommandMenuButton(root, { closeOnSelect: false });
    createCheckableCommandAdapter(root);
    const comments = getItem(root, "comments");

    menu.destroy();
    const reinitializedMenu = createCommandMenuButton(root, { closeOnSelect: false });
    comments.click();

    expect(comments.getAttribute("aria-checked")).toBe("false");
    reinitializedMenu.destroy();
  });

  it("warns and leaves invalid or ungrouped author state unchanged", () => {
    const root = createFixture();
    const comments = getItem(root, "comments");
    const compact = getItem(root, "compact");
    comments.setAttribute("aria-checked", "invalid");
    compact.closest('[role="group"]')?.removeAttribute("role");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createCommandMenuButton(root, { closeOnSelect: false });
    createCheckableCommandAdapter(root);

    comments.click();
    compact.click();

    expect(comments.getAttribute("aria-checked")).toBe("invalid");
    expect(compact.getAttribute("aria-checked")).toBe("false");
    expect(warn).toHaveBeenCalled();
  });
});
