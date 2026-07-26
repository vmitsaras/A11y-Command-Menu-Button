import { applyCommandActivationAdapters } from "./internal/command-activation";

export type CommandMenuButtonPlacement = "auto" | "top" | "bottom";
export type CommandMenuButtonSubmenuPlacement = "auto" | "left" | "right";
export type CommandMenuButtonMobileMode = "sheet" | "menu";
export type CommandMenuButtonFocusTarget = "first" | "last" | false;
export type CommandMenuButtonAnnouncementResult = string | false | null | undefined;

export interface CommandMenuButtonAnnouncementContext {
  commandId: string | null;
  item: HTMLElement;
  menu: HTMLElement;
  trigger: HTMLElement;
  originalEvent: Event;
}

export type CommandMenuButtonAnnouncementFormatter = (
  context: CommandMenuButtonAnnouncementContext
) => CommandMenuButtonAnnouncementResult;

export interface CommandMenuButtonAnnouncementOptions {
  target: HTMLElement | string;
  formatCommand?: CommandMenuButtonAnnouncementFormatter;
  formatDisabled?: CommandMenuButtonAnnouncementFormatter;
  formatLoading?: CommandMenuButtonAnnouncementFormatter;
}

export interface CommandMenuButtonOptions {
  closeOnSelect?: boolean;
  restoreFocus?: boolean;
  loop?: boolean;
  placement?: CommandMenuButtonPlacement;
  submenuPlacement?: CommandMenuButtonSubmenuPlacement;
  hoverSubmenus?: boolean;
  hoverOpenDelay?: number;
  hoverCloseDelay?: number;
  typeahead?: boolean;
  mobileMode?: CommandMenuButtonMobileMode;
  portal?: boolean;
  announce?: false | CommandMenuButtonAnnouncementOptions;
}

export interface CommandMenuButtonOpenOptions {
  focus?: CommandMenuButtonFocusTarget;
}

export interface CommandMenuButtonCloseOptions {
  restoreFocus?: boolean;
}

export interface CommandMenuButtonRefreshOptions {
  preserveFocus?: boolean;
}

export interface CommandMenuButtonInstance {
  open(options?: CommandMenuButtonOpenOptions): void;
  close(options?: CommandMenuButtonCloseOptions): void;
  toggle(options?: CommandMenuButtonOpenOptions): void;
  refresh(options?: CommandMenuButtonRefreshOptions): void;
  destroy(): void;
}

export type CommandMenuButtonEventReason =
  | "api"
  | "command"
  | "destroy"
  | "escape"
  | "focus-outside"
  | "hover"
  | "keyboard"
  | "pointer"
  | "pointer-outside"
  | "refresh"
  | "scroll"
  | "tab"
  | "trigger"
  | (string & {});

type NormalizedCommandMenuButtonOptions = Required<CommandMenuButtonOptions>;
type RawCommandMenuButtonOptions = {
  [Property in keyof CommandMenuButtonOptions]?: CommandMenuButtonOptions[Property] | string;
};

interface CommandSubmenu {
  trigger: HTMLElement;
  menu: HTMLElement;
  items: HTMLElement[];
}

interface OriginalPosition {
  parent: Node;
  nextSibling: ChildNode | null;
}

interface OriginalStyleProperty {
  value: string;
  priority: string;
}

type OriginalAttributeMap = Map<string, string | null>;
type OriginalStylePropertyMap = Map<string, OriginalStyleProperty>;

const COMPONENT_NAME = "a11y-command-menu";

const DEFAULT_OPTIONS = Object.freeze({
  closeOnSelect: true,
  restoreFocus: true,
  loop: true,
  placement: "auto",
  submenuPlacement: "auto",
  hoverSubmenus: false,
  hoverOpenDelay: 150,
  hoverCloseDelay: 250,
  typeahead: false,
  mobileMode: "sheet",
  portal: false,
  announce: false
} satisfies NormalizedCommandMenuButtonOptions);

const SELECTORS = Object.freeze({
  root: "[data-command-menu]",
  item: "[data-command-item]",
  menu: "[data-command-menu-panel]",
  submenu: "[data-command-submenu]",
  submenuTrigger: "[data-command-submenu-trigger]",
  trigger: "[data-command-trigger]"
});

const CLASSES = Object.freeze({
  active: "is-active",
  disabled: "is-disabled",
  initialized: "is-initialized",
  open: "is-open"
});

const ATTRIBUTES = Object.freeze({
  label: "aria-label",
  atomic: "aria-atomic",
  busy: "aria-busy",
  commandId: "data-command-id",
  controls: "aria-controls",
  disabled: "disabled",
  expanded: "aria-expanded",
  hasPopup: "aria-haspopup",
  hidden: "hidden",
  labelledBy: "aria-labelledby",
  live: "aria-live",
  role: "role",
  submenuOpen: "data-submenu-open",
  mobileMode: "data-command-mobile-mode"
});

const SUPPORTED_ITEM_ROLES = new Set(["menuitem", "menuitemcheckbox", "menuitemradio"]);

const ANNOUNCEMENT_ATTRIBUTES = Object.freeze({
  command: "data-command-announcement",
  disabled: "data-command-disabled-announcement",
  disabledReason: "data-disabled-reason",
  loading: "data-command-loading-announcement"
});

const DEFAULT_ANNOUNCEMENTS = Object.freeze({
  command: "Command activated.",
  disabled: "Command unavailable.",
  loading: "Command is still loading."
});

export const COMMAND_MENU_BUTTON_EVENTS = Object.freeze({
  init: `${COMPONENT_NAME}:init`,
  open: `${COMPONENT_NAME}:open`,
  close: `${COMPONENT_NAME}:close`,
  command: `${COMPONENT_NAME}:command`,
  disabledCommand: `${COMPONENT_NAME}:disabled-command`,
  submenuOpen: `${COMPONENT_NAME}:submenu-open`,
  submenuClose: `${COMPONENT_NAME}:submenu-close`,
  destroy: `${COMPONENT_NAME}:destroy`
});

export interface CommandMenuButtonEventBaseDetail {
  instance: CommandMenuButtonInstance;
  root: HTMLElement;
}

export interface CommandMenuButtonStateEventDetail extends CommandMenuButtonEventBaseDetail {
  trigger: HTMLElement;
  menu: HTMLElement;
  reason: CommandMenuButtonEventReason;
}

export interface CommandMenuButtonCommandEventDetail
  extends CommandMenuButtonEventBaseDetail,
    CommandMenuButtonAnnouncementContext {}

export interface CommandMenuButtonSubmenuEventDetail extends CommandMenuButtonEventBaseDetail {
  trigger: HTMLElement;
  submenu: HTMLElement;
  reason: CommandMenuButtonEventReason;
}

export interface CommandMenuButtonEventDetailMap {
  [COMMAND_MENU_BUTTON_EVENTS.init]: CommandMenuButtonEventBaseDetail;
  [COMMAND_MENU_BUTTON_EVENTS.open]: CommandMenuButtonStateEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.close]: CommandMenuButtonStateEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.command]: CommandMenuButtonCommandEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.disabledCommand]: CommandMenuButtonCommandEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.submenuOpen]: CommandMenuButtonSubmenuEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.submenuClose]: CommandMenuButtonSubmenuEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.destroy]: CommandMenuButtonEventBaseDetail;
}

export type CommandMenuButtonEventName = keyof CommandMenuButtonEventDetailMap;
export type CommandMenuButtonEvent<Name extends CommandMenuButtonEventName> = CustomEvent<
  CommandMenuButtonEventDetailMap[Name]
>;
export type CommandMenuButtonEventMap = {
  [Name in CommandMenuButtonEventName]: CommandMenuButtonEvent<Name>;
};

type CommandMenuButtonEventExtraDetail<Name extends CommandMenuButtonEventName> = Omit<
  CommandMenuButtonEventDetailMap[Name],
  keyof CommandMenuButtonEventBaseDetail
>;

const KEYS = Object.freeze({
  arrowDown: "ArrowDown",
  arrowLeft: "ArrowLeft",
  arrowRight: "ArrowRight",
  arrowUp: "ArrowUp",
  end: "End",
  enter: "Enter",
  escape: "Escape",
  home: "Home",
  space: " ",
  tab: "Tab"
});

const PLACEMENTS = Object.freeze(["auto", "top", "bottom"] as const);
const SUBMENU_PLACEMENTS = Object.freeze(["auto", "left", "right"] as const);
const MOBILE_MODES = Object.freeze(["sheet", "menu"] as const);
const VIEWPORT_PADDING = 8;
const MOBILE_MEDIA_QUERY = "(max-width: 40rem)";
const TYPEAHEAD_RESET_DELAY = 500;
const TABBABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");
const PORTAL_CUSTOM_PROPERTIES = [
  "--a11y-command-menu-bg",
  "--a11y-command-menu-color",
  "--a11y-command-menu-muted-color",
  "--a11y-command-menu-border-color",
  "--a11y-command-menu-item-border-color",
  "--a11y-command-menu-item-active-bg",
  "--a11y-command-menu-item-disabled-opacity",
  "--a11y-command-menu-radius",
  "--a11y-command-menu-item-radius",
  "--a11y-command-menu-shadow",
  "--a11y-command-menu-padding",
  "--a11y-command-menu-gap",
  "--a11y-command-menu-min-width",
  "--a11y-command-menu-max-width",
  "--a11y-command-menu-z-index",
  "--a11y-command-menu-item-gap",
  "--a11y-command-menu-item-padding",
  "--a11y-command-menu-focus-ring",
  "--a11y-command-menu-focus-offset",
  "--a11y-command-menu-transition-duration",
  "--a11y-command-menu-transition-easing"
] as const;

function createUniqueId(prefix: string): string {
  const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
  return `${prefix}-${id}`;
}

function getClosestElement(target: EventTarget | null, selector: string): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const element = target.closest(selector);
  return element instanceof HTMLElement ? element : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), Math.max(min, max));
}

function escapeCssIdentifier(value: string): string {
  return globalThis.CSS?.escape ? globalThis.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function hasMeaningfulText(value: string | null | undefined): boolean {
  return value ? /[\p{L}\p{N}]/u.test(value) : false;
}

function getTextContentWithoutAriaHidden(element: Element): string {
  return Array.from(element.childNodes)
    .map((node) => {
      if (node.nodeType === 3) {
        return node.textContent ?? "";
      }

      if (!(node instanceof Element) || node.getAttribute("aria-hidden") === "true") {
        return "";
      }

      return getTextContentWithoutAriaHidden(node);
    })
    .join("");
}

function getLabelledByText(element: HTMLElement): string {
  const labelledBy = element.getAttribute(ATTRIBUTES.labelledBy);

  if (!labelledBy) {
    return "";
  }

  return labelledBy
    .split(/\s+/)
    .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
    .join(" ");
}

function hasUsableAccessibleName(element: HTMLElement): boolean {
  return (
    hasMeaningfulText(element.getAttribute(ATTRIBUTES.label)) ||
    hasMeaningfulText(getLabelledByText(element)) ||
    hasMeaningfulText(getTextContentWithoutAriaHidden(element))
  );
}

function normalizeAnnouncementText(value: CommandMenuButtonAnnouncementResult): string | null {
  if (value === false || value === null || value === undefined) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized : null;
}

function getExplicitAnnouncement(item: HTMLElement, attributes: readonly string[], fallback: string): string {
  for (const attribute of attributes) {
    const message = normalizeAnnouncementText(item.getAttribute(attribute));

    if (message) {
      return message;
    }
  }

  return fallback;
}

function formatDefaultCommandAnnouncement(context: CommandMenuButtonAnnouncementContext): string {
  return getExplicitAnnouncement(
    context.item,
    [ANNOUNCEMENT_ATTRIBUTES.command],
    DEFAULT_ANNOUNCEMENTS.command
  );
}

function formatDefaultDisabledAnnouncement(context: CommandMenuButtonAnnouncementContext): string {
  return getExplicitAnnouncement(
    context.item,
    [ANNOUNCEMENT_ATTRIBUTES.disabled, ANNOUNCEMENT_ATTRIBUTES.disabledReason],
    DEFAULT_ANNOUNCEMENTS.disabled
  );
}

function formatDefaultLoadingAnnouncement(context: CommandMenuButtonAnnouncementContext): string {
  return getExplicitAnnouncement(
    context.item,
    [ANNOUNCEMENT_ATTRIBUTES.loading],
    DEFAULT_ANNOUNCEMENTS.loading
  );
}

function toSafeBoolean(value: boolean | string | undefined, fallback: boolean): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function toSafeInteger(
  value: number | string | undefined,
  fallback: number,
  options: { min?: number; max?: number } = {}
): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) return fallback;
  if (options.min !== undefined && parsed < options.min) return fallback;
  if (options.max !== undefined && parsed > options.max) return fallback;

  return parsed;
}

function toSafeChoice<const Choice extends string>(
  value: Choice | string | undefined,
  fallback: Choice,
  choices: readonly Choice[]
): Choice {
  return choices.includes(value as Choice) ? (value as Choice) : fallback;
}

function readDatasetOptions(root: HTMLElement): RawCommandMenuButtonOptions {
  return {
    closeOnSelect: root.dataset.closeOnSelect,
    restoreFocus: root.dataset.restoreFocus,
    loop: root.dataset.loop,
    placement: root.dataset.placement,
    submenuPlacement: root.dataset.submenuPlacement,
    hoverSubmenus: root.dataset.hoverSubmenus,
    hoverOpenDelay: root.dataset.hoverOpenDelay,
    hoverCloseDelay: root.dataset.hoverCloseDelay,
    typeahead: root.dataset.typeahead,
    mobileMode: root.dataset.mobileMode,
    portal: root.dataset.portal
  };
}

function normalizeOptions(
  root: HTMLElement,
  options: CommandMenuButtonOptions = {}
): NormalizedCommandMenuButtonOptions {
  const datasetOptions = readDatasetOptions(root);
  const datasetPlacement = toSafeChoice(datasetOptions.placement, DEFAULT_OPTIONS.placement, PLACEMENTS);
  const datasetSubmenuPlacement = toSafeChoice(
    datasetOptions.submenuPlacement,
    DEFAULT_OPTIONS.submenuPlacement,
    SUBMENU_PLACEMENTS
  );
  const datasetMobileMode = toSafeChoice(datasetOptions.mobileMode, DEFAULT_OPTIONS.mobileMode, MOBILE_MODES);

  return {
    closeOnSelect: toSafeBoolean(
      options.closeOnSelect,
      toSafeBoolean(datasetOptions.closeOnSelect, DEFAULT_OPTIONS.closeOnSelect)
    ),
    restoreFocus: toSafeBoolean(
      options.restoreFocus,
      toSafeBoolean(datasetOptions.restoreFocus, DEFAULT_OPTIONS.restoreFocus)
    ),
    loop: toSafeBoolean(options.loop, toSafeBoolean(datasetOptions.loop, DEFAULT_OPTIONS.loop)),
    placement: toSafeChoice(options.placement, datasetPlacement, PLACEMENTS),
    submenuPlacement: toSafeChoice(options.submenuPlacement, datasetSubmenuPlacement, SUBMENU_PLACEMENTS),
    hoverSubmenus: toSafeBoolean(
      options.hoverSubmenus,
      toSafeBoolean(datasetOptions.hoverSubmenus, DEFAULT_OPTIONS.hoverSubmenus)
    ),
    hoverOpenDelay: toSafeInteger(
      options.hoverOpenDelay,
      toSafeInteger(datasetOptions.hoverOpenDelay, DEFAULT_OPTIONS.hoverOpenDelay, { min: 0, max: 2000 }),
      { min: 0, max: 2000 }
    ),
    hoverCloseDelay: toSafeInteger(
      options.hoverCloseDelay,
      toSafeInteger(datasetOptions.hoverCloseDelay, DEFAULT_OPTIONS.hoverCloseDelay, { min: 0, max: 2000 }),
      { min: 0, max: 2000 }
    ),
    typeahead: toSafeBoolean(options.typeahead, toSafeBoolean(datasetOptions.typeahead, DEFAULT_OPTIONS.typeahead)),
    mobileMode: toSafeChoice(options.mobileMode, datasetMobileMode, MOBILE_MODES),
    portal: toSafeBoolean(options.portal, toSafeBoolean(datasetOptions.portal, DEFAULT_OPTIONS.portal)),
    announce: options.announce ?? DEFAULT_OPTIONS.announce
  };
}

function isMobileSheetMode(options: NormalizedCommandMenuButtonOptions): boolean {
  return (
    options.mobileMode === "sheet" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(MOBILE_MEDIA_QUERY).matches
  );
}

export class A11yCommandMenuButton implements CommandMenuButtonInstance {
  private static readonly instances = new WeakMap<HTMLElement, A11yCommandMenuButton>();

  private readonly root: HTMLElement;
  private options: NormalizedCommandMenuButtonOptions = { ...DEFAULT_OPTIONS };
  private trigger: HTMLElement | null = null;
  private menu: HTMLElement | null = null;
  private items: HTMLElement[] = [];
  private submenus: CommandSubmenu[] = [];
  private isOpen = false;
  private activeItem: HTMLElement | null = null;
  private openSubmenuTrigger: HTMLElement | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private typeaheadBuffer = "";
  private typeaheadTimeoutId: number | null = null;
  private hoverTimeoutId: number | null = null;
  private eventController: AbortController | null = null;
  private openEventController: AbortController | null = null;
  private initialized = false;
  private closing = false;
  private destroyAfterClose = false;
  private destroying = false;
  private destroyed = false;
  private readonly originalPositions = new Map<HTMLElement, OriginalPosition>();
  private readonly portalOriginalStyleProperties = new Map<
    HTMLElement,
    Map<string, OriginalStyleProperty>
  >();
  private readonly originalAttributes = new Map<HTMLElement, OriginalAttributeMap>();
  private readonly originalStyleProperties = new Map<
    HTMLElement,
    OriginalStylePropertyMap
  >();
  private announcementTarget: HTMLElement | null = null;
  private announcementTargetInitialText = "";
  private lastAnnouncement = "";
  private announcementVersion = 0;
  private readonly announcementTargetOriginalAttributes = new Map<string, string | null>();
  private readonly managedAriaDisabledItems = new Map<HTMLElement, string | null>();

  private readonly boundOnTriggerClick = this.onTriggerClick.bind(this);
  private readonly boundOnTriggerKeydown = this.onTriggerKeydown.bind(this);
  private readonly boundOnMenuKeydown = this.onMenuKeydown.bind(this);
  private readonly boundOnMenuClick = this.onMenuClick.bind(this);
  private readonly boundOnMenuPointerOver = this.onMenuPointerOver.bind(this);
  private readonly boundOnMenuPointerOut = this.onMenuPointerOut.bind(this);
  private readonly boundOnDocumentPointerDown = this.onDocumentPointerDown.bind(this);
  private readonly boundOnDocumentFocusIn = this.onDocumentFocusIn.bind(this);
  private readonly boundOnWindowResize = this.onWindowResize.bind(this);
  private readonly boundOnWindowScroll = this.onWindowScroll.bind(this);

  constructor(root: HTMLElement, options: CommandMenuButtonOptions = {}) {
    this.root = root;

    const existingInstance = A11yCommandMenuButton.instances.get(root);

    if (existingInstance) {
      return existingInstance;
    }

    this.options = normalizeOptions(root, options);
    this.trigger = this.root.querySelector<HTMLElement>(SELECTORS.trigger);
    this.menu = this.root.querySelector<HTMLElement>(SELECTORS.menu);

    if (!this.trigger || !this.menu) {
      return;
    }

    A11yCommandMenuButton.instances.set(root, this);
    this.init();
  }

  open({ focus = "first" }: CommandMenuButtonOpenOptions = {}): void {
    this.openWithReason({ focus }, "api");
  }

  private openWithReason(
    { focus = "first" }: CommandMenuButtonOpenOptions,
    reason: CommandMenuButtonEventReason
  ): void {
    if (
      !this.initialized ||
      this.closing ||
      this.destroying ||
      this.destroyed ||
      !this.trigger ||
      !this.menu
    ) {
      return;
    }

    if (this.isOpen) {
      if (focus === "last") {
        this.focusLastItem();
      } else if (focus !== false) {
        this.focusFirstItem();
      }
      return;
    }

    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.setManagedHidden(this.menu, false);
    this.root.classList.add(CLASSES.open);
    this.setManagedAttribute(this.trigger, ATTRIBUTES.expanded, "true");
    this.isOpen = true;

    this.openEventController = new AbortController();
    window.addEventListener("resize", this.boundOnWindowResize, { signal: this.openEventController.signal });
    window.addEventListener("scroll", this.boundOnWindowScroll, {
      capture: true,
      signal: this.openEventController.signal
    });

    this.updatePosition();
    if (focus === "last") {
      this.focusLastItem();
    } else if (focus !== false) {
      this.focusFirstItem();
    }

    this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.open, {
      trigger: this.trigger,
      menu: this.menu,
      reason
    });
  }

  close({ restoreFocus = this.options.restoreFocus }: CommandMenuButtonCloseOptions = {}): void {
    this.closeWithReason({ restoreFocus }, "api");
  }

  private closeWithReason(
    { restoreFocus = this.options.restoreFocus }: CommandMenuButtonCloseOptions,
    reason: CommandMenuButtonEventReason
  ): void {
    if (this.destroyed || !this.trigger || !this.menu || !this.isOpen) {
      return;
    }

    this.closing = true;

    this.setManagedHidden(this.menu, true);
    this.root.classList.remove(CLASSES.open);
    this.setManagedAttribute(this.trigger, ATTRIBUTES.expanded, "false");
    this.isOpen = false;

    this.openEventController?.abort();
    this.openEventController = null;
    this.clearHoverTimeout();
    this.closeAllSubmenus(reason);
    this.resetRovingTabindex();

    const focusTarget = this.lastFocusedElement?.isConnected ? this.lastFocusedElement : this.trigger;

    if (restoreFocus && focusTarget.isConnected) {
      focusTarget.focus();
    }

    this.lastFocusedElement = null;
    this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.close, {
      trigger: this.trigger,
      menu: this.menu,
      reason
    });
    this.closing = false;

    if (this.destroyAfterClose) {
      this.destroyAfterClose = false;
      this.destroy();
    }
  }

  toggle({ focus = "first" }: CommandMenuButtonOpenOptions = {}): void {
    this.toggleWithReason({ focus }, "api");
  }

  private toggleWithReason(
    { focus = "first" }: CommandMenuButtonOpenOptions,
    reason: CommandMenuButtonEventReason
  ): void {
    if (this.isOpen) {
      this.closeWithReason({}, reason);
      return;
    }

    this.openWithReason({ focus }, reason);
  }

  refresh({ preserveFocus = false }: CommandMenuButtonRefreshOptions = {}): void {
    if (!this.initialized || this.destroying || this.destroyed) {
      return;
    }

    const focusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusedInsideMenu = Boolean(focusedElement && this.containsTarget(focusedElement));
    const previousActiveItem = this.activeItem;
    const previousTrigger = this.trigger;
    const previousMenu = this.menu;
    const previousSubmenuTrigger = this.openSubmenuTrigger;
    const previousSubmenus = [...this.submenus];
    const previousItems = this.getAllItems();
    const wasOpen = this.isOpen;

    this.clearTypeaheadTimeout();
    this.clearHoverTimeout();
    this.eventController?.abort();
    this.eventController = null;
    this.openSubmenuTrigger = null;
    this.teardownAnnouncementTarget();

    previousItems.forEach((item) => {
      this.removeManagedAttribute(item, "tabindex");
      item.classList.remove(CLASSES.active);
    });

    previousSubmenus.forEach(({ trigger, menu }) => {
      this.setManagedHidden(menu, true);
      this.setManagedAttribute(trigger, ATTRIBUTES.expanded, "false");
      this.removeManagedAttribute(trigger, ATTRIBUTES.submenuOpen);
    });

    this.trigger = this.root.querySelector<HTMLElement>(SELECTORS.trigger) ?? (this.trigger?.isConnected ? this.trigger : null);
    this.menu = this.root.querySelector<HTMLElement>(SELECTORS.menu) ?? (this.menu?.isConnected ? this.menu : null);

    if (!this.trigger || !this.menu) {
      const previousOpenSubmenu = previousSubmenus.find(
        ({ trigger }) => trigger === previousSubmenuTrigger
      );

      this.items = [];
      this.submenus = [];
      this.activeItem = null;
      this.isOpen = false;
      this.openEventController?.abort();
      this.openEventController = null;
      this.root.classList.remove(CLASSES.open);

      if (wasOpen && previousOpenSubmenu) {
        this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.submenuClose, {
          trigger: previousOpenSubmenu.trigger,
          submenu: previousOpenSubmenu.menu,
          reason: "refresh"
        });
      }

      if (wasOpen && previousTrigger && previousMenu) {
        this.setManagedHidden(previousMenu, true);
        this.setManagedAttribute(previousTrigger, ATTRIBUTES.expanded, "false");

        const focusTarget = previousTrigger.isConnected ? previousTrigger : null;
        focusTarget?.focus();
        this.lastFocusedElement = null;
        this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.close, {
          trigger: previousTrigger,
          menu: previousMenu,
          reason: "refresh"
        });
      }

      return;
    }

    this.collectItems();
    this.cleanupStaleSubmenuState(previousSubmenus);
    this.setupAria({ menuOpen: wasOpen });
    this.validateMarkupContract();
    this.setupFloatingLayers();
    this.setupAnnouncementTarget();
    this.pruneOriginalPositions();
    this.resetRovingTabindex();
    this.bindEventListeners();

    if (wasOpen) {
      this.updatePosition();
    }

    if (wasOpen && previousSubmenuTrigger && this.canOpenSubmenu(previousSubmenuTrigger)) {
      this.openSubmenu(previousSubmenuTrigger, { emit: false, focus: false, reason: "refresh" });
    }

    if (preserveFocus && (focusedInsideMenu || previousActiveItem)) {
      this.restoreFocusAfterRefresh(focusedElement, previousActiveItem);
    }
  }

  destroy(): void {
    if (this.closing) {
      this.destroyAfterClose = true;
      return;
    }

    if (this.destroying || this.destroyed) {
      return;
    }

    this.destroying = true;
    this.closeWithReason({ restoreFocus: false }, "destroy");
    this.eventController?.abort();
    this.eventController = null;
    this.openEventController?.abort();
    this.openEventController = null;
    this.clearTypeaheadTimeout();
    this.clearHoverTimeout();
    this.teardownAnnouncementTarget();
    this.restoreManagedDisabledStates();

    this.getAllItems().forEach((item) => {
      this.removeManagedAttribute(item, "tabindex");
      item.classList.remove(CLASSES.active);
    });

    this.root.classList.remove(CLASSES.initialized, CLASSES.open);
    this.restorePortalCustomProperties();
    this.restoreMovedElements();
    this.restoreManagedStyleProperties();
    this.restoreManagedAttributes();
    this.initialized = false;
    this.destroyed = true;
    this.destroying = false;
    A11yCommandMenuButton.instances.delete(this.root);
    this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.destroy);
  }

  private init(): void {
    if (this.initialized || !this.trigger || !this.menu) {
      return;
    }

    this.collectItems();
    this.setupAria();
    this.validateMarkupContract();
    this.setupFloatingLayers();
    this.setupAnnouncementTarget();
    this.resetRovingTabindex();
    this.bindEventListeners();

    this.root.classList.add(CLASSES.initialized);
    this.initialized = true;
    this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.init);
  }

  private bindEventListeners(): void {
    if (!this.trigger || !this.menu) {
      return;
    }

    this.eventController?.abort();
    this.eventController = new AbortController();
    const { signal } = this.eventController;

    this.trigger.addEventListener("click", this.boundOnTriggerClick, { signal });
    this.trigger.addEventListener("keydown", this.boundOnTriggerKeydown, { signal });
    this.menu.addEventListener("keydown", this.boundOnMenuKeydown, { signal });
    this.menu.addEventListener("click", this.boundOnMenuClick, { signal });

    if (this.options.hoverSubmenus) {
      this.menu.addEventListener("pointerover", this.boundOnMenuPointerOver, { signal });
      this.menu.addEventListener("pointerout", this.boundOnMenuPointerOut, { signal });
    }

    this.submenus.forEach(({ menu }) => {
      menu.addEventListener("keydown", this.boundOnMenuKeydown, { signal });
      menu.addEventListener("click", this.boundOnMenuClick, { signal });

      if (this.options.hoverSubmenus) {
        menu.addEventListener("pointerover", this.boundOnMenuPointerOver, { signal });
        menu.addEventListener("pointerout", this.boundOnMenuPointerOut, { signal });
      }
    });

    document.addEventListener("pointerdown", this.boundOnDocumentPointerDown, { signal });
    document.addEventListener("focusin", this.boundOnDocumentFocusIn, { signal });
  }

  private setupAria({ menuOpen = false }: { menuOpen?: boolean } = {}): void {
    if (!this.trigger || !this.menu) {
      return;
    }

    this.setManagedAttribute(this.root, ATTRIBUTES.mobileMode, this.options.mobileMode);
    this.setManagedAttribute(this.trigger, ATTRIBUTES.hasPopup, "menu");
    this.setManagedAttribute(
      this.trigger,
      ATTRIBUTES.expanded,
      menuOpen ? "true" : "false"
    );

    const triggerId = this.ensureManagedElementId(this.trigger, "command-menu-trigger");
    const menuId = this.ensureManagedElementId(this.menu, "command-menu");

    this.setManagedAttribute(this.trigger, ATTRIBUTES.controls, menuId);
    this.setManagedAttribute(this.menu, ATTRIBUTES.role, "menu");
    this.setManagedAttribute(this.menu, ATTRIBUTES.labelledBy, triggerId);
    this.setManagedAttribute(this.menu, ATTRIBUTES.mobileMode, this.options.mobileMode);
    this.setManagedHidden(this.menu, !menuOpen);

    this.submenus.forEach(({ trigger, menu }) => {
      this.setManagedAttribute(trigger, ATTRIBUTES.hasPopup, "menu");
      this.setManagedAttribute(trigger, ATTRIBUTES.expanded, "false");
      this.removeManagedAttribute(trigger, ATTRIBUTES.submenuOpen);

      const submenuTriggerId = this.ensureManagedElementId(
        trigger,
        "command-submenu-trigger"
      );
      const submenuId = this.ensureManagedElementId(menu, "command-submenu");

      this.setManagedAttribute(trigger, ATTRIBUTES.controls, submenuId);
      this.setManagedAttribute(menu, ATTRIBUTES.role, "menu");
      this.setManagedAttribute(menu, ATTRIBUTES.labelledBy, submenuTriggerId);
      this.setManagedAttribute(menu, ATTRIBUTES.mobileMode, this.options.mobileMode);
      this.setManagedHidden(menu, true);
    });
  }

  private validateMarkupContract(): void {
    if (this.trigger?.tagName !== "BUTTON") {
      console.warn("[A11yCommandMenuButton] Trigger must be a <button>.");
    }

    if (this.trigger && !hasUsableAccessibleName(this.trigger)) {
      console.warn(
        "[A11yCommandMenuButton] Trigger needs a usable accessible name. Add meaningful button text, aria-label, or aria-labelledby; icon-only labels such as '+' are not enough."
      );
    }

    this.getAllItems().forEach((item, index) => {
      if (!item.hasAttribute(ATTRIBUTES.commandId)) {
        this.setManagedAttribute(item, ATTRIBUTES.commandId, `command-${index + 1}`);
      }

      if (item.querySelector("button, a, input, select, textarea")) {
        console.warn("[A11yCommandMenuButton] Menu items must not contain nested interactive elements.");
      }
    });

    const commandIds = new Set<string>();
    this.getAllItems().forEach((item) => {
      const commandId = item.getAttribute(ATTRIBUTES.commandId);

      if (commandId && commandIds.has(commandId)) {
        console.warn(`[A11yCommandMenuButton] Duplicate data-command-id value: "${commandId}".`);
      }

      if (commandId) {
        commandIds.add(commandId);
      }
    });

    this.submenus.forEach(({ menu }) => {
      const nested = menu.querySelector(`${SELECTORS.submenu} ${SELECTORS.submenu}`);

      if (nested) {
        console.warn("[A11yCommandMenuButton] Only one-level submenus are supported.");
      }
    });
  }

  private setupFloatingLayers(): void {
    if (!this.menu) {
      return;
    }

    if (!this.options.portal) {
      this.submenus.forEach(({ menu }) => {
        if (menu.parentElement !== this.root) {
          this.moveElement(menu, this.root);
        }
      });
      return;
    }

    this.moveElement(this.menu, document.body);
    this.copyPortalCustomProperties(this.menu);
    this.submenus.forEach(({ menu }) => {
      this.moveElement(menu, document.body);
      this.copyPortalCustomProperties(menu);
    });
  }

  private cleanupStaleSubmenuState(previousSubmenus: CommandSubmenu[]): void {
    const currentTriggers = new Set(this.submenus.map(({ trigger }) => trigger));
    const currentMenus = new Set(this.submenus.map(({ menu }) => menu));

    previousSubmenus.forEach(({ trigger, menu }) => {
      if (!currentTriggers.has(trigger)) {
        [
          ATTRIBUTES.hasPopup,
          ATTRIBUTES.expanded,
          ATTRIBUTES.controls,
          ATTRIBUTES.submenuOpen
        ].forEach((attribute) => this.restoreManagedAttribute(trigger, attribute));
      }

      if (!currentMenus.has(menu)) {
        this.restorePortalCustomPropertiesForElement(menu);
        this.restoreMovedElement(menu);
        [
          ATTRIBUTES.hidden,
          ATTRIBUTES.role,
          ATTRIBUTES.labelledBy,
          ATTRIBUTES.mobileMode,
          "data-placement"
        ].forEach((attribute) => this.restoreManagedAttribute(menu, attribute));
        this.restoreManagedStylePropertiesForElement(menu);
      }
    });
  }

  private pruneOriginalPositions(): void {
    const managedElements = new Set<HTMLElement>(this.submenus.map(({ menu }) => menu));

    if (this.options.portal && this.menu) {
      managedElements.add(this.menu);
    }

    Array.from(this.originalPositions.keys()).forEach((element) => {
      if (!managedElements.has(element)) {
        this.originalPositions.delete(element);
      }
    });
  }

  private collectItems(): void {
    if (!this.menu) {
      return;
    }

    const allItems = Array.from(this.menu.querySelectorAll<HTMLElement>(SELECTORS.item));
    this.items = allItems.filter((item) => !item.closest(SELECTORS.submenu));

    this.submenus = this.items
      .filter((item) => item.matches(SELECTORS.submenuTrigger))
      .map((trigger) => {
        const submenuId = trigger.getAttribute(ATTRIBUTES.controls);
        const menu =
          (submenuId && this.findControlledSubmenu(submenuId)) ||
          trigger.parentElement?.querySelector<HTMLElement>(SELECTORS.submenu) ||
          null;
        const submenuItems = menu ? Array.from(menu.querySelectorAll<HTMLElement>(SELECTORS.item)) : [];

        menu?.querySelectorAll("ul, li").forEach((element) => this.normalizeStructuralRole(element));
        submenuItems.forEach((item) => this.normalizeItemRole(item));

        return { trigger, menu, items: submenuItems };
      })
      .filter((entry): entry is CommandSubmenu => entry.menu instanceof HTMLElement);

    this.menu.querySelectorAll("ul, li").forEach((element) => this.normalizeStructuralRole(element));

    this.items.forEach((item) => {
      this.normalizeItemRole(item);
    });

    this.syncClassDisabledStates();
  }

  private normalizeItemRole(item: HTMLElement): void {
    const role = item.getAttribute(ATTRIBUTES.role);

    if (!role || !SUPPORTED_ITEM_ROLES.has(role)) {
      this.setManagedAttribute(item, ATTRIBUTES.role, "menuitem");
    }
  }

  private normalizeStructuralRole(element: Element): void {
    if (
      element instanceof HTMLElement &&
      element.getAttribute(ATTRIBUTES.role) !== "group"
    ) {
      this.setManagedAttribute(element, ATTRIBUTES.role, "none");
    }
  }

  private findControlledSubmenu(id: string): HTMLElement | null {
    const selector = `#${escapeCssIdentifier(id)}`;
    const rootMatch = this.root.querySelector<HTMLElement>(selector);

    if (rootMatch?.matches(SELECTORS.submenu)) {
      return rootMatch;
    }

    const documentMatch = this.root.ownerDocument.getElementById(id);
    return documentMatch instanceof HTMLElement && documentMatch.matches(SELECTORS.submenu) ? documentMatch : null;
  }

  private openSubmenu(
    trigger: HTMLElement,
    {
      emit = true,
      focus = true,
      reason = "api"
    }: { emit?: boolean; focus?: boolean; reason?: CommandMenuButtonEventReason } = {}
  ): void {
    const submenu = this.submenus.find((entry) => entry.trigger === trigger);

    if (!submenu?.menu || this.destroying || this.destroyed) {
      return;
    }

    const isAlreadyOpen = !submenu.menu.hidden && trigger.getAttribute(ATTRIBUTES.expanded) === "true";

    if (isAlreadyOpen) {
      if (focus) {
        this.focusItem(this.getFocusableItems(submenu.items)[0]);
      }

      return;
    }

    if (this.openSubmenuTrigger && this.openSubmenuTrigger !== trigger) {
      this.closeSubmenu(this.openSubmenuTrigger, { reason });
    }

    this.openSubmenuTrigger = trigger;
    this.setManagedHidden(submenu.menu, false);
    this.setManagedAttribute(trigger, ATTRIBUTES.expanded, "true");
    this.setManagedAttribute(trigger, ATTRIBUTES.submenuOpen, "");

    this.updateSubmenuPosition(trigger, submenu.menu);

    if (focus) {
      const firstItem = this.getFocusableItems(submenu.items)[0];

      if (firstItem) {
        this.focusItem(firstItem);
      }
    }

    if (emit) {
      this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.submenuOpen, {
        trigger,
        submenu: submenu.menu,
        reason
      });
    }
  }

  private closeSubmenu(
    trigger: HTMLElement,
    {
      emit = true,
      reason = "api",
      returnFocus = false
    }: { emit?: boolean; reason?: CommandMenuButtonEventReason; returnFocus?: boolean } = {}
  ): void {
    const submenu = this.submenus.find((entry) => entry.trigger === trigger);

    if (
      !submenu?.menu ||
      (submenu.menu.hidden && trigger.getAttribute(ATTRIBUTES.expanded) !== "true")
    ) {
      return;
    }

    this.setManagedHidden(submenu.menu, true);
    this.setManagedAttribute(trigger, ATTRIBUTES.expanded, "false");
    this.removeManagedAttribute(trigger, ATTRIBUTES.submenuOpen);

    if (this.openSubmenuTrigger === trigger) {
      this.openSubmenuTrigger = null;
    }

    if (returnFocus) {
      this.focusItem(trigger);
    }

    if (emit) {
      this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.submenuClose, {
        trigger,
        submenu: submenu.menu,
        reason
      });
    }
  }

  private closeAllSubmenus(reason: CommandMenuButtonEventReason): void {
    this.submenus.forEach(({ trigger }) => {
      this.closeSubmenu(trigger, { reason });
    });
    this.openSubmenuTrigger = null;
  }

  private focusItem(item: HTMLElement | null | undefined): void {
    if (!item || !this.isItemFocusable(item)) {
      return;
    }

    this.getAllItems().forEach((candidate) => {
      candidate.classList.remove(CLASSES.active);

      if (this.isItemFocusable(candidate)) {
        this.setManagedAttribute(candidate, "tabindex", "-1");
      }
    });

    this.setManagedAttribute(item, "tabindex", "0");
    item.classList.add(CLASSES.active);
    item.focus();
    this.activeItem = item;
  }

  private focusFirstItem(): void {
    const first = this.getFocusableItems(this.items)[0];

    if (first) {
      this.focusItem(first);
    }
  }

  private focusLastItem(): void {
    const enabled = this.getFocusableItems(this.items);
    const last = enabled.at(-1);

    if (last) {
      this.focusItem(last);
    }
  }

  private activateItem(item: HTMLElement | null, originalEvent: Event): void {
    if (!item || !this.menu || !this.trigger) {
      return;
    }

    const context: CommandMenuButtonAnnouncementContext = {
      commandId: item.getAttribute(ATTRIBUTES.commandId),
      item,
      menu: this.menu,
      trigger: this.trigger,
      originalEvent
    };

    if (this.isItemLoading(item)) {
      this.announceStatus("loading", context);
      return;
    }

    if (this.isItemDisabled(item)) {
      this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.disabledCommand, {
        ...context
      });
      this.announceStatus("disabled", context);
      return;
    }

    if (item.matches(SELECTORS.submenuTrigger)) {
      this.openSubmenu(item, {
        reason: originalEvent instanceof KeyboardEvent ? "keyboard" : "pointer"
      });
      return;
    }

    const activationResult = applyCommandActivationAdapters(this.root, {
      ...context,
      root: this.root
    });

    this.dispatchMenuEvent(COMMAND_MENU_BUTTON_EVENTS.command, {
      ...context
    });
    this.announceStatus("command", context);

    if (this.options.closeOnSelect && !activationResult.preventClose) {
      this.closeWithReason({ restoreFocus: !(item instanceof HTMLAnchorElement) }, "command");
    }
  }

  private updatePosition(): void {
    if (!this.trigger || !this.menu || !this.isOpen) {
      return;
    }

    if (isMobileSheetMode(this.options)) {
      this.setManagedAttribute(this.menu, "data-placement", "bottom");
      this.removeManagedStyleProperty(this.menu, "--_command-menu-x");
      this.removeManagedStyleProperty(this.menu, "--_command-menu-y");
      return;
    }

    const triggerRect = this.trigger.getBoundingClientRect();

    this.setManagedStyleProperty(this.menu, "--_command-menu-x", "0px");
    this.setManagedStyleProperty(this.menu, "--_command-menu-y", "0px");
    const menuRect = this.menu.getBoundingClientRect();

    const spaceAbove = triggerRect.top - VIEWPORT_PADDING;
    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING;
    const placeBelow =
      this.options.placement === "bottom" ||
      (this.options.placement !== "top" && spaceAbove < menuRect.height && spaceBelow > spaceAbove);

    let top = placeBelow ? triggerRect.bottom : triggerRect.top - menuRect.height;
    let left = triggerRect.left;

    left = clamp(left, VIEWPORT_PADDING, window.innerWidth - menuRect.width - VIEWPORT_PADDING);
    top = clamp(top, VIEWPORT_PADDING, window.innerHeight - menuRect.height - VIEWPORT_PADDING);

    this.setManagedStyleProperty(this.menu, "--_command-menu-x", `${left}px`);
    this.setManagedStyleProperty(this.menu, "--_command-menu-y", `${top}px`);
    this.setManagedAttribute(
      this.menu,
      "data-placement",
      placeBelow ? "bottom" : "top"
    );
  }

  private updateSubmenuPosition(trigger: HTMLElement, submenu: HTMLElement): void {
    if (isMobileSheetMode(this.options)) {
      this.setManagedAttribute(submenu, "data-placement", "bottom");
      this.removeManagedStyleProperty(submenu, "--_command-submenu-x");
      this.removeManagedStyleProperty(submenu, "--_command-submenu-y");
      return;
    }

    this.setManagedStyleProperty(submenu, "--_command-submenu-x", "0px");
    this.setManagedStyleProperty(submenu, "--_command-submenu-y", "0px");

    const triggerRect = trigger.getBoundingClientRect();
    const submenuRect = submenu.getBoundingClientRect();
    const direction = getComputedStyle(this.root).direction || "ltr";
    const defaultSide = direction === "rtl" ? "left" : "right";
    const spaceRight = window.innerWidth - triggerRect.right - VIEWPORT_PADDING;
    const spaceLeft = triggerRect.left - VIEWPORT_PADDING;
    const placeLeft =
      this.options.submenuPlacement === "left" ||
      (this.options.submenuPlacement === "auto" &&
        ((defaultSide === "right" && spaceRight < submenuRect.width && spaceLeft > spaceRight) ||
          (defaultSide === "left" && spaceLeft >= submenuRect.width)));

    let left = placeLeft ? triggerRect.left - submenuRect.width : triggerRect.right;
    let top = triggerRect.top;

    left = clamp(left, VIEWPORT_PADDING, window.innerWidth - submenuRect.width - VIEWPORT_PADDING);
    top = clamp(top, VIEWPORT_PADDING, window.innerHeight - submenuRect.height - VIEWPORT_PADDING);

    this.setManagedStyleProperty(submenu, "--_command-submenu-x", `${left}px`);
    this.setManagedStyleProperty(submenu, "--_command-submenu-y", `${top}px`);
    this.setManagedAttribute(
      submenu,
      "data-placement",
      placeLeft ? "left" : "right"
    );
  }

  private onTriggerClick(): void {
    this.toggleWithReason({ focus: "first" }, "trigger");
  }

  private onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case KEYS.enter:
      case KEYS.space:
      case KEYS.arrowDown:
        event.preventDefault();
        this.openWithReason({ focus: "first" }, "keyboard");
        break;
      case KEYS.arrowUp:
        event.preventDefault();
        this.openWithReason({ focus: "last" }, "keyboard");
        break;
      case KEYS.escape:
        if (this.isOpen) {
          event.preventDefault();
          this.closeWithReason({}, "escape");
        }
        break;
      default:
        break;
    }
  }

  private onMenuKeydown(event: KeyboardEvent): void {
    const { key } = event;
    const targetItem = getClosestElement(event.target, SELECTORS.item);

    if (key === KEYS.tab) {
      const adjacentTabStop = this.getAdjacentTabStop(event.shiftKey ? -1 : 1);

      if (adjacentTabStop) {
        event.preventDefault();
      }

      this.closeWithReason({ restoreFocus: false }, "tab");
      adjacentTabStop?.focus();
      return;
    }

    if (key === KEYS.escape) {
      event.preventDefault();
      this.closeWithReason({}, "escape");
      return;
    }

    if (!targetItem) {
      return;
    }

    const targetSubmenu = targetItem.closest(SELECTORS.submenu);
    const inSubmenu = Boolean(targetSubmenu);
    const scopedItems = inSubmenu ? this.getSubmenuItems(targetSubmenu) : this.items;
    const enabledItems = this.getFocusableItems(scopedItems);

    if (!enabledItems.length) {
      return;
    }

    const currentIndex = enabledItems.indexOf(targetItem);

    if (key === KEYS.arrowDown) {
      event.preventDefault();
      const nextIndex = this.getNextIndex(currentIndex, enabledItems.length);
      this.focusItem(enabledItems[nextIndex]);
    } else if (key === KEYS.arrowUp) {
      event.preventDefault();
      const previousIndex = this.getPreviousIndex(currentIndex, enabledItems.length);
      this.focusItem(enabledItems[previousIndex]);
    } else if (key === KEYS.home) {
      event.preventDefault();
      this.focusItem(enabledItems[0]);
    } else if (key === KEYS.end) {
      event.preventDefault();
      this.focusItem(enabledItems.at(-1));
    } else if (key === KEYS.enter || key === KEYS.space) {
      if (this.isNavigableAnchor(targetItem)) {
        if (key === KEYS.space) {
          event.preventDefault();
          targetItem.click();
        }

        return;
      }

      event.preventDefault();
      this.activateItem(targetItem, event);
    } else if (this.isForwardSubmenuKey(key) && this.canOpenSubmenu(targetItem)) {
      event.preventDefault();
      this.openSubmenu(targetItem, { reason: "keyboard" });
    } else if (this.isBackwardSubmenuKey(key) && inSubmenu) {
      event.preventDefault();
      const parentTrigger = this.findParentTrigger(targetSubmenu);

      if (parentTrigger) {
        this.closeSubmenu(parentTrigger, { reason: "keyboard", returnFocus: true });
      }
    } else if (this.options.typeahead && key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      this.handleTypeahead(key, enabledItems);
    }
  }

  private onMenuClick(event: MouseEvent): void {
    const item = getClosestElement(event.target, SELECTORS.item);

    if (!item) {
      return;
    }

    if (!this.isNavigableAnchor(item)) {
      event.preventDefault();
    }

    if (item.matches(SELECTORS.submenuTrigger)) {
      if (!this.canOpenSubmenu(item)) {
        this.activateItem(item, event);
        return;
      }

      if (item.getAttribute(ATTRIBUTES.expanded) === "true") {
        this.closeSubmenu(item, { reason: "pointer", returnFocus: true });
      } else {
        this.openSubmenu(item, { reason: "pointer" });
      }
      return;
    }

    this.activateItem(item, event);
  }

  private onMenuPointerOver(event: PointerEvent): void {
    if (event.pointerType === "touch") {
      return;
    }

    const item = getClosestElement(event.target, SELECTORS.item);

    if (this.findTriggerForSubmenuTarget(event.target)) {
      this.clearHoverTimeout();
      return;
    }

    if (!item || !this.canOpenSubmenu(item) || item.getAttribute(ATTRIBUTES.expanded) === "true") {
      return;
    }

    this.queueHoverAction(
      () => this.openSubmenu(item, { focus: false, reason: "hover" }),
      this.options.hoverOpenDelay
    );
  }

  private onMenuPointerOut(event: PointerEvent): void {
    if (event.pointerType === "touch") {
      return;
    }

    const item = getClosestElement(event.target, SELECTORS.submenuTrigger) ?? this.findTriggerForSubmenuTarget(event.target);

    if (!item || item.getAttribute(ATTRIBUTES.expanded) !== "true") {
      return;
    }

    const nextTarget = event.relatedTarget;
    const submenu = this.submenus.find((entry) => entry.trigger === item);

    if (nextTarget instanceof Node && (item.contains(nextTarget) || submenu?.menu.contains(nextTarget))) {
      return;
    }

    this.queueHoverAction(
      () => this.closeSubmenu(item, { reason: "hover" }),
      this.options.hoverCloseDelay
    );
  }

  private queueHoverAction(action: () => void, delay: number): void {
    this.clearHoverTimeout();

    this.hoverTimeoutId = window.setTimeout(() => {
      action();
      this.hoverTimeoutId = null;
    }, delay);
  }

  private onDocumentPointerDown(event: PointerEvent): void {
    if (!this.isOpen) {
      return;
    }

    if (!this.containsTarget(event.target)) {
      this.closeWithReason({ restoreFocus: false }, "pointer-outside");
    }
  }

  private onDocumentFocusIn(event: FocusEvent): void {
    if (!this.isOpen) {
      return;
    }

    if (!this.containsTarget(event.target)) {
      this.closeWithReason({ restoreFocus: false }, "focus-outside");
    }
  }

  private onWindowResize(): void {
    if (!this.isOpen) {
      return;
    }

    this.updatePosition();

    if (this.openSubmenuTrigger) {
      const submenu = this.submenus.find((entry) => entry.trigger === this.openSubmenuTrigger);

      if (submenu?.menu) {
        this.updateSubmenuPosition(this.openSubmenuTrigger, submenu.menu);
      }
    }
  }

  private onWindowScroll(event: Event): void {
    if (!this.isOpen) {
      return;
    }

    const { target } = event;
    if (!target || target === document || target === document.documentElement || target === document.body) {
      this.closeWithReason({}, "scroll");
      return;
    }

    if (!this.containsTarget(target)) {
      this.closeWithReason({}, "scroll");
    }
  }

  private handleTypeahead(character: string, enabledItems: HTMLElement[]): void {
    this.typeaheadBuffer = `${this.typeaheadBuffer}${character.toLowerCase()}`;
    this.clearTypeaheadTimeout();

    this.typeaheadTimeoutId = window.setTimeout(() => {
      this.typeaheadBuffer = "";
      this.typeaheadTimeoutId = null;
    }, TYPEAHEAD_RESET_DELAY);

    const searchBuffer = this.getTypeaheadSearchBuffer();
    const startIndex = this.getTypeaheadStartIndex(enabledItems, searchBuffer);
    const orderedItems = [...enabledItems.slice(startIndex), ...enabledItems.slice(0, startIndex)];
    const matchedItem = orderedItems.find((item) => item.textContent?.trim().toLowerCase().startsWith(searchBuffer));

    if (matchedItem) {
      this.focusItem(matchedItem);
    }
  }

  private getTypeaheadSearchBuffer(): string {
    if (this.typeaheadBuffer.length > 1 && new Set(this.typeaheadBuffer).size === 1) {
      return this.typeaheadBuffer[0] ?? this.typeaheadBuffer;
    }

    return this.typeaheadBuffer;
  }

  private getTypeaheadStartIndex(enabledItems: HTMLElement[], searchBuffer: string): number {
    if (searchBuffer !== this.typeaheadBuffer || searchBuffer.length === 1) {
      const activeIndex = this.activeItem ? enabledItems.indexOf(this.activeItem) : -1;
      return activeIndex === -1 ? 0 : (activeIndex + 1) % enabledItems.length;
    }

    return 0;
  }

  private containsTarget(target: EventTarget | null): boolean {
    if (!this.trigger || !this.menu || !(target instanceof Node)) {
      return false;
    }

    if (this.trigger.contains(target) || this.menu.contains(target)) {
      return true;
    }

    return this.submenus.some(({ menu }) => menu.contains(target));
  }

  private restoreFocusAfterRefresh(
    focusedElement: HTMLElement | null,
    previousActiveItem: HTMLElement | null
  ): void {
    const trigger = this.trigger;

    if (trigger && focusedElement === trigger && trigger.isConnected) {
      trigger.focus();
      return;
    }

    const previousCommandId =
      this.getCommandId(focusedElement) ?? this.getCommandId(previousActiveItem);
    const target =
      this.getRetainedFocusableItem(focusedElement) ??
      this.getRetainedFocusableItem(previousActiveItem) ??
      this.findFocusableItemByCommandId(previousCommandId) ??
      this.getRefreshFallbackItem(focusedElement ?? previousActiveItem);

    if (target) {
      this.openParentSubmenuForItem(target);
      this.focusItem(target);
      return;
    }

    if (this.trigger?.isConnected) {
      this.trigger.focus();
    }
  }

  private getCommandId(item: HTMLElement | null): string | null {
    return item?.matches(SELECTORS.item) ? item.getAttribute(ATTRIBUTES.commandId) : null;
  }

  private getRetainedFocusableItem(item: HTMLElement | null): HTMLElement | null {
    if (!item || !item.matches(SELECTORS.item) || !this.getAllItems().includes(item)) {
      return null;
    }

    return this.isItemFocusable(item) ? item : null;
  }

  private findFocusableItemByCommandId(commandId: string | null): HTMLElement | null {
    if (!commandId) {
      return null;
    }

    return this.getAllItems().find((item) => item.getAttribute(ATTRIBUTES.commandId) === commandId && this.isItemFocusable(item)) ?? null;
  }

  private getRefreshFallbackItem(previousItem: HTMLElement | null): HTMLElement | null {
    const previousSubmenuId = previousItem?.closest(SELECTORS.submenu)?.id;

    if (previousSubmenuId) {
      const submenu = this.submenus.find(({ menu }) => menu.id === previousSubmenuId);
      const submenuFallback = submenu ? this.getFocusableItems(submenu.items)[0] : null;

      if (submenuFallback) {
        return submenuFallback;
      }
    }

    return this.getFocusableItems(this.items)[0] ?? this.getFocusableItems(this.getAllItems())[0] ?? null;
  }

  private openParentSubmenuForItem(item: HTMLElement): void {
    if (!this.isOpen) {
      return;
    }

    const submenu = this.submenus.find(({ items }) => items.includes(item));

    if (submenu && submenu.menu.hidden && this.canOpenSubmenu(submenu.trigger)) {
      this.openSubmenu(submenu.trigger, { focus: false, reason: "refresh" });
    }
  }

  private dispatchMenuEvent<Name extends CommandMenuButtonEventName>(
    name: Name,
    ...[detail]: keyof CommandMenuButtonEventExtraDetail<Name> extends never
      ? [detail?: CommandMenuButtonEventExtraDetail<Name>]
      : [detail: CommandMenuButtonEventExtraDetail<Name>]
  ): void {
    const eventDetail = {
      instance: this,
      root: this.root,
      ...(detail ?? {})
    } as unknown as CommandMenuButtonEventDetailMap[Name];

    this.root.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        cancelable: false,
        composed: false,
        detail: eventDetail
      })
    );
  }

  private setupAnnouncementTarget(): void {
    this.announcementVersion += 1;
    this.announcementTargetOriginalAttributes.clear();
    this.announcementTarget = null;
    this.announcementTargetInitialText = "";
    this.lastAnnouncement = "";

    if (!this.options.announce) {
      return;
    }

    const target = this.resolveAnnouncementTarget(this.options.announce.target);

    if (!target) {
      return;
    }

    this.announcementTarget = target;
    this.announcementTargetInitialText = target.textContent ?? "";
    this.setAnnouncementAttributeIfMissing(ATTRIBUTES.role, "status");
    this.setAnnouncementAttributeIfMissing(ATTRIBUTES.live, "polite");
    this.setAnnouncementAttributeIfMissing(ATTRIBUTES.atomic, "true");
  }

  private resolveAnnouncementTarget(target: HTMLElement | string): HTMLElement | null {
    if (target instanceof HTMLElement) {
      return target;
    }

    try {
      const scopedTarget = this.root.matches(target)
        ? this.root
        : this.root.querySelector<HTMLElement>(target) ?? this.root.ownerDocument.querySelector<HTMLElement>(target);

      if (scopedTarget instanceof HTMLElement) {
        return scopedTarget;
      }
    } catch {
      console.warn("[A11yCommandMenuButton] Announcement target selector is invalid.");
      return null;
    }

    console.warn("[A11yCommandMenuButton] Announcement target was not found.");
    return null;
  }

  private setAnnouncementAttributeIfMissing(name: string, value: string): void {
    if (!this.announcementTarget || this.announcementTarget.hasAttribute(name)) {
      return;
    }

    this.announcementTargetOriginalAttributes.set(name, null);
    this.announcementTarget.setAttribute(name, value);
  }

  private teardownAnnouncementTarget(): void {
    this.announcementVersion += 1;

    if (!this.announcementTarget) {
      return;
    }

    this.announcementTargetOriginalAttributes.forEach((value, name) => {
      if (value === null) {
        const currentValue = this.announcementTarget?.getAttribute(name);
        const managedValue =
          name === ATTRIBUTES.role ? "status" : name === ATTRIBUTES.live ? "polite" : name === ATTRIBUTES.atomic ? "true" : null;

        if (currentValue === managedValue) {
          this.announcementTarget?.removeAttribute(name);
        }

        return;
      }

      this.announcementTarget?.setAttribute(name, value);
    });

    if (
      this.lastAnnouncement &&
      (this.announcementTarget.textContent === this.lastAnnouncement || this.announcementTarget.textContent === "")
    ) {
      this.announcementTarget.textContent = this.announcementTargetInitialText;
    }

    this.announcementTargetOriginalAttributes.clear();
    this.announcementTarget = null;
    this.announcementTargetInitialText = "";
    this.lastAnnouncement = "";
  }

  private announceStatus(
    type: "command" | "disabled" | "loading",
    context: CommandMenuButtonAnnouncementContext
  ): void {
    if (!this.options.announce || !this.announcementTarget) {
      return;
    }

    const formatter =
      type === "command"
        ? this.options.announce.formatCommand
        : type === "disabled"
          ? this.options.announce.formatDisabled
          : this.options.announce.formatLoading;

    const fallback =
      type === "command"
        ? formatDefaultCommandAnnouncement(context)
        : type === "disabled"
          ? formatDefaultDisabledAnnouncement(context)
          : formatDefaultLoadingAnnouncement(context);

    let message: string | null = null;

    try {
      message = normalizeAnnouncementText(formatter ? formatter(context) : fallback);
    } catch (error) {
      console.warn("[A11yCommandMenuButton] Announcement formatter failed.", error);
      return;
    }

    if (!message) {
      return;
    }

    const target = this.announcementTarget;
    const announcementVersion = ++this.announcementVersion;

    this.lastAnnouncement = message;

    if (target.textContent !== message) {
      target.textContent = message;
      return;
    }

    target.textContent = "";
    queueMicrotask(() => {
      if (
        this.announcementTarget === target &&
        this.announcementVersion === announcementVersion &&
        this.lastAnnouncement === message
      ) {
        target.textContent = message;
      }
    });
  }

  private resetRovingTabindex(): void {
    this.getAllItems().forEach((item) => {
      item.classList.remove(CLASSES.active);

      if (!this.isItemFocusable(item)) {
        this.removeManagedAttribute(item, "tabindex");
        return;
      }

      this.setManagedAttribute(item, "tabindex", "-1");
    });

    this.activeItem = null;
  }

  private getAllItems(): HTMLElement[] {
    return [...this.items, ...this.submenus.flatMap((submenu) => submenu.items)];
  }

  private getFocusableItems(items: HTMLElement[]): HTMLElement[] {
    return items.filter((item) => this.isItemFocusable(item));
  }

  private isItemFocusable(item: HTMLElement): boolean {
    return !item.hasAttribute(ATTRIBUTES.disabled);
  }

  private isItemLoading(item: HTMLElement): boolean {
    return item.hasAttribute("data-command-loading") || item.getAttribute(ATTRIBUTES.busy) === "true";
  }

  private isItemDisabled(item: HTMLElement): boolean {
    return (
      item.hasAttribute(ATTRIBUTES.disabled) ||
      item.getAttribute("aria-disabled") === "true" ||
      item.classList.contains(CLASSES.disabled)
    );
  }

  private canOpenSubmenu(item: HTMLElement): boolean {
    return item.matches(SELECTORS.submenuTrigger) && !this.isItemDisabled(item) && !this.isItemLoading(item);
  }

  private isNavigableAnchor(item: HTMLElement): item is HTMLAnchorElement {
    return (
      item instanceof HTMLAnchorElement &&
      item.hasAttribute("href") &&
      !item.matches(SELECTORS.submenuTrigger) &&
      !this.isItemDisabled(item) &&
      !this.isItemLoading(item)
    );
  }

  private getAdjacentTabStop(direction: -1 | 1): HTMLElement | null {
    if (!this.trigger) {
      return null;
    }

    const tabbableElements = Array.from(
      this.root.ownerDocument.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)
    ).filter((element) => {
      if (
        !element.isConnected ||
        element.closest("[hidden], [inert]") ||
        element.getAttribute("aria-hidden") === "true"
      ) {
        return false;
      }

      return element === this.trigger || !this.containsTarget(element);
    });
    const triggerIndex = tabbableElements.indexOf(this.trigger);

    if (triggerIndex === -1) {
      return null;
    }

    return tabbableElements[triggerIndex + direction] ?? null;
  }

  private syncClassDisabledStates(): void {
    const currentItems = new Set(this.getAllItems());

    this.managedAriaDisabledItems.forEach((_originalValue, item) => {
      if (!currentItems.has(item) || !item.classList.contains(CLASSES.disabled)) {
        this.restoreManagedDisabledState(item);
      }
    });

    currentItems.forEach((item) => {
      if (!item.classList.contains(CLASSES.disabled) || item.hasAttribute(ATTRIBUTES.disabled)) {
        return;
      }

      if (!this.managedAriaDisabledItems.has(item)) {
        this.managedAriaDisabledItems.set(item, item.getAttribute("aria-disabled"));
      }

      item.setAttribute("aria-disabled", "true");
    });
  }

  private restoreManagedDisabledState(item: HTMLElement): void {
    if (!this.managedAriaDisabledItems.has(item)) {
      return;
    }

    const originalValue = this.managedAriaDisabledItems.get(item);

    if (item.getAttribute("aria-disabled") === "true") {
      if (originalValue === null || originalValue === undefined) {
        item.removeAttribute("aria-disabled");
      } else {
        item.setAttribute("aria-disabled", originalValue);
      }
    }

    this.managedAriaDisabledItems.delete(item);
  }

  private restoreManagedDisabledStates(): void {
    Array.from(this.managedAriaDisabledItems.keys()).forEach((item) => {
      this.restoreManagedDisabledState(item);
    });
  }

  private rememberAttribute(element: HTMLElement, name: string): void {
    const attributes =
      this.originalAttributes.get(element) ?? new Map<string, string | null>();

    if (!attributes.has(name)) {
      attributes.set(name, element.getAttribute(name));
      this.originalAttributes.set(element, attributes);
    }
  }

  private setManagedAttribute(element: HTMLElement, name: string, value: string): void {
    this.rememberAttribute(element, name);
    element.setAttribute(name, value);
  }

  private removeManagedAttribute(element: HTMLElement, name: string): void {
    this.rememberAttribute(element, name);
    element.removeAttribute(name);
  }

  private setManagedHidden(element: HTMLElement, hidden: boolean): void {
    this.rememberAttribute(element, ATTRIBUTES.hidden);
    element.hidden = hidden;
  }

  private ensureManagedElementId(element: HTMLElement, prefix: string): string {
    if (!element.id) {
      this.setManagedAttribute(element, "id", createUniqueId(prefix));
    }

    return element.id;
  }

  private restoreManagedAttribute(element: HTMLElement, name: string): void {
    const attributes = this.originalAttributes.get(element);

    if (!attributes?.has(name)) {
      return;
    }

    const value = attributes.get(name);

    if (value === null || value === undefined) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }

    attributes.delete(name);

    if (attributes.size === 0) {
      this.originalAttributes.delete(element);
    }
  }

  private restoreManagedAttributes(): void {
    Array.from(this.originalAttributes.entries()).forEach(([element, attributes]) => {
      Array.from(attributes.keys()).forEach((name) => {
        this.restoreManagedAttribute(element, name);
      });
    });
  }

  private rememberStyleProperty(element: HTMLElement, property: string): void {
    const properties =
      this.originalStyleProperties.get(element) ??
      new Map<string, OriginalStyleProperty>();

    if (!properties.has(property)) {
      properties.set(property, {
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property)
      });
      this.originalStyleProperties.set(element, properties);
    }
  }

  private setManagedStyleProperty(
    element: HTMLElement,
    property: string,
    value: string
  ): void {
    this.rememberStyleProperty(element, property);
    element.style.setProperty(property, value);
  }

  private removeManagedStyleProperty(element: HTMLElement, property: string): void {
    this.rememberStyleProperty(element, property);
    element.style.removeProperty(property);
  }

  private restoreManagedStylePropertiesForElement(element: HTMLElement): void {
    const properties = this.originalStyleProperties.get(element);

    properties?.forEach(({ value, priority }, property) => {
      if (value) {
        element.style.setProperty(property, value, priority);
      } else {
        element.style.removeProperty(property);
      }
    });

    this.originalStyleProperties.delete(element);
  }

  private restoreManagedStyleProperties(): void {
    Array.from(this.originalStyleProperties.keys()).forEach((element) => {
      this.restoreManagedStylePropertiesForElement(element);
    });
  }

  private getSubmenuItems(submenuElement: Element | null): HTMLElement[] {
    const submenu = this.submenus.find((entry) => entry.menu === submenuElement);
    return submenu ? submenu.items : [];
  }

  private findTriggerForSubmenuTarget(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Node)) {
      return null;
    }

    return this.submenus.find((entry) => entry.menu.contains(target))?.trigger ?? null;
  }

  private findParentTrigger(submenuElement: Element | null): HTMLElement | null {
    const submenu = this.submenus.find((entry) => entry.menu === submenuElement);
    return submenu ? submenu.trigger : null;
  }

  private isForwardSubmenuKey(key: string): boolean {
    const direction = getComputedStyle(this.root).direction || "ltr";
    return direction === "rtl" ? key === KEYS.arrowLeft : key === KEYS.arrowRight;
  }

  private isBackwardSubmenuKey(key: string): boolean {
    const direction = getComputedStyle(this.root).direction || "ltr";
    return direction === "rtl" ? key === KEYS.arrowRight : key === KEYS.arrowLeft;
  }

  private getNextIndex(currentIndex: number, length: number): number {
    if (currentIndex === -1) {
      return 0;
    }

    if (currentIndex + 1 >= length) {
      return this.options.loop ? 0 : currentIndex;
    }

    return currentIndex + 1;
  }

  private getPreviousIndex(currentIndex: number, length: number): number {
    if (currentIndex === -1) {
      return length - 1;
    }

    if (currentIndex - 1 < 0) {
      return this.options.loop ? length - 1 : currentIndex;
    }

    return currentIndex - 1;
  }

  private moveElement(element: HTMLElement, parent: Node): void {
    if (!this.originalPositions.has(element) && element.parentNode) {
      this.originalPositions.set(element, {
        parent: element.parentNode,
        nextSibling: element.nextSibling
      });
    }

    parent.appendChild(element);
  }

  private copyPortalCustomProperties(element: HTMLElement): void {
    const computedRootStyle = getComputedStyle(this.root);

    if (!this.portalOriginalStyleProperties.has(element)) {
      const originalProperties = new Map<string, OriginalStyleProperty>();

      PORTAL_CUSTOM_PROPERTIES.forEach((property) => {
        originalProperties.set(property, {
          value: element.style.getPropertyValue(property),
          priority: element.style.getPropertyPriority(property)
        });
      });
      this.portalOriginalStyleProperties.set(element, originalProperties);
    }

    PORTAL_CUSTOM_PROPERTIES.forEach((property) => {
      const value = computedRootStyle.getPropertyValue(property).trim();

      if (value) {
        element.style.setProperty(property, value);
      }
    });
  }

  private restorePortalCustomProperties(): void {
    Array.from(this.portalOriginalStyleProperties.keys()).forEach((element) => {
      this.restorePortalCustomPropertiesForElement(element);
    });
  }

  private restorePortalCustomPropertiesForElement(element: HTMLElement): void {
    const properties = this.portalOriginalStyleProperties.get(element);

    properties?.forEach(({ value, priority }, property) => {
      if (value) {
        element.style.setProperty(property, value, priority);
      } else {
        element.style.removeProperty(property);
      }
    });

    this.portalOriginalStyleProperties.delete(element);
  }

  private restoreMovedElements(): void {
    Array.from(this.originalPositions.keys())
      .reverse()
      .forEach((element) => this.restoreMovedElement(element));
  }

  private restoreMovedElement(element: HTMLElement): void {
    const position = this.originalPositions.get(element);

    if (!position) {
      return;
    }

    if (position.nextSibling?.parentNode === position.parent) {
      position.parent.insertBefore(element, position.nextSibling);
    } else {
      position.parent.appendChild(element);
    }

    this.originalPositions.delete(element);
  }

  private clearTypeaheadTimeout(): void {
    if (this.typeaheadTimeoutId !== null) {
      window.clearTimeout(this.typeaheadTimeoutId);
      this.typeaheadTimeoutId = null;
    }
  }

  private clearHoverTimeout(): void {
    if (this.hoverTimeoutId !== null) {
      window.clearTimeout(this.hoverTimeoutId);
      this.hoverTimeoutId = null;
    }
  }
}

export function createCommandMenuButton(
  root: HTMLElement,
  options: CommandMenuButtonOptions = {}
): CommandMenuButtonInstance {
  return new A11yCommandMenuButton(root, options);
}

export function initCommandMenuButtons(
  options: CommandMenuButtonOptions = {},
  root: ParentNode = document
): CommandMenuButtonInstance[] {
  return Array.from(root.querySelectorAll<HTMLElement>(SELECTORS.root)).map((element) =>
    createCommandMenuButton(element, options)
  );
}
