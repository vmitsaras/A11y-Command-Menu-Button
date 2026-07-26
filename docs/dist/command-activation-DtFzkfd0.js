//#region src/internal/command-activation.ts
const adapters = /* @__PURE__ */ new WeakMap();
function registerCommandActivationAdapter(root, adapter) {
	const rootAdapters = adapters.get(root) ?? /* @__PURE__ */ new Set();
	rootAdapters.add(adapter);
	adapters.set(root, rootAdapters);
	return () => {
		rootAdapters.delete(adapter);
		if (rootAdapters.size === 0) adapters.delete(root);
	};
}
function applyCommandActivationAdapters(root, context) {
	let preventClose = false;
	adapters.get(root)?.forEach((adapter) => {
		preventClose ||= adapter(context)?.preventClose === true;
	});
	return { preventClose };
}
//#endregion
export { registerCommandActivationAdapter as n, applyCommandActivationAdapters as t };

//# sourceMappingURL=command-activation-DtFzkfd0.js.map