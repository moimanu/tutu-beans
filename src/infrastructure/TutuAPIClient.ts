/** Secure and sanitized API client */
import { requestUrl, Notice, RequestUrlParam, RequestUrlResponse } from 'obsidian';
import { 
    TutuSettings, 
    RemoteNote, 
    ArticlePayload, 
    StatusResponse, 
    ListResponse 
} from '../core/types';

export class TutuAPIClient {
    private isProcessing = false;

    constructor(private settings: TutuSettings) {}

    private resolveUrl(endpoint: string): string {
        const { useBaseUrl, baseUrl } = this.settings;
        
        let urlString = (useBaseUrl && baseUrl) 
            ? `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`
            : endpoint;

        if (!urlString.startsWith('http')) {
            urlString = `https://${urlString}`;
        }

        try {
            const url = new URL(urlString);
            
            if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
                url.protocol = 'https:';
            }

            return url.toString();
        } catch (e) {
            return urlString; 
        }
    }

    private getHeaders(): Record<string, string> {
        const token = this.settings.token?.trim() || "";
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    private async fetchWithHandling(
        options: RequestUrlParam, 
        context: string
    ): Promise<RequestUrlResponse | null> {
        if (!this.settings.token?.trim()) {
            new Notice("Tutu Beans: Bearer Token missing in settings.");
            return null;
        }

        try {
            const finalOptions: RequestUrlParam = {
                ...options,
                url: this.resolveUrl(options.url),
                headers: { ...this.getHeaders(), ...options.headers },
                throw: false 
            };

            const response = await requestUrl(finalOptions);

            if (response.status >= 400) {
                this.handleHttpErrors(response.status, context, response.text);
                return null;
            }

            return response;
        } catch (err) {
            this.handleNetworkErrors(err, context);
            return null;
        }
    }

    private handleHttpErrors(status: number, context: string, rawResponse: string): void {
        const errorMap: Record<number, string> = {
            401: "Unauthorized. Please check your Bearer Token.",
            403: "Forbidden. You don't have permission for this action.",
            404: "Endpoint not found. Verify your API URL.",
            413: "Payload too large. Server rejected the file size.",
            429: "Rate limit hit. Please wait a moment.",
            500: "Server error. Check your backend logs."
        };

        const msg = errorMap[status] || `Error ${status}: Request failed.`;
        new Notice(`Tutu Beans: ${msg}`, 8000);
        console.error(`[Tutu API] ${context} HTTP Error:`, status, rawResponse);
    }

    private handleNetworkErrors(err: any, context: string): void {
        let msg = "Network error. Check your connection or API URL.";
        const errStr = String(err).toLowerCase();

        if (errStr.includes("err_cert") || errStr.includes("ssl")) {
            msg = "🔒 Security: SSL/TLS failure. Ensure your server has a valid certificate.";
        }

        new Notice(`Tutu Beans: ${msg}`, 10000);
        console.error(`[Tutu API] ${context} Execution Error:`, err);
    }

    async getStatus(uuid: string): Promise<StatusResponse | null> {
        if (!uuid) return null;

        const [path, existingQuery] = this.settings.endpointStatus.split('?');
        const params = new URLSearchParams(existingQuery);
        params.append('uuid', uuid);
        
        const url = `${path}?${params.toString()}`;
        const response = await this.fetchWithHandling({ url, method: 'GET' }, 'getStatus');
        
        return (response?.json as StatusResponse) || null;
    }

    async publishArticle(payload: ArticlePayload): Promise<boolean> {
        if (this.isProcessing) return false;
        this.isProcessing = true;

        try {
            const response = await this.fetchWithHandling({
                url: this.settings.endpoint,
                method: 'POST',
                body: JSON.stringify(payload)
            }, 'publishArticle');

            if (response) {
                new Notice("Tutu Beans: Article synced successfully.");
                return true;
            }
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    async deleteArticle(uuid: string): Promise<boolean> {
        if (!uuid) return false;
        
        const response = await this.fetchWithHandling({
            url: this.settings.endpointDelete,
            method: 'DELETE',
            body: JSON.stringify({ uuid })
        }, 'deleteArticle');

        if (response) {
            new Notice("Tutu Beans: Article removed from server.");
            return true;
        }
        return false;
    }

    async listAllRemoteNotes(): Promise<RemoteNote[] | null> {
        const response = await this.fetchWithHandling({
            url: this.settings.endpointList,
            method: 'GET'
        }, 'listAllRemoteNotes');

        if (response?.json && typeof response.json === 'object') {
            const data = response.json as ListResponse;
            return Array.isArray(data.notes) ? data.notes : [];
        }
        
        return response ? [] : null;
    }
}