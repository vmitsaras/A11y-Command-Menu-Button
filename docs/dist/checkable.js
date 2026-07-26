import { n as registerCommandActivationAdapter } from "./command-activation-DtFzkfd0.js";
//#region src/checkable.ts
const CHECKABLE_ITEM_SELECTOR = "[data-command-item][role=\"menuitemcheckbox\"], [data-command-item][role=\"menuitemradio\"]";
const DESTROY_EVENT = "a11y-command-menu:destroy";
const instances = /* @__PURE__ */ new WeakMap();
function getCheckableRole(item) {
	const role = item.getAttribute("role");
	return role === "menuitemcheckbox" || role === "menuitemradio" ? role : null;
}
function getCheckedState(item, role) {
	const checked = item.getAttribute("aria-checked");
	if (checked === "true" || checked === "false" || role === "menuitemcheckbox" && checked === "mixed") return checked;
	return null;
}
var CheckableCommandAdapterInstance = class {
	root;
	eventController = new AbortController();
	unregisterActivationAdapter;
	destroyed = false;
	constructor(root) {
		this.root = root;
		this.unregisterActivationAdapter = registerCommandActivationAdapter(root, this.handleCommandActivation.bind(this));
		root.addEventListener(DESTROY_EVENT, () => this.destroy(), { signal: this.eventController.signal });
		this.refresh();
	}
	refresh() {
		if (this.destroyed) return;
		this.getCheckableItems().forEach((item) => this.validateItem(item));
	}
	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		this.unregisterActivationAdapter?.();
		this.unregisterActivationAdapter = null;
		this.eventController.abort();
		instances.delete(this.root);
	}
	handleCommandActivation({ item }) {
		if (this.destroyed) return;
		const role = getCheckableRole(item);
		if (!role) return;
		const checked = getCheckedState(item, role);
		if (!checked) {
			this.warnInvalidCheckedState(item, role);
			return { preventClose: true };
		}
		if (role === "menuitemcheckbox") {
			item.setAttribute("aria-checked", checked === "true" ? "false" : "true");
			return { preventClose: true };
		}
		const group = item.closest("[role=\"group\"]");
		if (!group) {
			this.warnMissingRadioGroup(item);
			return { preventClose: true };
		}
		group.querySelectorAll("[data-command-item][role=\"menuitemradio\"]").forEach((peer) => {
			if (peer.closest("[role=\"group\"]") === group && getCheckedState(peer, "menuitemradio")) peer.setAttribute("aria-checked", peer === item ? "true" : "false");
		});
		return { preventClose: true };
	}
	validateItem(item) {
		const role = getCheckableRole(item);
		if (!role) return;
		if (!getCheckedState(item, role)) this.warnInvalidCheckedState(item, role);
		if (role === "menuitemradio" && !item.closest("[role=\"group\"]")) this.warnMissingRadioGroup(item);
	}
	getCheckableItems() {
		const scopes = /* @__PURE__ */ new Set([this.root]);
		const menuId = this.root.querySelector("[data-command-trigger]")?.getAttribute("aria-controls");
		const menu = menuId ? this.root.ownerDocument.getElementById(menuId) : null;
		if (menu) {
			scopes.add(menu);
			menu.querySelectorAll("[data-command-submenu-trigger][aria-controls]").forEach((trigger) => {
				const submenuId = trigger.getAttribute("aria-controls");
				const submenu = submenuId ? this.root.ownerDocument.getElementById(submenuId) : null;
				if (submenu) scopes.add(submenu);
			});
		}
		return Array.from(new Set(Array.from(scopes).flatMap((scope) => Array.from(scope.querySelectorAll(CHECKABLE_ITEM_SELECTOR)))));
	}
	warnInvalidCheckedState(item, role) {
		console.warn(`[A11yCommandMenuButton] ${role} commands require aria-checked=${role === "menuitemcheckbox" ? "\"false\", \"mixed\", or \"true\"" : "\"false\" or \"true\""}.`, item);
	}
	warnMissingRadioGroup(item) {
		console.warn("[A11yCommandMenuButton] menuitemradio commands require an explicit ancestor with role=\"group\".", item);
	}
};
function createCheckableCommandAdapter(root) {
	const existing = instances.get(root);
	if (existing) return existing;
	const instance = new CheckableCommandAdapterInstance(root);
	instances.set(root, instance);
	return instance;
}
//#endregion
export { createCheckableCommandAdapter };

//# sourceMappingURL=checkable.js.map