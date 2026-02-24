const { Client } = require("pg");
const { getProjectDBUrl } = require("../config/db");
const { logRequest } = require("../utils/logger");

const typeMapping = {
    text: "TEXT",
    integer: "INTEGER",
    boolean: "BOOLEAN",
    timestamp: "TIMESTAMP",
};

const getTables = async (req, res) => {
    const { projectId } = req.query;
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });

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
                    `SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_name = $1`,
                    [table.table_name]
                );
                return { table_name: table.table_name, columns: columns.rows };
            })
        );

        res.json({ tables: tablesWithColumns });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const createTable = async (req, res) => {
    const { projectId, tableName } = req.body;
    console.log(`Connecting to: ${getProjectDBUrl(projectId)}`);
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });

    try {
        await client.connect();
        await client.query(`CREATE TABLE ${tableName} (id SERIAL PRIMARY KEY)`);
        await logRequest(projectId, "/api/db/tables", "POST", 200, `Table ${tableName} created`);
        res.json({ success: true });
    } catch (error) {
        await logRequest(projectId, "/api/db/tables", "POST", 500, error.message, { tableName });
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const deleteTable = async (req, res) => {
    const { projectId } = req.query;
    const { tableName } = req.params;
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });

    try {
        await client.connect();
        await client.query(`DROP TABLE ${tableName}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const addColumn = async (req, res) => {
    const { projectId, name, type } = req.body;
    const { tableName } = req.params;
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });

    try {
        await client.connect();
        await client.query(
            `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${typeMapping[type.toLowerCase()]}`
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Column creation error:", { projectId, tableName, error: error.message });
        res.status(500).json({
            error: `Failed to add column: ${error.message}`,
            details: { query: `ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${type}` },
        });
    } finally {
        client.end();
    }
};

const getDocuments = async (req, res) => {
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
};

const createDocument = async (req, res) => {
    const { projectId, document } = req.body;
    const { tableName } = req.params;
    const client = new Client(getProjectDBUrl(projectId));

    try {
        await client.connect();

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
};

const updateDocument = async (req, res) => {
    const { projectId, document } = req.body;
    const { userId } = req.params;
    const client = new Client(getProjectDBUrl(projectId));

    try {
        await client.connect();

        const safeDocument = { ...document };
        delete safeDocument.id;
        delete safeDocument.password_hash;
        delete safeDocument.created_at;

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

        await logRequest(projectId, `/api/db/tables/auth_users/documents/${userId}`, "PUT", 200, "User updated successfully", { userId });
        res.json(result.rows[0]);
    } catch (error) {
        await logRequest(projectId, `/api/db/tables/auth_users/documents/${userId}`, "PUT", 500, error.message, { userId });
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

module.exports = {
    getTables,
    createTable,
    deleteTable,
    addColumn,
    getDocuments,
    createDocument,
    updateDocument,
};
