/** Global synchronization modal optimized with in-memory caching */
import { App, Modal, TFile, Notice, setIcon } from 'obsidian';
import TutuPublisherPlugin from '../main';
import { RemoteNote, SyncData } from '../core/types';

type TabType = 'remoteOnly' | 'synced' | 'localOnly';

export class SyncModal extends Modal {
    private activeTab: TabType = 'synced';
    private data: SyncData | null = null;
    private listContainerEl!: HTMLElement;
    private tabContainerEl!: HTMLElement;

    constructor(app: App, private plugin: TutuPublisherPlugin) {
        super(app);
    }

    async onOpen() {
        this.modalEl.addClass('tutu-sync-modal-native');
        this.setupLayout();
        await this.refreshData();
    }

    private setupLayout() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h1', { text: 'Note Synchronization', cls: 'tutu-native-title' });
        this.tabContainerEl = contentEl.createDiv({ cls: 'tutu-nav-tabs' });
        this.listContainerEl = contentEl.createDiv({ cls: 'tutu-native-scroll-area' });
    }

    private async refreshData() {
        this.listContainerEl.empty();
        const loading = this.listContainerEl.createDiv({ cls: 'tutu-loading-container' });
        loading.createEl('span', { text: 'Syncing with server...' });

        this.data = await this.getSyncData();
        
        if (!this.data) {
            this.listContainerEl.empty();
            this.listContainerEl.createEl('p', { text: 'Failed to load sync data.', cls: 'tutu-error-msg' });
            return;
        }

        this.renderTabs();
        this.renderActiveList();
    }

    private renderTabs() {
        this.tabContainerEl.empty();
        const tabs: { id: TabType; label: string; count: number }[] = [
            { id: 'synced', label: 'Synced', count: this.data?.synced.length ?? 0 },
            { id: 'localOnly', label: 'Not Published', count: this.data?.localOnly.length ?? 0 },
            { id: 'remoteOnly', label: 'Remote Only', count: this.data?.remoteOnly.length ?? 0 },
        ];

        tabs.forEach(({ id, label, count }) => {
            const tabEl = this.tabContainerEl.createDiv({
                cls: `tutu-nav-tab ${this.activeTab === id ? 'is-active' : ''}`,
                text: `${label} (${count})`
            });

            tabEl.onClickEvent(() => {
                if (this.activeTab === id) return;
                this.activeTab = id;
                this.renderTabs();
                this.renderActiveList();
            });
        });
    }

    private renderActiveList() {
        const container = this.listContainerEl;
        container.empty();

        if (!this.data) return;

        const tabConfig = {
            remoteOnly: { items: this.data.remoteOnly, icon: 'trash', isRemoteOnly: true },
            synced: { items: this.data.synced.map(s => s.file), icon: 'check-circle', isRemoteOnly: false },
            localOnly: { items: this.data.localOnly, icon: 'file-plus', isRemoteOnly: false }
        }[this.activeTab];

        if (tabConfig.items.length === 0) {
            container.createDiv({ text: 'Nothing to show here.', cls: 'tutu-empty-state' });
            return;
        }

        const listWrapper = container.createDiv({ cls: 'tutu-native-list' });

        tabConfig.items.forEach(item => {
            const row = listWrapper.createDiv({ cls: 'tutu-list-item' });
            const info = row.createDiv({ cls: 'tutu-item-info' });
            
            setIcon(info.createSpan({ cls: 'tutu-item-icon' }), tabConfig.icon);

            if (tabConfig.isRemoteOnly) {
                const note = item as RemoteNote;
                info.createEl('span', { text: note.title, cls: 'tutu-item-name' });
                
                const actionBtn = row.createDiv({ cls: 'tutu-item-action-delete' });
                setIcon(actionBtn, 'trash');
                actionBtn.onClickEvent(async (e) => {
                    e.stopPropagation();
                    if (await this.plugin.apiClient.deleteArticle(note.uuid)) {
                        new Notice(`Removed: ${note.title}`);
                        await this.refreshData();
                    }
                });
            } else {
                const file = item as TFile;
                info.createEl('span', { text: file.basename, cls: 'tutu-item-name' });
                row.onClickEvent(() => {
                    this.app.workspace.getLeaf(false).openFile(file);
                    this.close();
                });
            }
        });
    }

    private async getSyncData(): Promise<SyncData | null> {
        try {
            const remoteNotes = await this.plugin.apiClient.listAllRemoteNotes();
            if (!remoteNotes) return null;

            const watchedPath = this.plugin.settings.watchedFolder;
            const localFiles = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(watchedPath));
            
            const remoteMap = new Map(remoteNotes.map(n => [n.uuid, n]));
            const remoteOnlyMap = new Map(remoteMap);

            const synced: { uuid: string; file: TFile }[] = [];
            const localOnly: TFile[] = [];

            for (const file of localFiles) {
                const uuid = this.app.metadataCache.getFileCache(file)?.frontmatter?.['tutu-uuid'];
                
                if (uuid && remoteMap.has(uuid)) {
                    synced.push({ uuid, file });
                    remoteOnlyMap.delete(uuid);
                } else {
                    localOnly.push(file);
                }
            }

            return { 
                remoteOnly: Array.from(remoteOnlyMap.values()), 
                localOnly, 
                synced 
            };
        } catch (e) {
            console.error("Sync Error:", e);
            return null;
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}