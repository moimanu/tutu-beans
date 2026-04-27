/** Tutu Beans plugin configuration settings */
import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import TutuPublisherPlugin from './main';
import { TutuSettings } from './core/types';

export const DEFAULT_SETTINGS: TutuSettings = {
    baseUrl: 'your-site.com/api',
    useBaseUrl: true,
    endpoint: '/receive-note.php',
    endpointDelete: '/delete-note.php',
    endpointStatus: '/status-note.php',
    endpointList: '/list-notes.php',
    token: '',
    watchedFolder: 'Posts',
    defaultAuthor: 'Your Name',
};

export class TutuSettingTab extends PluginSettingTab {
    plugin: TutuPublisherPlugin;

    constructor(app: App, plugin: TutuPublisherPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const headerContainer = containerEl.createDiv({ cls: 'tutu-header-container' });
        const iconSpan = headerContainer.createSpan({ cls: 'tutu-settings-icon' });
        setIcon(iconSpan, 'bean');

        headerContainer.createDiv({ text: 'Tutu Beans', cls: 'tutu-settings-title' });
        containerEl.createEl('hr');

        containerEl.createEl('h3', { text: 'Base URL' });

        new Setting(containerEl)
            .setName('Use Base URL')
            .setDesc('Enable to prefix all endpoints with a base domain.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useBaseUrl)
                .onChange(async (value) => {
                    this.plugin.settings.useBaseUrl = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.useBaseUrl) {
            new Setting(containerEl)
                .setName('Base URL')
                .setDesc('Example: https://myblog.com/api')
                .addText(text => text
                    .setPlaceholder('https://myblog.com/api')
                    .setValue(this.plugin.settings.baseUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.baseUrl = value.trim().replace(/\/$/, "");
                        await this.plugin.saveSettings();
                    }));
        }

        containerEl.createEl('p', {
            text: 'The plugin enforces HTTPS for all external connections to ensure data security, allowing HTTP only for loopback addresses (localhost/127.0.0.1) for local development and testing purposes.',
            cls: 'tutu-settings-info'
        });

        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: 'Endpoint Configuration' });

        const createEndpointSetting = (name: string, desc: string, key: keyof TutuSettings) => {
            new Setting(containerEl)
                .setName(name)
                .setDesc(desc)
                .addText(text => text
                    .setValue(String(this.plugin.settings[key]))
                    .onChange(async (value) => {
                        const val = value.trim();
                        (this.plugin.settings[key] as string) = val;
                        await this.plugin.saveSettings();
                    }));
        };

        createEndpointSetting('Publish Endpoint (POST)', 'Relative path or full URL', 'endpoint');
        createEndpointSetting('Status Endpoint (GET)', 'Relative path or full URL', 'endpointStatus');
        createEndpointSetting('Delete Endpoint (DELETE)', 'Relative path or full URL', 'endpointDelete');
        createEndpointSetting('List Endpoint (GET)', 'Relative path or full URL', 'endpointList');

        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: 'Security' });

        new Setting(containerEl)
            .setName('Bearer Token')
            .setDesc('Authentication token for secure API communication.')
            .addText(text => {
                text.setPlaceholder('Enter your token')
                    .setValue(this.plugin.settings.token)
                    .onChange(async (value) => {
                        this.plugin.settings.token = value.trim();
                        await this.plugin.saveSettings();
                    });
                text.inputEl.setAttribute('type', 'password');
            });

        containerEl.createEl('p', {
            text: '⚠️ Settings and tokens are stored locally. Be careful when syncing or versioning this Vault to avoid exposing sensitive data.',
            cls: 'tutu-settings-warning'
        });

        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: 'Preferences' });

        new Setting(containerEl)
            .setName('Watched Folder')
            .setDesc('The folder monitored by the plugin to manage properties automatically.')
            .addText(text => text
                .setPlaceholder('Ex: Posts')
                .setValue(this.plugin.settings.watchedFolder)
                .onChange(async (value) => {
                    this.plugin.settings.watchedFolder = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Author')
            .setDesc('Name automatically filled in the tutu-autor field.')
            .addText(text => text
                .setPlaceholder('Your Name')
                .setValue(this.plugin.settings.defaultAuthor)
                .onChange(async (value) => {
                    this.plugin.settings.defaultAuthor = value.trim();
                    await this.plugin.saveSettings();
                }));
    }
}