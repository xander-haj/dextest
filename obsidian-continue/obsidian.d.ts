declare module 'obsidian' {
  export class App {}
  export class Plugin {
    app: App;
    addCommand(options: any): void;
    addSettingTab(tab: any): void;
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
  }
  export class MarkdownView {}
  export class Modal {}
}

interface HTMLElement {
  empty(): void;
  createEl(tag: string, options?: any): HTMLElement;
}
