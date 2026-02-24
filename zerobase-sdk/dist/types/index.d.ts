/**
 * ZeroBase SDK
 * Backend-as-a-Service SDK for the ZeroBase platform.
 */
export interface UserData {
    email: string;
    password: string;
    name?: string;
    [key: string]: any;
}
export interface SessionResponse {
    valid: boolean;
    user?: any;
    error?: string;
}
export declare class ZeroBaseClient {
    projectId: string;
    url: string;
    apiKey: string;
    constructor(projectId: string, url: string, apiKey: string);
}
export declare class DatabaseClient {
    private client;
    constructor(client: ZeroBaseClient);
    getTables(): Promise<any>;
    createTable(tableName: string): Promise<any>;
    deleteTable(tableName: string): Promise<any>;
    addColumn(tableName: string, name: string, type: string): Promise<any>;
    getDocuments(tableName: string): Promise<any>;
    createDocument(tableName: string, document: any): Promise<any>;
    getDocument(collection: string, id: string): Promise<any>;
}
export declare class AuthClient {
    private client;
    constructor(client: ZeroBaseClient);
    createUser(userData: UserData): Promise<any>;
    loginUser(email: string, password: string): Promise<any>;
    googleLogin(credential: string): Promise<any>;
    getUsers(): Promise<any>;
    deleteUser(userId: string): Promise<any>;
}
export declare class StorageClient {
    private client;
    constructor(client: ZeroBaseClient);
    getInfo(): Promise<any>;
    listFiles(): Promise<any>;
    uploadFile(file: File): Promise<any>;
    getFileUrl(filename: string): string;
    deleteFile(filename: string): Promise<any>;
    updateQuota(newQuotaMb: number): Promise<any>;
}
export declare class AccountClient {
    private client;
    constructor(client: ZeroBaseClient);
    getCurrentUser(token: string): Promise<any>;
    validateSession(token: string): Promise<SessionResponse>;
    updateProfile(token: string, userData: Partial<UserData>): Promise<any>;
}
