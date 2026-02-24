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

  async getTables() {
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
    } catch (error) {
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

  async getUsers() {
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

  async deleteUser(userId) {
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
  constructor(client) {
    if (!(client instanceof ZeroBaseClient))
      throw new Error("Invalid SDK Client");
    this.client = client;
  }

  async uploadFile(file) {
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
  constructor(client) {
    if (!(client instanceof ZeroBaseClient))
      throw new Error("Invalid SDK Client");
    this.client = client;
  }

  async getCurrentUser(token) {
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
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        valid: false,
        error: error.message,
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

//
//
// Example
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
