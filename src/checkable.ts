import {
  registerCommandActivationAdapter,
  type CommandActivationContext,
  type CommandActivationResult
} from "./internal/command-activation";

export type CheckableCommandRole = "menuitemcheckbox" | "menuitemradio";
export type CheckableCommandState = "false" | "mixed" | "true";

export interface CheckableCommandAdapter {
  refresh(): void;
  destroy(): void;
}

const CHECKABLE_ITEM_SELECTOR =
  '[data-command-item][role="menuitemcheckbox"], [data-command-item][role="menuitemradio"]';
const DESTROY_EVENT = "a11y-command-menu:destroy";
const instances = new WeakMap<HTMLElement, CheckableCommandAdapterInstance>();

function getCheckableRole(item: HTMLElement): CheckableCommandRole | null {
  const role = item.getAttribute("role");
  return role === "menuitemcheckbox" || role === "menuitemradio" ? role : null;
}

function getCheckedState(
  item: HTMLElement,
  role: CheckableCommandRole
): CheckableCommandState | null {
  const checked = item.getAttribute("aria-checked");

  if (
    checked === "true" ||
    checked === "false" ||
    (role === "menuitemcheckbox" && checked === "mixed")
  ) {
    return checked;
  }

  return null;
}

class CheckableCommandAdapterInstance implements CheckableCommandAdapter {
  private readonly root: HTMLElement;
  private readonly eventController = new AbortController();
  private unregisterActivationAdapter: (() => void) | null;
  private destroyed = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.unregisterActivationAdapter = registerCommandActivationAdapter(
      root,
      this.handleCommandActivation.bind(this)
    );
    root.addEventListener(DESTROY_EVENT, () => this.destroy(), {
      signal: this.eventController.signal
    });
    this.refresh();
  }

  refresh(): void {
    if (this.destroyed) {
      return;
    }

    this.getCheckableItems().forEach((item) => this.validateItem(item));
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.unregisterActivationAdapter?.();
    this.unregisterActivationAdapter = null;
    this.eventController.abort();
    instances.delete(this.root);
  }

  private handleCommandActivation({
    item
  }: CommandActivationContext): CommandActivationResult | void {
    if (this.destroyed) {
      return;
    }

    const role = getCheckableRole(item);

    if (!role) {
      return;
    }

    const checked = getCheckedState(item, role);

    if (!checked) {
      this.warnInvalidCheckedState(item, role);
      return { preventClose: true };
    }

    if (role === "menuitemcheckbox") {
      item.setAttribute("aria-checked", checked === "true" ? "false" : "true");
      return { preventClose: true };
    }

    const group = item.closest<HTMLElement>('[role="group"]');

    if (!group) {
      this.warnMissingRadioGroup(item);
      return { preventClose: true };
    }

    group
      .querySelectorAll<HTMLElement>('[data-command-item][role="menuitemradio"]')
      .forEach((peer) => {
        if (peer.closest('[role="group"]') === group && getCheckedState(peer, "menuitemradio")) {
          peer.setAttribute("aria-checked", peer === item ? "true" : "false");
        }
      });

    return { preventClose: true };
  }

  private validateItem(item: HTMLElement): void {
    const role = getCheckableRole(item);

    if (!role) {
      return;
    }

    if (!getCheckedState(item, role)) {
      this.warnInvalidCheckedState(item, role);
    }

    if (role === "menuitemradio" && !item.closest('[role="group"]')) {
      this.warnMissingRadioGroup(item);
    }
  }

  private getCheckableItems(): HTMLElement[] {
    const scopes = new Set<ParentNode>([this.root]);
    const menuId = this.root
      .querySelector<HTMLElement>("[data-command-trigger]")
      ?.getAttribute("aria-controls");
    const menu = menuId ? this.root.ownerDocument.getElementById(menuId) : null;

    if (menu) {
      scopes.add(menu);
      menu
        .querySelectorAll<HTMLElement>("[data-command-submenu-trigger][aria-controls]")
        .forEach((trigger) => {
          const submenuId = trigger.getAttribute("aria-controls");
          const submenu = submenuId
            ? this.root.ownerDocument.getElementById(submenuId)
            : null;

          if (submenu) {
            scopes.add(submenu);
          }
        });
    }

    return Array.from(
      new Set(
        Array.from(scopes).flatMap((scope) =>
          Array.from(scope.querySelectorAll<HTMLElement>(CHECKABLE_ITEM_SELECTOR))
        )
      )
    );
  }

  private warnInvalidCheckedState(item: HTMLElement, role: CheckableCommandRole): void {
    const allowed =
      role === "menuitemcheckbox" ? '"false", "mixed", or "true"' : '"false" or "true"';
    console.warn(
      `[A11yCommandMenuButton] ${role} commands require aria-checked=${allowed}.`,
      item
    );
  }

  private warnMissingRadioGroup(item: HTMLElement): void {
    console.warn(
      '[A11yCommandMenuButton] menuitemradio commands require an explicit ancestor with role="group".',
      item
    );
  }
}

export function createCheckableCommandAdapter(root: HTMLElement): CheckableCommandAdapter {
  const existing = instances.get(root);

  if (existing) {
    return existing;
  }

  const instance = new CheckableCommandAdapterInstance(root);
  instances.set(root, instance);
  return instance;
}
