//#region src/checkable.d.ts
type CheckableCommandRole = "menuitemcheckbox" | "menuitemradio";
type CheckableCommandState = "false" | "mixed" | "true";
interface CheckableCommandAdapter {
  refresh(): void;
  destroy(): void;
}
declare function createCheckableCommandAdapter(root: HTMLElement): CheckableCommandAdapter;
//#endregion
export { CheckableCommandAdapter, CheckableCommandRole, CheckableCommandState, createCheckableCommandAdapter };
//# sourceMappingURL=checkable.d.ts.map