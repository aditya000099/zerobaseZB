/**
 * ZeroBase SDK - Core interfaces
 */
interface ZeroBaseConfig {
    projectId: string;
    apiKey: string;
    url?: string;
}
interface UserData {
    email: string;
    password: string;
    name?: string;
    [key: string]: any;
}
interface Document {
    [key: string]: any;
}
interface Column {
    column_name: string;
    data_type: string;
}
interface Table {
    table_name: string;
    columns: Column[];
}
interface AuthResponse {
    token: string;
    user: UserData;
}
/**
 * Main SDK Client
 * Handles configuration and base functionality
 */
export declare class ZeroBaseClient {
    private projectId;
    private apiKey;
    private url;
    constructor(config: ZeroBaseConfig);
    getProjectId(): string;
    getApiKey(): string;
    getUrl(): string;
}
/**
 * Database Client
 * Handles all database operations including tables and documents
 */
export declare class DatabaseClient {
    private client;
    constructor(client: ZeroBaseClient);
    getTables(): Promise<Table[]>;
    createTable(tableName: string): Promise<Table>;
    deleteTable(tableName: string): Promise<void>;
    addColumn(tableName: string, name: string, type: string): Promise<Table>;
    getDocuments(tableName: string): Promise<Document[]>;
    createDocument(tableName: string, document: Document): Promise<Document>;
    updateDocument(tableName: string, id: string, document: Document): Promise<Document>;
    deleteDocument(tableName: string, id: string): Promise<void>;
    queryDocuments(tableName: string, query: any): Promise<Document[]>;
}
/**
 * Authentication Client
 * Handles user authentication and management
 */
export declare class AuthClient {
    private client;
    constructor(client: ZeroBaseClient);
    createUser(userData: UserData): Promise<UserData>;
    updateUser(userId: string, userData: Partial<UserData>): Promise<UserData>;
    deleteUser(userId: string): Promise<void>;
    login(email: string, password: string): Promise<AuthResponse>;
    googleLogin(credential: string): Promise<AuthResponse>;
    logout(token: string): Promise<void>;
    resetPassword(email: string): Promise<void>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
}
/**
 * Storage Client
 * Handles file uploads and storage management
 */
export declare class StorageClient {
    private client;
    constructor(client: ZeroBaseClient);
    uploadFile(file: File): Promise<{
        url: string;
        key: string;
    }>;
    deleteFile(key: string): Promise<void>;
    listFiles(): Promise<{
        url: string;
        key: string;
    }[]>;
}
/**
 * Account Client
 * Handles user profile and session management
 */
export declare class AccountClient {
    private client;
    constructor(client: ZeroBaseClient);
    getCurrentUser(token: string): Promise<UserData>;
    updateProfile(token: string, userData: Partial<UserData>): Promise<UserData>;
    validateSession(token: string): Promise<{
        valid: boolean;
        user?: UserData;
    }>;
}
export declare class ZeroBaseError extends Error {
    code: string;
    status: number;
    constructor(message: string, code: string, status: number);
}
export {};
