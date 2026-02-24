const { Client } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const { OAuth2Client } = require("google-auth-library");
const { getProjectDBUrl } = require("../config/db");
const authConfig = require("../config/auth");
const { logRequest } = require("../utils/logger");
const { autoMigrateSchema, LATEST_SCHEMA } = require("../utils/migration");

const initAuth = async (req, res) => {
    const { projectId } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
        await client.connect();

        await client.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY
      );
    `);

        await autoMigrateSchema(client, "auth_users", LATEST_SCHEMA.auth_users);
        await autoMigrateSchema(client, "logs", LATEST_SCHEMA.logs);

        res.json({ success: true });
    } catch (error) {
        await logRequest(projectId, "/api/auth/init", "POST", 500, error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const signup = async (req, res) => {
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

        await logRequest(projectId, "/api/auth/signup", "POST", 200, "User signup successful", { email, name });
        res.json({ user: result.rows[0], token });
    } catch (error) {
        await logRequest(projectId, "/api/auth/signup", "POST", 500, error.message, { email, name });
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const login = async (req, res) => {
    const { projectId, email, password } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
        await client.connect();
        const user = await client.query(
            "SELECT * FROM auth_users WHERE email = $1",
            [email]
        );

        if (!user.rows[0]) return res.status(404).json({ error: "User not found" });

        const valid = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!valid) return res.status(401).json({ error: "Invalid password" });

        await client.query(
            "UPDATE auth_users SET last_login = NOW() WHERE id = $1",
            [user.rows[0].id]
        );

        const token = jwt.sign(
            { userId: user.rows[0].id },
            authConfig.jwtSecret,
            { expiresIn: user.rows[0].jwt_expiry }
        );

        await logRequest(projectId, "/api/auth/login", "POST", 200, "User login successful", { email });
        res.json({ user: user.rows[0], token });
    } catch (error) {
        await logRequest(projectId, "/api/auth/login", "POST", 500, error.message, { email });
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const googleAuth = async (req, res) => {
    const { projectId, credential } = req.body;
    const oauthClient = new OAuth2Client(authConfig.googleClientId);

    try {
        const ticket = await oauthClient.verifyIdToken({
            idToken: credential,
            audience: authConfig.googleClientId,
        });
        const payload = ticket.getPayload();

        const dbClient = new Client(getProjectDBUrl(projectId));
        await dbClient.connect();

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
};

const setupOtp = async (req, res) => {
    const { projectId } = req.body;
    const client = new Client(getProjectDBUrl(projectId));

    try {
        const secret = speakeasy.generateSecret({ length: 20 });
        await client.connect();

        await client.query(
            "UPDATE auth_users SET otp_secret = $1 WHERE id = $2",
            [secret.base32, req.user.userId]
        );

        res.json({ secret: secret.base32, qrCodeUrl: secret.otpauth_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const getUsers = async (req, res) => {
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
};

const updateExpiry = async (req, res) => {
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
};

const deleteUser = async (req, res) => {
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

        await logRequest(projectId, `/api/auth/users/${userId}`, "DELETE", 200, "User deleted successfully", { userId });
        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        await logRequest(projectId, `/api/auth/users/${userId}`, "DELETE", 500, error.message, { userId });
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const getCurrentUser = async (req, res) => {
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
};

module.exports = {
    initAuth,
    signup,
    login,
    googleAuth,
    setupOtp,
    getUsers,
    updateExpiry,
    deleteUser,
    getCurrentUser,
};
