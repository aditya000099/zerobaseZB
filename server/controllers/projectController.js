const fs = require("fs");
const { Client } = require("pg");
const { getProjectDBUrl } = require("../config/db");
const { generateApiKey, verifyApiKey } = require("../utils/apiKey");

// mainClient is passed in from server.js (the shared connection to zerobase_main)
const createProject = (mainClient) => async (req, res) => {
    const { name, storageMb = 1024 } = req.body;
    const projectId = `project_${Date.now()}`;

    try {
        const { apiKey, hashedApiKey } = await generateApiKey();

        await mainClient.query(`CREATE DATABASE "${projectId}"`);

        const projectClient = new Client(getProjectDBUrl(projectId));
        await projectClient.connect();

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

        await mainClient.query(
            "INSERT INTO projects (id, name, apiKey, storage_quota_mb) VALUES ($1, $2, $3, $4)",
            [projectId, name, hashedApiKey, storageMb]
        );

        const storagePath = `${process.env.STORAGE_PATH}/${projectId}`;
        fs.mkdirSync(storagePath, { recursive: true });

        res.status(201).json({
            projectId,
            name,
            apiKey,
            message: "Store this API key safely. It won't be shown again.",
        });
    } catch (error) {
        console.error("Project creation error:", error);
        res.status(500).json({ error: error.message });
    }
};

const getProject = (mainClient) => async (req, res) => {
    try {
        const result = await mainClient.query(
            "SELECT * FROM projects WHERE id = $1",
            [req.params.id]
        );
        res.json(result.rows[0] || null);
    } catch (error) {
        console.error("Project fetch error:", error);
        res.status(500).json({ error: error.message });
    }
};

const getAllProjects = (mainClient) => async (req, res) => {
    try {
        const result = await mainClient.query(
            "SELECT * FROM projects ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Projects fetch error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

const verifyProjectKey = (mainClient) => async (req, res) => {
    const { projectId, apiKey } = req.body;

    try {
        const result = await mainClient.query(
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
};

const getAuthorizedUrls = (mainClient) => async (req, res) => {
    try {
        const result = await mainClient.query(
            "SELECT authorized_urls FROM projects WHERE id = $1",
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: "Project not found" });
        res.json({ urls: result.rows[0].authorized_urls || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const addAuthorizedUrl = (mainClient) => async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });

    // Basic origin validation — must be http/https with no path
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
        if (parsed.pathname !== '/') throw new Error();
    } catch {
        return res.status(400).json({ error: "url must be a valid http/https origin with no path (e.g. https://myapp.com)" });
    }

    const clean = url.replace(/\/$/, "");

    try {
        // Add only if not already present
        await mainClient.query(
            `UPDATE projects
             SET authorized_urls = array_append(
               authorized_urls,
               $1::text
             )
             WHERE id = $2
               AND NOT ($1::text = ANY(COALESCE(authorized_urls, '{}')))
            `,
            [clean, req.params.id]
        );
        const result = await mainClient.query(
            "SELECT authorized_urls FROM projects WHERE id = $1",
            [req.params.id]
        );
        res.json({ urls: result.rows[0]?.authorized_urls || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const removeAuthorizedUrl = (mainClient) => async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });

    const clean = url.replace(/\/$/, "");

    try {
        await mainClient.query(
            "UPDATE projects SET authorized_urls = array_remove(authorized_urls, $1::text) WHERE id = $2",
            [clean, req.params.id]
        );
        const result = await mainClient.query(
            "SELECT authorized_urls FROM projects WHERE id = $1",
            [req.params.id]
        );
        res.json({ urls: result.rows[0]?.authorized_urls || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const regenerateApiKey = (mainClient) => async (req, res) => {
    try {
        const { apiKey, hashedApiKey } = await generateApiKey();
        await mainClient.query(
            "UPDATE projects SET apikey = $1 WHERE id = $2",
            [hashedApiKey, req.params.id]
        );
        res.json({ apiKey, message: "Store this key safely. It won't be shown again." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createProject,
    getProject,
    getAllProjects,
    verifyProjectKey,
    getAuthorizedUrls,
    addAuthorizedUrl,
    removeAuthorizedUrl,
    regenerateApiKey,
};
