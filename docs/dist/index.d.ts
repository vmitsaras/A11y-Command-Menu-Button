//#region src/index.d.ts
type CommandMenuButtonPlacement = "auto" | "top" | "bottom";
type CommandMenuButtonSubmenuPlacement = "auto" | "left" | "right";
type CommandMenuButtonMobileMode = "sheet" | "menu";
type CommandMenuButtonFocusTarget = "first" | "last" | false;
type CommandMenuButtonAnnouncementResult = string | false | null | undefined;
interface CommandMenuButtonAnnouncementContext {
  commandId: string | null;
  item: HTMLElement;
  menu: HTMLElement;
  trigger: HTMLElement;
  originalEvent: Event;
}
type CommandMenuButtonAnnouncementFormatter = (context: CommandMenuButtonAnnouncementContext) => CommandMenuButtonAnnouncementResult;
interface CommandMenuButtonAnnouncementOptions {
  target: HTMLElement | string;
  formatCommand?: CommandMenuButtonAnnouncementFormatter;
  formatDisabled?: CommandMenuButtonAnnouncementFormatter;
  formatLoading?: CommandMenuButtonAnnouncementFormatter;
}
interface CommandMenuButtonOptions {
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
interface CommandMenuButtonOpenOptions {
  focus?: CommandMenuButtonFocusTarget;
}
interface CommandMenuButtonCloseOptions {
  restoreFocus?: boolean;
}
interface CommandMenuButtonRefreshOptions {
  preserveFocus?: boolean;
}
interface CommandMenuButtonInstance {
  open(options?: CommandMenuButtonOpenOptions): void;
  close(options?: CommandMenuButtonCloseOptions): void;
  toggle(options?: CommandMenuButtonOpenOptions): void;
  refresh(options?: CommandMenuButtonRefreshOptions): void;
  destroy(): void;
}
type CommandMenuButtonEventReason = "api" | "command" | "destroy" | "escape" | "focus-outside" | "hover" | "keyboard" | "pointer" | "pointer-outside" | "refresh" | "scroll" | "tab" | "trigger" | (string & {});
declare const COMMAND_MENU_BUTTON_EVENTS: Readonly<{
  init: "a11y-command-menu:init";
  open: "a11y-command-menu:open";
  close: "a11y-command-menu:close";
  command: "a11y-command-menu:command";
  disabledCommand: "a11y-command-menu:disabled-command";
  submenuOpen: "a11y-command-menu:submenu-open";
  submenuClose: "a11y-command-menu:submenu-close";
  destroy: "a11y-command-menu:destroy";
}>;
interface CommandMenuButtonEventBaseDetail {
  instance: CommandMenuButtonInstance;
  root: HTMLElement;
}
interface CommandMenuButtonStateEventDetail extends CommandMenuButtonEventBaseDetail {
  trigger: HTMLElement;
  menu: HTMLElement;
  reason: CommandMenuButtonEventReason;
}
interface CommandMenuButtonCommandEventDetail extends CommandMenuButtonEventBaseDetail, CommandMenuButtonAnnouncementContext {}
interface CommandMenuButtonSubmenuEventDetail extends CommandMenuButtonEventBaseDetail {
  trigger: HTMLElement;
  submenu: HTMLElement;
  reason: CommandMenuButtonEventReason;
}
interface CommandMenuButtonEventDetailMap {
  [COMMAND_MENU_BUTTON_EVENTS.init]: CommandMenuButtonEventBaseDetail;
  [COMMAND_MENU_BUTTON_EVENTS.open]: CommandMenuButtonStateEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.close]: CommandMenuButtonStateEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.command]: CommandMenuButtonCommandEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.disabledCommand]: CommandMenuButtonCommandEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.submenuOpen]: CommandMenuButtonSubmenuEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.submenuClose]: CommandMenuButtonSubmenuEventDetail;
  [COMMAND_MENU_BUTTON_EVENTS.destroy]: CommandMenuButtonEventBaseDetail;
}
type CommandMenuButtonEventName = keyof CommandMenuButtonEventDetailMap;
type CommandMenuButtonEvent<Name extends CommandMenuButtonEventName> = CustomEvent<CommandMenuButtonEventDetailMap[Name]>;
type CommandMenuButtonEventMap = { [Name in CommandMenuButtonEventName]: CommandMenuButtonEvent<Name>; };
declare class A11yCommandMenuButton implements CommandMenuButtonInstance {
  private static readonly instances;
  private readonly root;
  private options;
  private trigger;
  private menu;
  private items;
  private submenus;
  private isOpen;
  private activeItem;
  private openSubmenuTrigger;
  private lastFocusedElement;
  private typeaheadBuffer;
  private typeaheadTimeoutId;
  private hoverTimeoutId;
  private eventController;
  private openEventController;
  private initialized;
  private closing;
  private destroyAfterClose;
  private destroying;
  private destroyed;
  private readonly originalPositions;
  private readonly portalOriginalStyleProperties;
  private readonly originalAttributes;
  private readonly originalStyleProperties;
  private announcementTarget;
  private announcementTargetInitialText;
  private lastAnnouncement;
  private announcementVersion;
  private readonly announcementTargetOriginalAttributes;
  private readonly managedAriaDisabledItems;
  private readonly boundOnTriggerClick;
  private readonly boundOnTriggerKeydown;
  private readonly boundOnMenuKeydown;
  private readonly boundOnMenuClick;
  private readonly boundOnMenuPointerOver;
  private readonly boundOnMenuPointerOut;
  private readonly boundOnDocumentPointerDown;
  private readonly boundOnDocumentFocusIn;
  private readonly boundOnWindowResize;
  private readonly boundOnWindowScroll;
  constructor(root: HTMLElement, options?: CommandMenuButtonOptions);
  open({ focus }?: CommandMenuButtonOpenOptions): void;
  private openWithReason;
  close({ restoreFocus }?: CommandMenuButtonCloseOptions): void;
  private closeWithReason;
  toggle({ focus }?: CommandMenuButtonOpenOptions): void;
  private toggleWithReason;
  refresh({ preserveFocus }?: CommandMenuButtonRefreshOptions): void;
  destroy(): void;
  private init;
  private bindEventListeners;
  private setupAria;
  private validateMarkupContract;
  private setupFloatingLayers;
  private cleanupStaleSubmenuState;
  private pruneOriginalPositions;
  private collectItems;
  private normalizeItemRole;
  private normalizeStructuralRole;
  private findControlledSubmenu;
  private openSubmenu;
  private closeSubmenu;
  private closeAllSubmenus;
  private focusItem;
  private focusFirstItem;
  private focusLastItem;
  private activateItem;
  private updatePosition;
  private updateSubmenuPosition;
  private onTriggerClick;
  private onTriggerKeydown;
  private onMenuKeydown;
  private onMenuClick;
  private onMenuPointerOver;
  private onMenuPointerOut;
  private queueHoverAction;
  private onDocumentPointerDown;
  private onDocumentFocusIn;
  private onWindowResize;
  private onWindowScroll;
  private handleTypeahead;
  private getTypeaheadSearchBuffer;
  private getTypeaheadStartIndex;
  private containsTarget;
  private restoreFocusAfterRefresh;
  private getCommandId;
  private getRetainedFocusableItem;
  private findFocusableItemByCommandId;
  private getRefreshFallbackItem;
  private openParentSubmenuForItem;
  private dispatchMenuEvent;
  private setupAnnouncementTarget;
  private resolveAnnouncementTarget;
  private setAnnouncementAttributeIfMissing;
  private teardownAnnouncementTarget;
  private announceStatus;
  private resetRovingTabindex;
  private getAllItems;
  private getFocusableItems;
  private isItemFocusable;
  private isItemLoading;
  private isItemDisabled;
  private canOpenSubmenu;
  private isNavigableAnchor;
  private getAdjacentTabStop;
  private syncClassDisabledStates;
  private restoreManagedDisabledState;
  private restoreManagedDisabledStates;
  private rememberAttribute;
  private setManagedAttribute;
  private removeManagedAttribute;
  private setManagedHidden;
  private ensureManagedElementId;
  private restoreManagedAttribute;
  private restoreManagedAttributes;
  private rememberStyleProperty;
  private setManagedStyleProperty;
  private removeManagedStyleProperty;
  private restoreManagedStylePropertiesForElement;
  private restoreManagedStyleProperties;
  private getSubmenuItems;
  private findTriggerForSubmenuTarget;
  private findParentTrigger;
  private isForwardSubmenuKey;
  private isBackwardSubmenuKey;
  private getNextIndex;
  private getPreviousIndex;
  private moveElement;
  private copyPortalCustomProperties;
  private restorePortalCustomProperties;
  private restorePortalCustomPropertiesForElement;
  private restoreMovedElements;
  private restoreMovedElement;
  private clearTypeaheadTimeout;
  private clearHoverTimeout;
}
declare function createCommandMenuButton(root: HTMLElement, options?: CommandMenuButtonOptions): CommandMenuButtonInstance;
declare function initCommandMenuButtons(options?: CommandMenuButtonOptions, root?: ParentNode): CommandMenuButtonInstance[];
//#endregion
export { A11yCommandMenuButton, COMMAND_MENU_BUTTON_EVENTS, CommandMenuButtonAnnouncementContext, CommandMenuButtonAnnouncementFormatter, CommandMenuButtonAnnouncementOptions, CommandMenuButtonAnnouncementResult, CommandMenuButtonCloseOptions, CommandMenuButtonCommandEventDetail, CommandMenuButtonEvent, CommandMenuButtonEventBaseDetail, CommandMenuButtonEventDetailMap, CommandMenuButtonEventMap, CommandMenuButtonEventName, CommandMenuButtonEventReason, CommandMenuButtonFocusTarget, CommandMenuButtonInstance, CommandMenuButtonMobileMode, CommandMenuButtonOpenOptions, CommandMenuButtonOptions, CommandMenuButtonPlacement, CommandMenuButtonRefreshOptions, CommandMenuButtonStateEventDetail, CommandMenuButtonSubmenuEventDetail, CommandMenuButtonSubmenuPlacement, createCommandMenuButton, initCommandMenuButtons };
//# sourceMappingURL=index.d.ts.map