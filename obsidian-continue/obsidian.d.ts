declare module 'obsidian' {
  export class App {
    workspace: Workspace;
  }

  export class Workspace {
    getLeavesOfType(viewType: string): WorkspaceLeaf[];
    getRightLeaf(force?: boolean): WorkspaceLeaf;
    revealLeaf(leaf: WorkspaceLeaf): void;
    getActiveViewOfType<T>(type: any): T | null;
  }

  export class Vault {
    read(file: TFile): Promise<string>;
  }

  export class WorkspaceLeaf {
    setViewState(state: any): Promise<void>;
    detach(): void;
  }

  export class ItemView {
    containerEl: HTMLElement;
    leaf: WorkspaceLeaf;
    constructor(leaf: WorkspaceLeaf);
    getViewType(): string;
    getDisplayText(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
  }

  export class MarkdownView extends ItemView {
    editor: Editor;
  }

  export class Editor {
    getSelection(): string;
    replaceRange(text: string, from: any, to?: any): void;
    getCursor(): any;
    getValue(): string;
  }

  export class Plugin {
    app: App;
    addCommand(options: any): void;
    addSettingTab(tab: PluginSettingTab): void;
    registerView(type: string, viewCreator: (leaf: WorkspaceLeaf) => ItemView): void;
    loadData?(): Promise<any>;
    saveData?(data: any): Promise<void>;
  }

  export class PluginSettingTab {
    plugin: Plugin;
    containerEl: HTMLElement;
    constructor(app: App, plugin: Plugin);
    display(): void;
  }

  export class Setting {
    constructor(containerEl: HTMLElement);
    setName(name: string): this;
    setDesc(desc: string): this;
    addText(cb: (el: any) => any): this;
    addTextArea?(cb: (el: any) => any): this;
    addButton?(cb: (el: any) => any): this;
  }

  export class Modal {
    containerEl: HTMLElement;
    open(): void;
    close(): void;
  }

  export class TFile {
    path: string;
  }
}

interface HTMLElement {
  empty(): void;
  createEl(tag: string, options?: any): HTMLElement;
  addClass?(cls: string): void;
  appendText?(text: string): void;
}
