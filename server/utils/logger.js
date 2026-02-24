const { Client } = require("pg");
const { getProjectDBUrl } = require("../config/db");

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

module.exports = { logRequest };
