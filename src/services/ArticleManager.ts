/** Article lifecycle manager (Optimized I/O) */
import { App, TFile, Notice } from 'obsidian';
import { TutuAPIClient } from '../infrastructure/TutuAPIClient';
import { TutuSettings } from '../core/types';
import { extractArticleData } from '../core/payloadBuilder';
import { AttachmentService } from '../services/AttachmentService';

export class ArticleManager {
    constructor(
        private app: App,
        private apiClient: TutuAPIClient,
        private settings: TutuSettings,
        private attachmentService: AttachmentService
    ) { }
    
    async initializeFileProperties(file: TFile): Promise<void> {
        try {
            await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                frontmatter['tutu-uuid'] = frontmatter['tutu-uuid'] ?? crypto.randomUUID();
                frontmatter['tutu-autor'] = frontmatter['tutu-autor'] ?? this.settings.defaultAuthor;
                frontmatter['tutu-published-at'] = frontmatter['tutu-published-at'] ?? null;
                frontmatter['tutu-art-resume'] = frontmatter['tutu-art-resume'] ?? "";
            });
        } catch (err) {
            if (err instanceof Error) console.error(`Tutu Beans: Error processing frontmatter: ${err.message}`);
        }
    }

    async sendToBackend(file: TFile): Promise<void> {
        new Notice("Preparing upload...");
        try {
            const fileCache = this.app.metadataCache.getFileCache(file);
            const rawContent = await this.app.vault.read(file);

            const attachments = await this.attachmentService.gatherAttachments(file);

            const offset = fileCache?.frontmatterPosition?.end?.offset ?? 0;

            const payload = extractArticleData(
                this.app,
                file,
                rawContent,
                fileCache?.frontmatter,
                file.basename,
                attachments,
                offset
            );

            const success = await this.apiClient.publishArticle(payload);

            if (success) {
                await this.app.fileManager.processFrontMatter(file, (fm) => {
                    fm['tutu-published-at'] = window.moment().format();
                });
            }
        } catch (err) {
            if (err instanceof Error) console.error(`Tutu Beans: Error: ${err.message}`);
            new Notice("Structural error while building the upload.");
        }
    }

    async deleteFromBackend(file: TFile): Promise<void> {
        const uuid = this.app.metadataCache.getFileCache(file)?.frontmatter?.['tutu-uuid'] as string | undefined;
        if (!uuid) return;

        const success = await this.apiClient.deleteArticle(uuid);
        if (success) {
            await this.app.fileManager.processFrontMatter(file, (fm) => {
                fm['tutu-published-at'] = null;
            });
        }
    }
}