/** Attachment processing service (Binary to Base64) */
import { App, TFile, arrayBufferToBase64 } from 'obsidian';
import { AttachmentData } from '../core/types';

export class AttachmentService {
    constructor(private app: App) {}

    async gatherAttachments(file: TFile): Promise<AttachmentData[]> {
        const fileCache = this.app.metadataCache.getFileCache(file);
        const attachments: AttachmentData[] = [];

        if (!fileCache?.embeds) return attachments;

        for (const embed of fileCache.embeds) {
            const imageFile = this.app.metadataCache.getFirstLinkpathDest(embed.link, file.path);
            
            if (imageFile instanceof TFile) {
                const binary = await this.app.vault.readBinary(imageFile);
                attachments.push({
                    name: imageFile.name,
                    extension: imageFile.extension,
                    data: arrayBufferToBase64(binary)
                });
            }
        }
        return attachments;
    }
}