/** Modular and optimized plugin entry point */
import { Plugin, TFile, TAbstractFile, Notice, debounce, normalizePath, View } from 'obsidian';
import { TutuSettingTab, DEFAULT_SETTINGS } from './settings';
import { TutuSettings } from './core/types';
import { TutuAPIClient } from './infrastructure/TutuAPIClient';
import { ArticleManager } from './services/ArticleManager';
import { ActionModal } from './ui/ActionModal';
import { AttachmentService } from './services/AttachmentService';

interface ObsidianView extends View {
    addAction: (icon: string, title: string, callback: (evt: MouseEvent) => void) => HTMLElement;
}

export default class TutuPublisherPlugin extends Plugin {
    settings!: TutuSettings;
    apiClient!: TutuAPIClient;
    articleManager!: ArticleManager;
    
    private activeButtons: Map<string, HTMLElement> = new Map();
    private debouncedFileCheck!: (file: TAbstractFile) => void;

    async onload() {
        await this.loadSettings();

        this.apiClient = new TutuAPIClient(this.settings);
        const attachmentService = new AttachmentService(this.app);
        this.articleManager = new ArticleManager(
            this.app,
            this.apiClient,
            this.settings,
            attachmentService
        );

        this.addSettingTab(new TutuSettingTab(this.app, this));

        this.debouncedFileCheck = debounce(async (file: TAbstractFile) => {
            if (file instanceof TFile && this.isInWatchedFolder(file.path)) {
                try {
                    await this.articleManager.initializeFileProperties(file);
                } catch (err) {
                    console.error(`Tutu Beans: ${err instanceof Error ? err.message : String(err)}`);
                }
            }
        }, 1000, true);

        this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.updateHeaderButtons()));
        this.registerEvent(this.app.vault.on('create', this.debouncedFileCheck));
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
            this.debouncedFileCheck(file);
            if (this.app.workspace.getActiveFile()?.path === file.path) {
                this.updateHeaderButtons();
            }
        }));

        const openSyncModal = async () => {
            const { SyncModal } = await import('./ui/SyncModal');
            new SyncModal(this.app, this).open();
        };

        this.addRibbonIcon('sprout', 'Global Synchronization (Tutu)', openSyncModal);
        this.addCommand({
            id: 'open-tutu-sync-panel',
            name: 'Open Global Synchronization Panel',
            callback: openSyncModal
        });
    }

    onunload() {
        this.activeButtons.forEach(btn => btn.remove());
        this.activeButtons.clear();
    }

    private isInWatchedFolder(path: string): boolean {
        const watched = normalizePath(this.settings.watchedFolder);
        if (!watched || watched === '/') return true;
        const normalizedPath = normalizePath(path);
        return normalizedPath.startsWith(watched + '/') || normalizedPath === watched;
    }

    private updateHeaderButtons() {
        const activeFile = this.app.workspace.getActiveFile();
        const leaf = this.app.workspace.getLeaf(false);
        const view = leaf.view as ObsidianView;

        if (!view || !view.containerEl) return;

        const viewId = (leaf as any).id;
        const hasButton = this.activeButtons.has(viewId);
        const shouldHaveButton = activeFile && this.isInWatchedFolder(activeFile.path);

        if (shouldHaveButton && !hasButton) {
            const btn = view.addAction('bean', 'Manage Article (Tutu)', () => this.handleActionFlow());
            btn.addClass('tutu-bean-button');
            this.activeButtons.set(viewId, btn);
        } else if (!shouldHaveButton && hasButton) {
            this.activeButtons.get(viewId)?.remove();
            this.activeButtons.delete(viewId);
        }
    }

    async handleActionFlow() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("No file currently open.");
            return;
        }

        const fileCache = this.app.metadataCache.getFileCache(activeFile);
        const uuid = fileCache?.frontmatter?.['tutu-uuid'];

        if (!uuid) {
            new Notice("UUID not found. Is the file in the watched folder?");
            return;
        }

        const status = await this.apiClient.getStatus(uuid);
        if (!status) return;

        new ActionModal(
            this.app,
            status,
            () => this.articleManager.sendToBackend(activeFile),
            () => this.articleManager.deleteFromBackend(activeFile)
        ).open();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}