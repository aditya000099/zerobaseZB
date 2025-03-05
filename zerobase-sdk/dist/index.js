"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZeroBaseError = exports.AccountClient = exports.StorageClient = exports.AuthClient = exports.DatabaseClient = exports.ZeroBaseClient = void 0;
/**
 * Main SDK Client
 * Handles configuration and base functionality
 */
class ZeroBaseClient {
    constructor(config) {
        if (!config.projectId || !config.apiKey) {
            throw new Error("Project ID and API Key are required");
        }
        this.projectId = config.projectId;
        this.apiKey = config.apiKey;
        this.url = config.url || "http://localhost:3000";
    }
    getProjectId() { return this.projectId; }
    getApiKey() { return this.apiKey; }
    getUrl() { return this.url; }
}
exports.ZeroBaseClient = ZeroBaseClient;
/**
 * Database Client
 * Handles all database operations including tables and documents
 */
class DatabaseClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    // Table Operations
    getTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/db/tables?projectId=${this.client.getProjectId()}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
            });
            return response.json();
        });
    }
    createTable(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/db/tables`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    tableName,
                }),
            });
            return response.json();
        });
    }
    deleteTable(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${this.client.getUrl()}/api/db/tables/${tableName}?projectId=${this.client.getProjectId()}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
            });
        });
    }
    // Column Operations
    addColumn(tableName, name, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/columns`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    name,
                    type,
                }),
            });
            return response.json();
        });
    }
    // Document Operations
    getDocuments(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/documents?projectId=${this.client.getProjectId()}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
            });
            return response.json();
        });
    }
    createDocument(tableName, document) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/documents`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    document,
                }),
            });
            return response.json();
        });
    }
    updateDocument(tableName, id, document) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/documents/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    document,
                }),
            });
            return response.json();
        });
    }
    deleteDocument(tableName, id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/documents/${id}?projectId=${this.client.getProjectId()}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
            });
        });
    }
    queryDocuments(tableName, query) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    query,
                }),
            });
            return response.json();
        });
    }
}
exports.DatabaseClient = DatabaseClient;
/**
 * Authentication Client
 * Handles user authentication and management
 */
class AuthClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    // User Management
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userData.email || !userData.password) {
                throw new Error("Email and password are required");
            }
            const response = yield fetch(`${this.client.getUrl()}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.client.getApiKey(),
                },
                body: JSON.stringify(Object.assign({ projectId: this.client.getProjectId() }, userData)),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to create user");
            }
            return response.json();
        });
    }
    updateUser(userId, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/auth/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify(Object.assign({ projectId: this.client.getProjectId() }, userData)),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to update user");
            }
            return response.json();
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${this.client.getUrl()}/api/auth/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "X-API-Key": this.client.getApiKey(),
                },
            });
        });
    }
    // Authentication
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    email,
                    password,
                }),
            });
            return response.json();
        });
    }
    googleLogin(credential) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/auth/google`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    credential,
                }),
            });
            return response.json();
        });
    }
    logout(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/auth/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to logout");
            }
        });
    }
    // Password Management
    resetPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    email,
                }),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to reset password");
            }
        });
    }
    changePassword(userId, oldPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                },
                body: JSON.stringify({
                    projectId: this.client.getProjectId(),
                    userId,
                    oldPassword,
                    newPassword,
                }),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to change password");
            }
        });
    }
}
exports.AuthClient = AuthClient;
/**
 * Storage Client
 * Handles file uploads and storage management
 */
class StorageClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    uploadFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("projectId", this.client.getProjectId());
            const response = yield fetch(`${this.client.getUrl()}/api/storage/upload`, {
                method: "POST",
                headers: {
                    "X-API-Key": this.client.getApiKey(),
                },
                body: formData,
            });
            return response.json();
        });
    }
    deleteFile(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fetch(`${this.client.getUrl()}/api/storage/files/${key}`, {
                method: "DELETE",
                headers: {
                    "X-API-Key": this.client.getApiKey(),
                },
            });
        });
    }
    listFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/storage/files?projectId=${this.client.getProjectId()}`, {
                headers: {
                    "X-API-Key": this.client.getApiKey(),
                },
            });
            return response.json();
        });
    }
}
exports.StorageClient = StorageClient;
/**
 * Account Client
 * Handles user profile and session management
 */
class AccountClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    getCurrentUser(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/account/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to get current user");
            }
            return response.json();
        });
    }
    updateProfile(token, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/account/me`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(Object.assign({ projectId: this.client.getProjectId() }, userData)),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to update profile");
            }
            return response.json();
        });
    }
    validateSession(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.client.getUrl()}/api/account/validate-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.getApiKey(),
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to validate session");
            }
            return response.json();
        });
    }
}
exports.AccountClient = AccountClient;
// Export error types
class ZeroBaseError extends Error {
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'ZeroBaseError';
    }
}
exports.ZeroBaseError = ZeroBaseError;
