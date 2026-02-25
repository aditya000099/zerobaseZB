/**
 * ZeroBase SDK
 * Backend-as-a-Service SDK for the ZeroBase platform.
 */
// ── SDK Client ──────────────────────────────────────────────────────────────
export class ZeroBaseClient {
    constructor(projectId, url, apiKey) {
        if (!projectId || !url || !apiKey)
            throw new Error("Project ID, URL, and API Key are required");
        this.projectId = projectId;
        this.url = url;
        this.apiKey = apiKey;
    }
}
// ── Database Client ─────────────────────────────────────────────────────────
export class DatabaseClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    async getTables() {
        return fetch(`${this.client.url}/api/db/tables?projectId=${this.client.projectId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
        }).then((res) => res.json());
    }
    async createTable(tableName) {
        return fetch(`${this.client.url}/api/db/tables`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
            body: JSON.stringify({
                projectId: this.client.projectId,
                tableName,
            }),
        }).then((res) => res.json());
    }
    async deleteTable(tableName) {
        return fetch(`${this.client.url}/api/db/tables/${tableName}?projectId=${this.client.projectId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
        }).then((res) => res.json());
    }
    async addColumn(tableName, name, type) {
        return fetch(`${this.client.url}/api/db/tables/${tableName}/columns`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
            body: JSON.stringify({
                projectId: this.client.projectId,
                name,
                type,
            }),
        }).then((res) => res.json());
    }
    async getDocuments(tableName) {
        return fetch(`${this.client.url}/api/db/tables/${tableName}/documents?projectId=${this.client.projectId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
        }).then((res) => res.json());
    }
    async createDocument(tableName, document) {
        return fetch(`${this.client.url}/api/db/tables/${tableName}/documents`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
            body: JSON.stringify({
                projectId: this.client.projectId,
                document,
            }),
        }).then((res) => res.json());
    }
    async getDocument(collection, id) {
        return fetch(`${this.client.url}/database/${collection}/${id}`).then((res) => res.json());
    }
}
// ── Auth Client ─────────────────────────────────────────────────────────────
export class AuthClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    async createUser(userData) {
        if (!userData || typeof userData !== "object") {
            throw new Error("User data must be an object");
        }
        if (!userData.email || !userData.password) {
            throw new Error("Email and password are required");
        }
        return fetch(`${this.client.url}/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.client.apiKey,
            },
            body: JSON.stringify({
                projectId: this.client.projectId,
                ...userData,
            }),
        }).then((res) => {
            if (!res.ok) {
                return res.json().then((err) => Promise.reject(err));
            }
            return res.json();
        });
    }
    async loginUser(email, password) {
        try {
            const response = await fetch(`${this.client.url}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.apiKey,
                },
                body: JSON.stringify({
                    projectId: this.client.projectId,
                    email,
                    password,
                }),
            });
            if (!response.ok) {
                throw new Error(`Login failed: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error("Login request failed:", error);
            throw error;
        }
    }
    async googleLogin(credential) {
        return fetch(`${this.client.url}/api/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
            body: JSON.stringify({
                projectId: this.client.projectId,
                credential,
            }),
        }).then((res) => res.json());
    }
    async getUsers() {
        return fetch(`${this.client.url}/api/auth/users?projectId=${this.client.projectId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
        }).then((res) => res.json());
    }
    async deleteUser(userId) {
        return fetch(`${this.client.url}/api/auth/users/${userId}?projectId=${this.client.projectId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
        }).then(async (res) => {
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to delete user");
            }
            return res.json();
        });
    }
}
// ── Storage Client ──────────────────────────────────────────────────────────
export class StorageClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    async getInfo() {
        return fetch(`${this.client.url}/api/storage/${this.client.projectId}`, { headers: { "X-API-Key": this.client.apiKey } }).then((res) => res.json());
    }
    async listFiles() {
        return fetch(`${this.client.url}/api/storage/${this.client.projectId}/files`, { headers: { "X-API-Key": this.client.apiKey } }).then((res) => res.json());
    }
    async uploadFile(file) {
        const formData = new FormData();
        formData.append("file", file);
        return fetch(`${this.client.url}/api/storage/${this.client.projectId}/files`, {
            method: "POST",
            headers: { "X-API-Key": this.client.apiKey },
            body: formData,
        }).then((res) => res.json());
    }
    getFileUrl(filename) {
        return `${this.client.url}/api/storage/${this.client.projectId}/files/${encodeURIComponent(filename)}`;
    }
    async deleteFile(filename) {
        return fetch(`${this.client.url}/api/storage/${this.client.projectId}/files/${encodeURIComponent(filename)}`, {
            method: "DELETE",
            headers: { "X-API-Key": this.client.apiKey },
        }).then((res) => res.json());
    }
    async updateQuota(newQuotaMb) {
        return fetch(`${this.client.url}/api/storage/${this.client.projectId}/quota`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
            },
            body: JSON.stringify({ newQuotaMb }),
        }).then((res) => res.json());
    }
}
// ── Account Client ──────────────────────────────────────────────────────────
export class AccountClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    async getCurrentUser(token) {
        if (!token) {
            throw new Error("Authentication token is required");
        }
        return fetch(`${this.client.url}/api/account/me?projectId=${this.client.projectId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
                Authorization: `Bearer ${token}`,
            },
        }).then(async (res) => {
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to get current user");
            }
            return res.json();
        });
    }
    async validateSession(token) {
        if (!token) {
            return { valid: false };
        }
        try {
            const user = await this.getCurrentUser(token);
            return {
                valid: true,
                user,
            };
        }
        catch (error) {
            console.error("Session validation error:", error);
            return {
                valid: false,
                error: error instanceof Error ? error.message : "An unknown error occurred",
            };
        }
    }
    async updateProfile(token, userData) {
        if (!token) {
            throw new Error("Authentication token is required");
        }
        return fetch(`${this.client.url}/api/account/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": this.client.apiKey,
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                projectId: this.client.projectId,
                ...userData,
            }),
        }).then((res) => res.json());
    }
}
export class RealtimeClient {
    constructor(client) {
        this.ws = null;
        this.subs = new Map();
        this.shouldReconnect = false;
        this.retryMs = 1000;
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    connect() {
        return new Promise((resolve, reject) => {
            const base = this.client.url.replace(/^http/, "ws");
            const url = `${base}/ws?projectId=${encodeURIComponent(this.client.projectId)}&apiKey=${encodeURIComponent(this.client.apiKey)}`;
            this.ws = new WebSocket(url);
            this.shouldReconnect = true;
            this.ws.onopen = () => {
                this.retryMs = 1000;
            };
            this.ws.onmessage = (e) => {
                try {
                    const msg = JSON.parse(typeof e.data === "string" ? e.data : "");
                    if (msg.type === "connected") {
                        resolve();
                        return;
                    }
                    if (msg.type === "change") {
                        const cb = this.subs.get(msg.table);
                        if (cb)
                            cb(msg.event, msg.data);
                    }
                }
                catch ( /* ignore */_a) { /* ignore */ }
            };
            this.ws.onclose = () => {
                if (this.shouldReconnect) {
                    setTimeout(() => this.connect().then(() => {
                        var _a;
                        // re-subscribe on reconnect
                        for (const table of this.subs.keys()) {
                            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify({ type: "subscribe", table }));
                        }
                    }).catch(() => { }), this.retryMs);
                    this.retryMs = Math.min(this.retryMs * 2, 30000);
                }
            };
            this.ws.onerror = () => {
                reject(new Error("WebSocket connection failed"));
            };
        });
    }
    subscribe(table, callback) {
        this.subs.set(table, callback);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "subscribe", table }));
        }
    }
    unsubscribe(table) {
        this.subs.delete(table);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "unsubscribe", table }));
        }
    }
    disconnect() {
        var _a;
        this.shouldReconnect = false;
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
        this.ws = null;
    }
}
