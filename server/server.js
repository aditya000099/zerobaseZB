require("dotenv").config();
const express = require("express");
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const speakeasy = require("speakeasy");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();

// Update CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3002", "http://localhost:3000"], // Add all allowed origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "projectid",
      "Access-Control-Allow-Headers",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Database connection setup
const connectDB = async () => {
  console.log("Connecting to PostgreSQL...");

  // First connect to default database to create zerobase_main
  const adminClient = new Client({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: "postgres",
    database: "postgres",
    port: 5432,
  });

  try {
    await adminClient.connect();
    console.log("Connected to PostgreSQL admin");

    // Create main database if not exists
    await adminClient.query(`
        CREATE DATABASE ${process.env.POSTGRES_DB}
        WITH OWNER ${process.env.POSTGRES_USER}
        ENCODING 'UTF8'
        LC_COLLATE = 'en_US.utf8'
        LC_CTYPE = 'en_US.utf8';
      `);

    await adminClient.end();
  } catch (error) {
    console.log("Main database already exists");
  }

  // Now connect to zerobase_main
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to zerobase_main database");

    // Initialize projects table
    await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          apiKey TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

    return client;
  } catch (error) {
    console.error("Connection error:", error.message);
    process.exit(1);
  }
};

// Add these functions before startServer
const generateApiKey = async () => {
  const apiKey = uuidv4();
  const saltRounds = 10;
  const hashedApiKey = await bcrypt.hash(apiKey, saltRounds);
  return { apiKey, hashedApiKey };
};

const verifyApiKey = async (providedApiKey, hashedApiKey) => {
  return await bcrypt.compare(providedApiKey, hashedApiKey);
};

// Start server
const startServer = async () => {
  const client = await connectDB();

  // Add type mapping in server.js
  const typeMapping = {
    text: "TEXT",
    integer: "INTEGER",
    boolean: "BOOLEAN",
    timestamp: "TIMESTAMP",
  };
  //
  //
  //
  //
  //
  // Auth
  //
  //
  //
  //
  //
  //
  // Auth Config
  const authConfig = {
    jwtSecret: process.env.JWT_SECRET || "default_secret",
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    defaultExpiry: "365d",
  };

  // Define latest schema version
  const LATEST_SCHEMA = {
    auth_users: {
      id: "SERIAL PRIMARY KEY",
      email: "VARCHAR(255) UNIQUE NOT NULL",
      name: "VARCHAR(255)",
      password_hash: "VARCHAR(255)",
      google_id: "VARCHAR(255)",
      otp_secret: "VARCHAR(255)",
      last_login: "TIMESTAMP",
      last_ip: "VARCHAR(45)",
      login_count: "INTEGER DEFAULT 0",
      failed_attempts: "INTEGER DEFAULT 0",
      last_failed_attempt: "TIMESTAMP",
      status: "VARCHAR(20) DEFAULT 'active'",
      email_verified: "BOOLEAN DEFAULT false",
      phone: "VARCHAR(20)",
      phone_verified: "BOOLEAN DEFAULT false",
      jwt_expiry: "VARCHAR(10) DEFAULT '365d'",
      preferences: "JSONB DEFAULT '{}'",
      metadata: "JSONB DEFAULT '{}'",
      created_at: "TIMESTAMP DEFAULT NOW()",
      updated_at: "TIMESTAMP DEFAULT NOW()",
    },
    logs: {
      id: "SERIAL PRIMARY KEY",
      project_id: "VARCHAR(255)",
      endpoint: "VARCHAR(255)",
      method: "VARCHAR(10)",
      status: "INTEGER",
      message: "TEXT",
      metadata: "JSONB DEFAULT '{}'",
      created_at: "TIMESTAMP DEFAULT NOW()",
    },
    // Add other tables here as needed
  };

  // Auto-migration function
  const autoMigrateSchema = async (client, tableName, schema) => {
    try {
      // Get current columns
      const result = await client.query(
        `
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1;
      `,
        [tableName]
      );

      const currentColumns = result.rows.reduce((acc, col) => {
        acc[col.column_name] = true;
        return acc;
      }, {});

      // Check and add missing columns
      for (const [columnName, definition] of Object.entries(schema)) {
        if (!currentColumns[columnName]) {
          try {
            await client.query(`
              ALTER TABLE ${tableName} 
              ADD COLUMN IF NOT EXISTS ${columnName} ${definition};
            `);
            console.log(`Added column ${columnName} to ${tableName}`);
          } catch (err) {
            console.error(`Error adding column ${columnName}:`, err.message);
          }
        }
      }

      // Create indexes if they don't exist
      const indexes = {
        idx_auth_users_email:
          "CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email)",
        idx_auth_users_google_id:
          "CREATE INDEX IF NOT EXISTS idx_auth_users_google_id ON auth_users(google_id)",
      };

      for (const [indexName, createStatement] of Object.entries(indexes)) {
        try {
          await client.query(createStatement);
        } catch (err) {
          console.error(`Error creating index ${indexName}:`, err.message);
        }
      }

      // Ensure updated_at trigger exists
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};
        
        CREATE TRIGGER update_${tableName}_updated_at
            BEFORE UPDATE ON ${tableName}
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `);

      return true;
    } catch (error) {
      console.error("Migration error:", error);
      return false;
    }
  };

  // Add logging utility function
  const logRequest = async (
    projectId,
    endpoint,
    method,
    status,
    message,
    metadata = {}
  ) => {
    const projectClient = new Client(getProjectDBUrl(projectId));

    try {
      await projectClient.connect();

      // Ensure logs table exists
      await projectClient.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          project_id VARCHAR(255),
          endpoint VARCHAR(255),
          method VARCHAR(10),
          status INTEGER,
          message TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await projectClient.query(
        `INSERT INTO logs (project_id, endpoint, method, status, message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, endpoint, method, status, message, JSON.stringify(metadata)]
      );
    } catch (error) {
      console.error("Logging error:", error.message);
    } finally {
      await projectClient.end();
    }
  };

  // Enhanced Database Schema for Users with migration support
  app.post("/api/auth/init", async (req, res) => {
    const { projectId } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();

      // Create table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
          id SERIAL PRIMARY KEY
        );
      `);

      // Auto-migrate to latest schema
      await autoMigrateSchema(client, "auth_users", LATEST_SCHEMA.auth_users);
      await autoMigrateSchema(client, "logs", LATEST_SCHEMA.logs);

      // await logRequest(
      //   projectId,
      //   "/api/auth/init",
      //   "POST",
      //   200,
      //   "Auth system initialized"
      // );
      res.json({ success: true });
    } catch (error) {
      await logRequest(projectId, "/api/auth/init", "POST", 500, error.message);
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // JWT Middleware
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, authConfig.jwtSecret, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // Add this new endpoint for account validation
  app.get("/api/account/me", authenticate, async (req, res) => {
    const { projectId } = req.query;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();
      const result = await client.query(
        "SELECT id, email, name, created_at FROM auth_users WHERE id = $1",
        [req.user.userId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { projectId, email, password, name } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.connect();

      const result = await client.query(
        `INSERT INTO auth_users (email, password_hash, name) 
         VALUES ($1, $2, $3) RETURNING id, email, name, created_at`,
        [email, hashedPassword, name]
      );

      const token = jwt.sign(
        { userId: result.rows[0].id },
        authConfig.jwtSecret,
        { expiresIn: authConfig.defaultExpiry }
      );

      await logRequest(
        projectId,
        "/api/auth/signup",
        "POST",
        200,
        "User signup successful",
        { email, name }
      );
      res.json({ user: result.rows[0], token });
    } catch (error) {
      await logRequest(
        projectId,
        "/api/auth/signup",
        "POST",
        500,
        error.message,
        { email, name }
      );
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { projectId, email, password } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();
      const user = await client.query(
        "SELECT * FROM auth_users WHERE email = $1",
        [email]
      );

      if (!user.rows[0])
        return res.status(404).json({ error: "User not found" });

      const valid = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: "Invalid password" });

      // Update last login
      await client.query(
        "UPDATE auth_users SET last_login = NOW() WHERE id = $1",
        [user.rows[0].id]
      );

      const token = jwt.sign(
        { userId: user.rows[0].id },
        authConfig.jwtSecret,
        { expiresIn: user.rows[0].jwt_expiry }
      );

      await logRequest(
        projectId,
        "/api/auth/login",
        "POST",
        200,
        "User login successful",
        { email }
      );
      res.json({ user: user.rows[0], token });
    } catch (error) {
      await logRequest(
        projectId,
        "/api/auth/login",
        "POST",
        500,
        error.message,
        { email }
      );
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Google OAuth
  app.post("/api/auth/google", async (req, res) => {
    const { projectId, credential } = req.body;
    const client = new OAuth2Client(authConfig.googleClientId);

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: authConfig.googleClientId,
      });
      const payload = ticket.getPayload();

      const dbClient = new Client(getProjectDBUrl(projectId));
      await dbClient.connect();

      // Check existing user
      let user = await dbClient.query(
        "SELECT * FROM auth_users WHERE google_id = $1 OR email = $2",
        [payload.sub, payload.email]
      );

      if (!user.rows[0]) {
        user = await dbClient.query(
          `INSERT INTO auth_users (email, google_id) 
         VALUES ($1, $2) RETURNING *`,
          [payload.email, payload.sub]
        );
      }

      const token = jwt.sign(
        { userId: user.rows[0].id },
        authConfig.jwtSecret,
        { expiresIn: user.rows[0].jwt_expiry }
      );

      res.json({ user: user.rows[0], token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // OTP Setup
  app.post("/api/auth/otp/setup", authenticate, async (req, res) => {
    const { projectId } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      const secret = speakeasy.generateSecret({ length: 20 });
      await client.connect();

      await client.query(
        "UPDATE auth_users SET otp_secret = $1 WHERE id = $2",
        [secret.base32, req.user.userId]
      );

      res.json({
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // User Management
  app.get("/api/auth/users", async (req, res) => {
    const { projectId } = req.query;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();
      const users = await client.query("SELECT * FROM auth_users");
      res.json(users.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  app.put("/api/auth/expiry", authenticate, async (req, res) => {
    const { projectId, userId, expiry } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();
      await client.query(
        "UPDATE auth_users SET jwt_expiry = $1 WHERE id = $2",
        [expiry, userId]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Add new route for updating user
  app.put("/api/db/tables/auth_users/documents/:userId", async (req, res) => {
    const { projectId, document } = req.body;
    const { userId } = req.params;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();

      // Remove fields that shouldn't be updated directly
      const safeDocument = { ...document };
      delete safeDocument.id;
      delete safeDocument.password_hash;
      delete safeDocument.created_at;

      // Generate SET clause for update query
      const setClause = Object.entries(safeDocument)
        .map(([key, _], index) => `"${key}" = $${index + 1}`)
        .join(", ");

      const values = [...Object.values(safeDocument), userId];

      const query = `
        UPDATE auth_users 
        SET ${setClause}
        WHERE id = $${values.length}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      await logRequest(
        projectId,
        `/api/db/tables/auth_users/documents/${userId}`,
        "PUT",
        200,
        "User updated successfully",
        { userId }
      );

      res.json(result.rows[0]);
    } catch (error) {
      await logRequest(
        projectId,
        `/api/db/tables/auth_users/documents/${userId}`,
        "PUT",
        500,
        error.message,
        { userId }
      );
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Add this new route within the auth routes section
  app.delete("/api/auth/users/:userId", async (req, res) => {
    const { projectId } = req.query;
    const { userId } = req.params;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();
      const result = await client.query(
        "DELETE FROM auth_users WHERE id = $1 RETURNING id",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      await logRequest(
        projectId,
        `/api/auth/users/${userId}`,
        "DELETE",
        200,
        "User deleted successfully",
        { userId }
      );

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      await logRequest(
        projectId,
        `/api/auth/users/${userId}`,
        "DELETE",
        500,
        error.message,
        { userId }
      );
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  //
  //
  //
  //
  //
  //
  //
  //
  // Tables & Projects CRUD
  //
  //
  //
  //
  //
  //
  //
  //

  function getProjectDBUrl(projectId) {
    // Get base URL without database name
    const baseUrl = process.env.DATABASE_URL.split("/").slice(0, -1).join("/");
    // Append project ID directly
    return `${baseUrl}/${projectId}`;
  }

  // Get tables and columns
  app.get("/api/db/tables", async (req, res) => {
    const { projectId } = req.query;
    const client = new Client({
      connectionString: getProjectDBUrl(projectId),
    });

    try {
      await client.connect();
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const tablesWithColumns = await Promise.all(
        tables.rows.map(async (table) => {
          const columns = await client.query(
            `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
          `,
            [table.table_name]
          );

          return {
            table_name: table.table_name,
            columns: columns.rows,
          };
        })
      );

      res.json({ tables: tablesWithColumns });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Create table
  app.post("/api/db/tables", async (req, res) => {
    const { projectId, tableName } = req.body;
    console.log(`Connecting to: ${getProjectDBUrl(projectId)}`);
    const client = new Client({
      connectionString: getProjectDBUrl(projectId),
    });

    try {
      await client.connect();
      await client.query(`CREATE TABLE ${tableName} (id SERIAL PRIMARY KEY)`);
      await logRequest(
        projectId,
        "/api/db/tables",
        "POST",
        200,
        `Table ${tableName} created`
      );
      res.json({ success: true });
    } catch (error) {
      await logRequest(
        projectId,
        "/api/db/tables",
        "POST",
        500,
        error.message,
        { tableName }
      );
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Delete table
  app.delete("/api/db/tables/:tableName", async (req, res) => {
    const { projectId } = req.query;
    const { tableName } = req.params;
    const client = new Client({
      connectionString: getProjectDBUrl(projectId),
    });

    try {
      await client.connect();
      await client.query(`DROP TABLE ${tableName}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Add before column creation endpoint
  app.use("/api/db/tables/:tableName/columns", (req, res, next) => {
    const validTypes = ["text", "integer", "boolean", "timestamp"];
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Missing name or type" });
    }

    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid type: ${type}. Valid types: ${validTypes.join(", ")}`,
      });
    }

    next();
  });

  // Add column
  app.post("/api/db/tables/:tableName/columns", async (req, res) => {
    const { projectId, name, type } = req.body;
    const { tableName } = req.params;
    const client = new Client({
      connectionString: getProjectDBUrl(projectId),
    });

    try {
      await client.connect();
      // Use parameterized query with proper escaping
      await client.query(
        `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${
          typeMapping[type.toLowerCase()]
        }`
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Column creation error:", {
        projectId,
        tableName,
        error: error.message,
      });
      res.status(500).json({
        error: `Failed to add column: ${error.message}`,
        details: {
          query: `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${type}`,
        },
      });
    } finally {
      client.end();
    }
  });

  // Document Management Routes
  app.get("/api/db/tables/:tableName/documents", async (req, res) => {
    const { projectId } = req.query;
    const { tableName } = req.params;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();
      const result = await client.query(`SELECT * FROM ${tableName}`);
      res.json({ documents: result.rows });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  app.post("/api/db/tables/:tableName/documents", async (req, res) => {
    const { projectId, document } = req.body;
    const { tableName } = req.params;
    const client = new Client(getProjectDBUrl(projectId));

    try {
      await client.connect();

      // Generate the dynamic INSERT query
      const columns = Object.keys(document);
      const values = Object.values(document);
      const placeholders = values.map((_, idx) => `$${idx + 1}`);

      const query = `
        INSERT INTO ${tableName} (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;

      const result = await client.query(query, values);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.end();
    }
  });

  // Replace the project creation endpoint with this updated version
  app.post("/api/projects", async (req, res) => {
    const { name } = req.body;
    const projectId = `project_${Date.now()}`; // Simplified project ID

    try {
      // Generate API key
      const { apiKey, hashedApiKey } = await generateApiKey();

      // Create new database with exact project ID
      await client.query(`CREATE DATABASE "${projectId}"`);

      // Connect to the new project database to create logs table
      const projectClient = new Client(getProjectDBUrl(projectId));
      await projectClient.connect();

      // Create logs table in the project database
      await projectClient.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          project_id VARCHAR(255),
          endpoint VARCHAR(255),
          method VARCHAR(10),
          status INTEGER,
          message TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await projectClient.end();

      // Create project entry
      await client.query(
        "INSERT INTO projects (id, name, apiKey) VALUES ($1, $2, $3)",
        [projectId, name, hashedApiKey]
      );

      // Create storage directory
      const storagePath = `${process.env.STORAGE_PATH}/${projectId}`;
      fs.mkdirSync(storagePath, { recursive: true });

      res.status(201).json({
        projectId,
        name,
        apiKey, // Return the unencrypted API key only once
        message: "Store this API key safely. It won't be shown again.",
      });
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get single project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const result = await client.query(
        "SELECT * FROM projects WHERE id = $1",
        [req.params.id]
      );
      res.json(result.rows[0] || null);
    } catch (error) {
      console.error("Project fetch error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const result = await client.query(
        "SELECT * FROM projects ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Projects fetch error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Add logs retrieval endpoint
  app.get("/api/logs", async (req, res) => {
    const { projectId, limit = 10, offset = 0 } = req.query;
    const projectClient = new Client(getProjectDBUrl(projectId));

    try {
      await projectClient.connect();

      // First check if logs table exists
      const tableExists = await projectClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'logs'
        );
      `);

      if (!tableExists.rows[0].exists) {
        // Create logs table if it doesn't exist
        await projectClient.query(`
          CREATE TABLE IF NOT EXISTS logs (
            id SERIAL PRIMARY KEY,
            project_id VARCHAR(255),
            endpoint VARCHAR(255),
            method VARCHAR(10),
            status INTEGER,
            message TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
      }

      const result = await projectClient.query(
        `SELECT * FROM logs 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json(result.rows || []);
    } catch (error) {
      console.error("Logs fetch error:", error);
      res.status(500).json({
        error: error.message,
        details: "Error fetching logs",
        projectId,
      });
    } finally {
      await projectClient.end();
    }
  });

  // Add a new endpoint to verify API key
  app.post("/api/projects/verify-key", async (req, res) => {
    const { projectId, apiKey } = req.body;

    try {
      const result = await client.query(
        "SELECT apiKey FROM projects WHERE id = $1",
        [projectId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ error: "Project not found" });
      }

      const isValid = await verifyApiKey(apiKey, result.rows[0].apiKey);
      res.json({ isValid });
    } catch (error) {
      console.error("API key verification error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Serve React dashboard
  const staticPath = path.join(__dirname, "client/build");
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
    Zerobase Running!
    =================
    Dashboard: http://localhost:${PORT}
    API Docs:  http://localhost:${PORT}/api
    PostgreSQL: postgres://admin:${process.env.POSTGRES_PASSWORD}@localhost:5432
    `);
  });
};

startServer();
