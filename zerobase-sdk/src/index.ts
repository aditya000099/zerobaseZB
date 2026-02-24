/**
 * ZeroBase SDK
 * Backend-as-a-Service SDK for the ZeroBase platform.
 */

// ── Interfaces ──────────────────────────────────────────────────────────────

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

// ── SDK Client ──────────────────────────────────────────────────────────────

export class ZeroBaseClient {
  public projectId: string;
  public url: string;
  public apiKey: string;

  constructor(projectId: string, url: string, apiKey: string) {
    if (!projectId || !url || !apiKey)
      throw new Error("Project ID, URL, and API Key are required");
    this.projectId = projectId;
    this.url = url;
    this.apiKey = apiKey;
  }
}

// ── Database Client ─────────────────────────────────────────────────────────

export class DatabaseClient {
  private client: ZeroBaseClient;

  constructor(client: ZeroBaseClient) {
    if (!(client instanceof ZeroBaseClient))
      throw new Error("Invalid SDK Client");
    this.client = client;
  }

  async getTables(): Promise<any> {
    return fetch(
      `${this.client.url}/api/db/tables?projectId=${this.client.projectId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.client.apiKey,
        },
      }
    ).then((res) => res.json());
  }

  async createTable(tableName: string): Promise<any> {
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

  async deleteTable(tableName: string): Promise<any> {
    return fetch(
      `${this.client.url}/api/db/tables/${tableName}?projectId=${this.client.projectId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.client.apiKey,
        },
      }
    ).then((res) => res.json());
  }

  async addColumn(tableName: string, name: string, type: string): Promise<any> {
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

  async getDocuments(tableName: string): Promise<any> {
    return fetch(
      `${this.client.url}/api/db/tables/${tableName}/documents?projectId=${this.client.projectId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.client.apiKey,
        },
      }
    ).then((res) => res.json());
  }

  async createDocument(tableName: string, document: any): Promise<any> {
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

  async getDocument(collection: string, id: string): Promise<any> {
    return fetch(`${this.client.url}/database/${collection}/${id}`).then(
      (res) => res.json()
    );
  }
}

// ── Auth Client ─────────────────────────────────────────────────────────────

export class AuthClient {
  private client: ZeroBaseClient;

  constructor(client: ZeroBaseClient) {
    if (!(client instanceof ZeroBaseClient))
      throw new Error("Invalid SDK Client");
    this.client = client;
  }

  async createUser(userData: UserData): Promise<any> {
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

  async loginUser(email: string, password: string): Promise<any> {
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
    } catch (error) {
      console.error("Login request failed:", error);
      throw error;
    }
  }

  async googleLogin(credential: string): Promise<any> {
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

  async getUsers(): Promise<any> {
    return fetch(
      `${this.client.url}/api/auth/users?projectId=${this.client.projectId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.client.apiKey,
        },
      }
    ).then((res) => res.json());
  }

  async deleteUser(userId: string): Promise<any> {
    return fetch(
      `${this.client.url}/api/auth/users/${userId}?projectId=${this.client.projectId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.client.apiKey,
        },
      }
    ).then(async (res) => {
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
  private client: ZeroBaseClient;

  constructor(client: ZeroBaseClient) {
    if (!(client instanceof ZeroBaseClient))
      throw new Error("Invalid SDK Client");
    this.client = client;
  }

  async getInfo(): Promise<any> {
    return fetch(
      `${this.client.url}/api/storage/${this.client.projectId}`,
      { headers: { "X-API-Key": this.client.apiKey } }
    ).then((res) => res.json());
  }

  async listFiles(): Promise<any> {
    return fetch(
      `${this.client.url}/api/storage/${this.client.projectId}/files`,
      { headers: { "X-API-Key": this.client.apiKey } }
    ).then((res) => res.json());
  }

  async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(
      `${this.client.url}/api/storage/${this.client.projectId}/files`,
      {
        method: "POST",
        headers: { "X-API-Key": this.client.apiKey },
        body: formData,
      }
    ).then((res) => res.json());
  }

  getFileUrl(filename: string): string {
    return `${this.client.url}/api/storage/${this.client.projectId}/files/${encodeURIComponent(filename)}`;
  }

  async deleteFile(filename: string): Promise<any> {
    return fetch(
      `${this.client.url}/api/storage/${this.client.projectId}/files/${encodeURIComponent(filename)}`,
      {
        method: "DELETE",
        headers: { "X-API-Key": this.client.apiKey },
      }
    ).then((res) => res.json());
  }

  async updateQuota(newQuotaMb: number): Promise<any> {
    return fetch(
      `${this.client.url}/api/storage/${this.client.projectId}/quota`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.client.apiKey,
        },
        body: JSON.stringify({ newQuotaMb }),
      }
    ).then((res) => res.json());
  }
}

// ── Account Client ──────────────────────────────────────────────────────────

export class AccountClient {
  private client: ZeroBaseClient;

  constructor(client: ZeroBaseClient) {
    if (!(client instanceof ZeroBaseClient))
      throw new Error("Invalid SDK Client");
    this.client = client;
  }

  async getCurrentUser(token: string): Promise<any> {
    if (!token) {
      throw new Error("Authentication token is required");
    }

    return fetch(
      `${this.client.url}/api/account/me?projectId=${this.client.projectId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.client.apiKey,
          Authorization: `Bearer ${token}`,
        },
      }
    ).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to get current user");
      }
      return res.json();
    });
  }

  async validateSession(token: string): Promise<SessionResponse> {
    if (!token) {
      return { valid: false };
    }

    try {
      const user = await this.getCurrentUser(token);
      return {
        valid: true,
        user,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  async updateProfile(token: string, userData: Partial<UserData>): Promise<any> {
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
