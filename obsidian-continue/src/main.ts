import { App, MarkdownView, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';

export interface ContinuePluginSettings {
    openAIApiKey: string;
}

const DEFAULT_SETTINGS: ContinuePluginSettings = {
    openAIApiKey: ''
};

export default class ContinuePlugin extends Plugin {
    settings: ContinuePluginSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'continue-selection',
            name: 'Continue Selection with AI',
            editorCallback: (editor) => this.continueSelection(editor.getSelection()).then(result => {
                if (result) {
                    const cursor = editor.getCursor();
                    editor.replaceRange(result, cursor);
                }
            })
        });

        this.addSettingTab(new ContinueSettingTab(this.app, this));
    }

    onunload() {}

    async continueSelection(text: string): Promise<string | null> {
        if (!this.settings.openAIApiKey || !text) return null;

        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.openAIApiKey}`
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: text,
                max_tokens: 100
            })
        });

        if (!response.ok) return null;
        const json = await response.json();
        return json.choices?.[0]?.text?.trim() ?? null;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ContinueSettingTab extends PluginSettingTab {
    plugin: ContinuePlugin;

    constructor(app: App, plugin: ContinuePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Continue Plugin Settings' });

        new Setting(containerEl)
            .setName('OpenAI API Key')
            .setDesc('API key used for generating continuations')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openAIApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.openAIApiKey = value.trim();
                    await this.plugin.saveSettings();
                }));
    }
}
