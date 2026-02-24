// /**
//  * ZeroBase SDK - Core interfaces
//  */
// interface ZeroBaseConfig {
//   projectId: string;
//   apiKey: string;
//   url?: string;
// }

// interface UserData {
//   email: string;
//   password: string;
//   name?: string;
//   [key: string]: any;
// }

// interface Document {
//   [key: string]: any;
// }

// interface Column {
//   column_name: string;
//   data_type: string;
// }

// interface Table {
//   table_name: string;
//   columns: Column[];
// }

// interface AuthResponse {
//   token: string;
//   user: UserData;
// }

// /**
//  * Main SDK Client
//  * Handles configuration and base functionality
//  */
// export class ZeroBaseClient {
//   private projectId: string;
//   private apiKey: string;
//   private url: string;

//   constructor(config: ZeroBaseConfig) {
//     if (!config.projectId || !config.apiKey) {
//       throw new Error("Project ID and API Key are required");
//     }
//     this.projectId = config.projectId;
//     this.apiKey = config.apiKey;
//     this.url = config.url || "http://localhost:3000";
//   }

//   getProjectId(): string { return this.projectId; }
//   getApiKey(): string { return this.apiKey; }
//   getUrl(): string { return this.url; }
// }

// /**
//  * Database Client
//  * Handles all database operations including tables and documents
//  */
// export class DatabaseClient {
//   private client: ZeroBaseClient;

//   constructor(client: ZeroBaseClient) {
//     if (!(client instanceof ZeroBaseClient)) throw new Error("Invalid SDK Client");
//     this.client = client;
//   }

//   // Table Operations
//   async getTables(): Promise<Table[]> {
//     const response = await fetch(
//       `${this.client.getUrl()}/api/db/tables?projectId=${this.client.getProjectId()}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           "X-API-Key": this.client.getApiKey(),
//         },
//       }
//     );
//     return response.json();
//   }

//   async createTable(tableName: string): Promise<Table> {
//     const response = await fetch(`${this.client.getUrl()}/api/db/tables`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         tableName,
//       }),
//     });
//     return response.json();
//   }

//   async deleteTable(tableName: string): Promise<void> {
//     await fetch(
//       `${this.client.getUrl()}/api/db/tables/${tableName}?projectId=${this.client.getProjectId()}`,
//       {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           "X-API-Key": this.client.getApiKey(),
//         },
//       }
//     );
//   }

//   // Column Operations
//   async addColumn(tableName: string, name: string, type: string): Promise<Table> {
//     const response = await fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/columns`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         name,
//         type,
//       }),
//     });
//     return response.json();
//   }

//   // Document Operations
//   async getDocuments(tableName: string): Promise<Document[]> {
//     const response = await fetch(
//       `${this.client.getUrl()}/api/db/tables/${tableName}/documents?projectId=${this.client.getProjectId()}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           "X-API-Key": this.client.getApiKey(),
//         },
//       }
//     );
//     return response.json();
//   }

//   async createDocument(tableName: string, document: Document): Promise<Document> {
//     const response = await fetch(`${this.client.getUrl()}/api/db/tables/${tableName}/documents`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         document,
//       }),
//     });
//     return response.json();
//   }

//   async updateDocument(tableName: string, id: string, document: Document): Promise<Document> {
//     const response = await fetch(
//       `${this.client.getUrl()}/api/db/tables/${tableName}/documents/${id}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           "X-API-Key": this.client.getApiKey(),
//         },
//         body: JSON.stringify({
//           projectId: this.client.getProjectId(),
//           document,
//         }),
//       }
//     );
//     return response.json();
//   }

//   async deleteDocument(tableName: string, id: string): Promise<void> {
//     await fetch(
//       `${this.client.getUrl()}/api/db/tables/${tableName}/documents/${id}?projectId=${this.client.getProjectId()}`,
//       {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           "X-API-Key": this.client.getApiKey(),
//         },
//       }
//     );
//   }

//   async queryDocuments(tableName: string, query: any): Promise<Document[]> {
//     const response = await fetch(
//       `${this.client.getUrl()}/api/db/tables/${tableName}/query`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "X-API-Key": this.client.getApiKey(),
//         },
//         body: JSON.stringify({
//           projectId: this.client.getProjectId(),
//           query,
//         }),
//       }
//     );
//     return response.json();
//   }
// }

// /**
//  * Authentication Client
//  * Handles user authentication and management
//  */
// export class AuthClient {
//   private client: ZeroBaseClient;

//   constructor(client: ZeroBaseClient) {
//     if (!(client instanceof ZeroBaseClient)) throw new Error("Invalid SDK Client");
//     this.client = client;
//   }

//   // User Management
//   async createUser(userData: UserData): Promise<UserData> {
//     if (!userData.email || !userData.password) {
//       throw new Error("Email and password are required");
//     }

//     const response = await fetch(`${this.client.getUrl()}/api/auth/signup`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         ...userData,
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to create user");
//     }

//     return response.json();
//   }

//   async updateUser(userId: string, userData: Partial<UserData>): Promise<UserData> {
//     const response = await fetch(`${this.client.getUrl()}/api/auth/users/${userId}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         ...userData,
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to update user");
//     }

//     return response.json();
//   }

//   async deleteUser(userId: string): Promise<void> {
//     await fetch(`${this.client.getUrl()}/api/auth/users/${userId}`, {
//       method: "DELETE",
//       headers: {
//         "X-API-Key": this.client.getApiKey(),
//       },
//     });
//   }

//   // Authentication
//   async login(email: string, password: string): Promise<AuthResponse> {
//     const response = await fetch(`${this.client.getUrl()}/api/auth/login`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         email,
//         password,
//       }),
//     });
//     return response.json();
//   }

//   async googleLogin(credential: string): Promise<AuthResponse> {
//     const response = await fetch(`${this.client.getUrl()}/api/auth/google`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         credential,
//       }),
//     });
//     return response.json();
//   }

//   async logout(token: string): Promise<void> {
//     const response = await fetch(`${this.client.getUrl()}/api/auth/logout`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to logout");
//     }
//   }

//   // Password Management
//   async resetPassword(email: string): Promise<void> {
//     const response = await fetch(`${this.client.getUrl()}/api/auth/reset-password`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         email,
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to reset password");
//     }
//   }

//   async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
//     const response = await fetch(`${this.client.getUrl()}/api/auth/change-password`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         userId,
//         oldPassword,
//         newPassword,
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to change password");
//     }
//   }
// }

// /**
//  * Storage Client
//  * Handles file uploads and storage management
//  */
// export class StorageClient {
//   private client: ZeroBaseClient;

//   constructor(client: ZeroBaseClient) {
//     if (!(client instanceof ZeroBaseClient)) throw new Error("Invalid SDK Client");
//     this.client = client;
//   }

//   async uploadFile(file: File): Promise<{ url: string; key: string }> {
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("projectId", this.client.getProjectId());

//     const response = await fetch(`${this.client.getUrl()}/api/storage/upload`, {
//       method: "POST",
//       headers: {
//         "X-API-Key": this.client.getApiKey(),
//       },
//       body: formData,
//     });
//     return response.json();
//   }

//   async deleteFile(key: string): Promise<void> {
//     await fetch(`${this.client.getUrl()}/api/storage/files/${key}`, {
//       method: "DELETE",
//       headers: {
//         "X-API-Key": this.client.getApiKey(),
//       },
//     });
//   }

//   async listFiles(): Promise<{ url: string; key: string }[]> {
//     const response = await fetch(
//       `${this.client.getUrl()}/api/storage/files?projectId=${this.client.getProjectId()}`,
//       {
//         headers: {
//           "X-API-Key": this.client.getApiKey(),
//         },
//       }
//     );
//     return response.json();
//   }
// }

// /**
//  * Account Client
//  * Handles user profile and session management
//  */
// export class AccountClient {
//   private client: ZeroBaseClient;

//   constructor(client: ZeroBaseClient) {
//     if (!(client instanceof ZeroBaseClient)) throw new Error("Invalid SDK Client");
//     this.client = client;
//   }

//   async getCurrentUser(token: string): Promise<UserData> {
//     const response = await fetch(`${this.client.getUrl()}/api/account/me`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to get current user");
//     }

//     return response.json();
//   }

//   async updateProfile(token: string, userData: Partial<UserData>): Promise<UserData> {
//     const response = await fetch(`${this.client.getUrl()}/api/account/me`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         projectId: this.client.getProjectId(),
//         ...userData,
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to update profile");
//     }

//     return response.json();
//   }

//   async validateSession(token: string): Promise<{ valid: boolean; user?: UserData }> {
//     const response = await fetch(`${this.client.getUrl()}/api/account/validate-session`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "X-API-Key": this.client.getApiKey(),
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       throw new Error(error.message || "Failed to validate session");
//     }

//     return response.json();
//   }
// }

// // Export error types
// export class ZeroBaseError extends Error {
//   constructor(message: string, public code: string, public status: number) {
//     super(message);
//     this.name = 'ZeroBaseError';
//   }
// }
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

// SDK Client
class ZeroBaseClient {
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
//
//
//
// Database Client
//
//
//
//
class DatabaseClient {
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
//
//
//
// Auth Client
//
//
//
//
class AuthClient {
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
//
//
//
// Storage Client
//
//
//
//
class StorageClient {
  private client: ZeroBaseClient;

  constructor(client: ZeroBaseClient) {
    if (!(client instanceof ZeroBaseClient))
      throw new Error("Invalid SDK Client");
    this.client = client;
  }

  async uploadFile(file: File): Promise<any> {
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
  }
}

//
//
// Account Client
//
//
//
//
class AccountClient {
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
        error: error instanceof Error ? error.message : 'An unknown error occurred',
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

//
//
// Example
//
//
//
// const client = new ZeroBaseClient("myProjectId", "https://api.zerobase.com");
// const db = new DatabaseClient(client);
// const auth = new AuthClient(client);
// const storage = new StorageClient(client);

export {
  ZeroBaseClient,
  DatabaseClient,
  AuthClient,
  StorageClient,
  AccountClient,
};
