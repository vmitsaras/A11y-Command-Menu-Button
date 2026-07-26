export interface CommandActivationContext {
  commandId: string | null;
  item: HTMLElement;
  menu: HTMLElement;
  originalEvent: Event;
  root: HTMLElement;
  trigger: HTMLElement;
}

export interface CommandActivationResult {
  preventClose?: boolean;
}

export type CommandActivationAdapter = (
  context: CommandActivationContext
) => CommandActivationResult | void;

const adapters = new WeakMap<HTMLElement, Set<CommandActivationAdapter>>();

export function registerCommandActivationAdapter(
  root: HTMLElement,
  adapter: CommandActivationAdapter
): () => void {
  const rootAdapters = adapters.get(root) ?? new Set<CommandActivationAdapter>();
  rootAdapters.add(adapter);
  adapters.set(root, rootAdapters);

  return () => {
    rootAdapters.delete(adapter);

    if (rootAdapters.size === 0) {
      adapters.delete(root);
    }
  };
}

export function applyCommandActivationAdapters(
  root: HTMLElement,
  context: CommandActivationContext
): CommandActivationResult {
  let preventClose = false;

  adapters.get(root)?.forEach((adapter) => {
    preventClose ||= adapter(context)?.preventClose === true;
  });

  return { preventClose };
}
