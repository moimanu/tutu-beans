/** Article payload construction and data extraction */
import { App, TFile, getAllTags } from 'obsidian';
import { ArticlePayload, AttachmentData } from './types';

const sanitizeValue = (value: string | unknown): string => {
    if (typeof value !== 'string') return "";
    return value
        .replace(/<[^>]*>/g, '')
        .replace(/["']/g, '')
        .trim();
};

const sanitizeTag = (tag: string): string => {
    return tag
        .replace('#', '')
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ\-_]/g, '')
        .trim();
};

export function extractArticleData(
    app: App, 
    file: TFile,
    rawContent: string, 
    frontmatter: Record<string, unknown> | undefined | null, 
    basename: string, 
    attachments: AttachmentData[],
    frontmatterEndOffset = 0
): ArticlePayload {
    const contentBody = frontmatterEndOffset > 0 
        ? rawContent.slice(frontmatterEndOffset).trimStart() 
        : rawContent;

    const cache = app.metadataCache.getFileCache(file);
    const allTags = cache ? getAllTags(cache) : [];
    
    const cleanCategories = (allTags ?? [])
        .map(tag => sanitizeTag(tag))
        .filter((value, index, self) => value !== "" && self.indexOf(value) === index)
        .join(', ');

    const title = sanitizeValue(
        frontmatter?.['title'] || contentBody.match(/^#\s+(.*)/m)?.[1] || basename
    );

    const subtitle = sanitizeValue(
        frontmatter?.['subtitle'] || contentBody.match(/^##\s+(.*)/m)?.[1] || ""
    );

    return {
        metadata: {
            uuid: sanitizeValue(frontmatter?.['tutu-uuid']),
            author: sanitizeValue(frontmatter?.['tutu-autor']),
            category: cleanCategories,
            resume: sanitizeValue(frontmatter?.['tutu-art-resume']),
            title,
            subtitle
        },
        content: contentBody,
        attachments
    };
}