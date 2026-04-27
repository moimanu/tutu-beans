/** Core type definitions for the Tutu Beans system */
import { TFile } from 'obsidian';

export interface TutuSettings {
    baseUrl: string;
    useBaseUrl: boolean;
    endpoint: string;
    endpointDelete: string;
    endpointStatus: string;
    endpointList: string;
    token: string;
    watchedFolder: string;
    defaultAuthor: string;
}

export interface RemoteNote {
    uuid: string;
    title: string;
    updated_at?: string;
}

export interface SyncData {
    remoteOnly: RemoteNote[];
    localOnly: TFile[];
    synced: { uuid: string; file: TFile }[];
}

export interface AttachmentData {
    name: string;
    extension: string;
    data: string;
}

export interface ArticlePayload {
    metadata: {
        uuid: string;
        author: string;
        category: string;
        resume: string;
        title: string;
        subtitle: string;
    };
    content: string;
    attachments: AttachmentData[];
}

export interface StatusResponse {
    published: boolean;
    lastUpdate?: string;
}

export interface ListResponse {
    notes: RemoteNote[];
}