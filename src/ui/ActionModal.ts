/** Interactive modal for isolated article management */
import { App, Modal, ButtonComponent } from 'obsidian';
import { StatusResponse } from '../core/types';

export class ActionModal extends Modal {
    constructor(
        app: App, 
        private status: StatusResponse, 
        private onPublish: () => void, 
        private onDelete: () => void
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('tutu-modal-container');
        
        const frag = document.createDocumentFragment();
        const contentGroup = document.createElement('div');
        contentGroup.className = 'tutu-modal-content';
        
        contentGroup.createEl('h2', { text: 'Manage Publication' });

        if (this.status.published) {
            const statusDiv = contentGroup.createDiv({ cls: 'tutu-status-container' });
            statusDiv.createEl('p', { text: 'This article is already published on your blog.' });
            if (this.status.lastUpdate) {
                statusDiv.createEl('small', { 
                    text: `Last sync: ${new Date(this.status.lastUpdate).toLocaleString()}`
                });
            }
        } else {
            contentGroup.createEl('p', { text: 'Would you like to send this article to your blog?' });
        }
        frag.appendChild(contentGroup);

        const actionGroup = document.createElement('div');
        actionGroup.className = 'tutu-modal-actions';

        new ButtonComponent(actionGroup)
            .setButtonText('Cancel')
            .onClick(() => this.close());

        if (this.status.published) {
            new ButtonComponent(actionGroup)
                .setButtonText('Delete')
                .setWarning()
                .onClick(() => {
                    this.onDelete();
                    this.close();
                });
        }

        new ButtonComponent(actionGroup)
            .setCta()
            .setButtonText(this.status.published ? 'Update' : 'Confirm Upload')
            .onClick(() => {
                this.onPublish();
                this.close();
            });

        frag.appendChild(actionGroup);
        contentEl.appendChild(frag);
    }

    onClose() {
        this.contentEl.empty();
    }
}