const { Client } = require("pg");
const { getProjectDBUrl } = require("../config/db");

const getLogs = async (req, res) => {
    const { projectId, limit = 10, offset = 0 } = req.query;
    const projectClient = new Client(getProjectDBUrl(projectId));

    try {
        await projectClient.connect();

        const tableExists = await projectClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'logs'
      );
    `);

        if (!tableExists.rows[0].exists) {
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
        res.status(500).json({ error: error.message, details: "Error fetching logs", projectId });
    } finally {
        await projectClient.end();
    }
};

module.exports = { getLogs };
