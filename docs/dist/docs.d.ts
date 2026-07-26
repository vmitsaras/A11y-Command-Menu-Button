//#region src/docs.d.ts
interface PluginDocs {
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
declare const docs: {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repo: string;
  npm: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: string;
  selectors: string[];
  keyboard: {
    key: string;
    description: string;
  }[];
  api: {
    name: string;
    type: string;
    description: string;
  }[];
  events: ({
    name: "a11y-command-menu:init";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  } | {
    name: "a11y-command-menu:open";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  } | {
    name: "a11y-command-menu:close";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  } | {
    name: "a11y-command-menu:command";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  } | {
    name: "a11y-command-menu:disabled-command";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  } | {
    name: "a11y-command-menu:submenu-open";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  } | {
    name: "a11y-command-menu:submenu-close";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  } | {
    name: "a11y-command-menu:destroy";
    detail: string;
    description: string;
    bubbles: true;
    composed: false;
    cancelable: false;
  })[];
  examples: {
    name: string;
    description: string;
    path: string;
  }[];
};
//#endregion
export { PluginDocs, docs };
//# sourceMappingURL=docs.d.ts.map