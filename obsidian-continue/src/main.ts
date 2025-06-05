import { App, MarkdownView, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf } from 'obsidian';

export interface ContinuePluginSettings {
    apiKey: string;
    baseUrl: string;
    model: string;
    maxTokens: number;
    temperature: number;
}

const DEFAULT_SETTINGS: ContinuePluginSettings = {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    maxTokens: 300,
    temperature: 0.5
};

const VIEW_TYPE = 'continue-assistant-view';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export default class ContinuePlugin extends Plugin {
    settings: ContinuePluginSettings;

    async onload() {
        await this.loadSettings();
        this.registerView(VIEW_TYPE, (leaf) => new ContinueView(leaf, this));
        this.addCommand({
            id: 'open-continue-assistant',
            name: 'Open Continue Assistant',
            callback: () => this.activateView()
        });
        this.addSettingTab(new ContinueSettingTab(this.app, this));
    }

    onunload() {
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach(l => l.detach());
    }

    async activateView() {
        let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
        if (!leaf) {
            leaf = this.app.workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE, active: true });
        }
        this.app.workspace.revealLeaf(leaf);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class ContinueView extends ItemView {
    plugin: ContinuePlugin;
    messages: ChatMessage[] = [];
    messagesEl!: HTMLElement;
    inputEl!: HTMLTextAreaElement;
    sendBtn!: HTMLButtonElement;

    constructor(leaf: WorkspaceLeaf, plugin: ContinuePlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() { return VIEW_TYPE; }
    getDisplayText() { return 'Continue Assistant'; }

    async onOpen() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('continue-assistant');

        this.messagesEl = containerEl.createEl('div', { cls: 'continue-messages' });
        const inputContainer = containerEl.createEl('div', { cls: 'continue-input' });
        this.inputEl = inputContainer.createEl('textarea') as HTMLTextAreaElement;
        this.sendBtn = inputContainer.createEl('button', { text: 'Send' }) as HTMLButtonElement;
        this.sendBtn.addEventListener('click', () => this.handleSend());
    }

    async handleSend() {
        const content = this.inputEl.value.trim();
        if (!content) return;
        this.inputEl.value = '';

        this.addMessage('user', content);

        const note = this.plugin.app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView | null;
        let noteContent = '';
        if (note) noteContent = note.editor.getValue();

        const contextMsg: ChatMessage = { role: 'system', content: `Current note:\n${noteContent}` };
        const messages = [contextMsg, ...this.messages];
        const assistantEl = this.addMessage('assistant', '');
        const index = this.messages.length - 1;

        await this.streamChat(messages, assistantEl, (delta) => {
            this.messages[index].content += delta;
        });
    }

    addMessage(role: 'user' | 'assistant', content: string): HTMLElement {
        const wrapper = this.messagesEl.createEl('div', { cls: `msg ${role}` });
        const textEl = wrapper.createEl('div', { text: content, cls: 'text' });
        if (role === 'assistant') {
            const insertBtn = wrapper.createEl('button', { text: 'Insert' });
            insertBtn.addEventListener('click', () => {
                const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView) as MarkdownView | null;
                if (view) {
                    const cursor = view.editor.getCursor();
                    view.editor.replaceRange(this.messages[this.messages.length-1].content, cursor);
                }
            });
        }
        this.messages.push({ role, content });
        return textEl;
    }

    async streamChat(messages: ChatMessage[], outputEl: HTMLElement, onDelta: (d: string) => void) {
        const { apiKey, baseUrl, model, maxTokens, temperature } = this.plugin.settings;
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature,
                stream: true
            })
        });
        const reader = response.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder('utf-8');
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                const m = line.trim();
                if (!m) continue;
                if (m === 'data: [DONE]') return;
                if (m.startsWith('data: ')) {
                    const data = JSON.parse(m.substring(6));
                    const delta = data.choices[0].delta?.content;
                    if (delta) {
                        outputEl.appendText(delta);
                        onDelta(delta);
                    }
                }
            }
        }
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
        containerEl.createEl('h2', { text: 'Continue Assistant Settings' });

        new Setting(containerEl)
            .setName('API Key')
            .setDesc('OpenAI or compatible API key')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async value => {
                    this.plugin.settings.apiKey = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Base URL')
            .setDesc('API endpoint URL')
            .addText(text => text
                .setPlaceholder('https://api.openai.com/v1/chat/completions')
                .setValue(this.plugin.settings.baseUrl)
                .onChange(async value => {
                    this.plugin.settings.baseUrl = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Model')
            .setDesc('Model name to use')
            .addText(text => text
                .setValue(this.plugin.settings.model)
                .onChange(async value => {
                    this.plugin.settings.model = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Tokens')
            .addText(text => text
                .setValue(String(this.plugin.settings.maxTokens))
                .onChange(async value => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num)) this.plugin.settings.maxTokens = num;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Temperature')
            .addText(text => text
                .setValue(String(this.plugin.settings.temperature))
                .onChange(async value => {
                    const num = parseFloat(value);
                    if (!isNaN(num)) this.plugin.settings.temperature = num;
                    await this.plugin.saveSettings();
                }));
    }
}
