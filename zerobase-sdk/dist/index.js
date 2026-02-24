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
exports.AccountClient = exports.StorageClient = exports.AuthClient = exports.DatabaseClient = exports.ZeroBaseClient = void 0;
// SDK Client
class ZeroBaseClient {
    constructor(projectId, url, apiKey) {
        if (!projectId || !url || !apiKey)
            throw new Error("Project ID, URL, and API Key are required");
        this.projectId = projectId;
        this.url = url;
        this.apiKey = apiKey;
    }
}
exports.ZeroBaseClient = ZeroBaseClient;
//
//
//
// Database Client
//
//
//
//
class DatabaseClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    getTables() {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(`${this.client.url}/api/db/tables?projectId=${this.client.projectId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.apiKey,
                },
            }).then((res) => res.json());
        });
    }
    createTable(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    deleteTable(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(`${this.client.url}/api/db/tables/${tableName}?projectId=${this.client.projectId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.apiKey,
                },
            }).then((res) => res.json());
        });
    }
    addColumn(tableName, name, type) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    getDocuments(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(`${this.client.url}/api/db/tables/${tableName}/documents?projectId=${this.client.projectId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.apiKey,
                },
            }).then((res) => res.json());
        });
    }
    createDocument(tableName, document) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    getDocument(collection, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(`${this.client.url}/database/${collection}/${id}`).then((res) => res.json());
        });
    }
}
exports.DatabaseClient = DatabaseClient;
//
//
//
// Auth Client
//
//
//
//
class AuthClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
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
                body: JSON.stringify(Object.assign({ projectId: this.client.projectId }, userData)),
            }).then((res) => {
                if (!res.ok) {
                    return res.json().then((err) => Promise.reject(err));
                }
                return res.json();
            });
        });
    }
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.client.url}/api/auth/login`, {
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
                const data = yield response.json();
                return data;
            }
            catch (error) {
                console.error("Login request failed:", error);
                throw error;
            }
        });
    }
    googleLogin(credential) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    //   async setupOTP() {
    //     return fetch(`${this.client.url}/api/auth/otp/setup`, {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${jwtToken}`,
    //         "X-API-Key": this.client.apiKey,
    //       },
    //       body: JSON.stringify({
    //         projectId: this.client.projectId,
    //       }),
    //     }).then((res) => res.json());
    //   }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(`${this.client.url}/api/auth/users?projectId=${this.client.projectId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.apiKey,
                },
            }).then((res) => res.json());
        });
    }
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(`${this.client.url}/api/auth/users/${userId}?projectId=${this.client.projectId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.client.apiKey,
                },
            }).then((res) => __awaiter(this, void 0, void 0, function* () {
                if (!res.ok) {
                    const error = yield res.json();
                    throw new Error(error.message || "Failed to delete user");
                }
                return res.json();
            }));
        });
    }
}
exports.AuthClient = AuthClient;
//
//
//
// Storage Client
//
//
//
//
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
            formData.append("projectId", this.client.projectId);
            return fetch(`${this.client.url}/api/storage/upload`, {
                method: "POST",
                headers: {
                    "X-API-Key": this.client.apiKey,
                },
                body: formData,
            }).then((res) => res.json());
        });
    }
}
exports.StorageClient = StorageClient;
//
//
// Account Client
//
//
//
//
class AccountClient {
    constructor(client) {
        if (!(client instanceof ZeroBaseClient))
            throw new Error("Invalid SDK Client");
        this.client = client;
    }
    getCurrentUser(token) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }).then((res) => __awaiter(this, void 0, void 0, function* () {
                if (!res.ok) {
                    const error = yield res.json();
                    throw new Error(error.message || "Failed to get current user");
                }
                return res.json();
            }));
        });
    }
    validateSession(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!token) {
                return { valid: false };
            }
            try {
                const user = yield this.getCurrentUser(token);
                return {
                    valid: true,
                    user,
                };
            }
            catch (error) {
                console.error("Session validation error:", error);
                return {
                    valid: false,
                    error: error instanceof Error ? error.message : 'An unknown error occurred',
                };
            }
        });
    }
    updateProfile(token, userData) {
        return __awaiter(this, void 0, void 0, function* () {
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
                body: JSON.stringify(Object.assign({ projectId: this.client.projectId }, userData)),
            }).then((res) => res.json());
        });
    }
}
exports.AccountClient = AccountClient;
