interface UserData {
    email: string;
    password: string;
    [key: string]: any;
}
interface SessionResponse {
    valid: boolean;
    user?: any;
    error?: string;
}
declare class ZeroBaseClient {
    projectId: string;
    url: string;
    apiKey: string;
    constructor(projectId: string, url: string, apiKey: string);
}
declare class DatabaseClient {
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
declare class AuthClient {
    private client;
    constructor(client: ZeroBaseClient);
    createUser(userData: UserData): Promise<any>;
    loginUser(email: string, password: string): Promise<any>;
    googleLogin(credential: string): Promise<any>;
    getUsers(): Promise<any>;
    deleteUser(userId: string): Promise<any>;
}
declare class StorageClient {
    private client;
    constructor(client: ZeroBaseClient);
    uploadFile(file: File): Promise<any>;
}
declare class AccountClient {
    private client;
    constructor(client: ZeroBaseClient);
    getCurrentUser(token: string): Promise<any>;
    validateSession(token: string): Promise<SessionResponse>;
    updateProfile(token: string, userData: Partial<UserData>): Promise<any>;
}
export { ZeroBaseClient, DatabaseClient, AuthClient, StorageClient, AccountClient, };
