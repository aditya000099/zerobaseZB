const { Client } = require("pg");
const { getProjectDBUrl } = require("../config/db");
const { logRequest } = require("../utils/logger");

// Full Postgres type set (safe subset for user-facing schema management)
const VALID_PG_TYPES = new Set([
    "TEXT", "VARCHAR", "CHAR", "BPCHAR",
    "INTEGER", "INT", "INT2", "INT4", "INT8", "BIGINT", "SMALLINT",
    "SERIAL", "BIGSERIAL", "SMALLSERIAL",
    "NUMERIC", "DECIMAL", "REAL", "FLOAT4", "FLOAT8", "DOUBLE PRECISION",
    "BOOLEAN", "BOOL",
    "DATE", "TIME", "TIMETZ", "TIMESTAMP", "TIMESTAMPTZ",
    "INTERVAL",
    "UUID",
    "JSON", "JSONB",
    "BYTEA",
    "CIDR", "INET", "MACADDR",
]);

function validatePgType(type) {
    const upper = type.trim().toUpperCase();
    // Allow types with optional length/precision like VARCHAR(255), NUMERIC(10,2)
    const base = upper.replace(/\(.*\)$/, "").trim();
    if (!VALID_PG_TYPES.has(base)) {
        throw new Error(`Unsupported type "${type}". Use a standard PostgreSQL type.`);
    }
    return upper; // return sanitised upper-case form for use in SQL
}

// ── Table operations ─────────────────────────────────────────────────────────
const getTables = async (req, res) => {
    const { projectId } = req.query;
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });

    try {
        await client.connect();
        const tables = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);

        const tablesWithColumns = await Promise.all(
            tables.rows.map(async (table) => {
                const columns = await client.query(
                    `SELECT column_name, data_type, udt_name, character_maximum_length, is_nullable, column_default
                     FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = $1
                     ORDER BY ordinal_position`,
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
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
        return res.status(400).json({ error: "Invalid table name. Use letters, numbers, and underscores only." });
    }
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        await client.query(`CREATE TABLE "${tableName}" (id SERIAL PRIMARY KEY)`);
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
        await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
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

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        return res.status(400).json({ error: "Invalid column name." });
    }

    let safeType;
    try { safeType = validatePgType(type); }
    catch (err) { return res.status(400).json({ error: err.message }); }

    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        await client.query(`ALTER TABLE "${tableName}" ADD COLUMN "${name}" ${safeType}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

// ── Document operations ───────────────────────────────────────────────────────
const getDocuments = async (req, res) => {
    const { projectId } = req.query;
    const { tableName } = req.params;
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        const result = await client.query(`SELECT * FROM "${tableName}" LIMIT 500`);
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
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        const columns = Object.keys(document);
        const values = Object.values(document);
        const placeholders = values.map((_, idx) => `$${idx + 1}`);
        const query = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
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
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
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
        const query = `UPDATE auth_users SET ${setClause} WHERE id = $${values.length} RETURNING *`;
        const result = await client.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
        await logRequest(projectId, `/api/db/tables/auth_users/documents/${userId}`, "PUT", 200, "User updated");
        res.json(result.rows[0]);
    } catch (error) {
        await logRequest(projectId, `/api/db/tables/auth_users/documents/${userId}`, "PUT", 500, error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

// ── Index operations ──────────────────────────────────────────────────────────
const getIndexes = async (req, res) => {
    const { projectId } = req.query;
    const { tableName } = req.params;
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        // pg_indexes gives us user-created indexes; filter out pkey constraints
        const result = await client.query(
            `SELECT
                pi.indexname,
                pi.indexdef,
                COALESCE(
                    (SELECT json_agg(a.attname ORDER BY x.n)
                     FROM pg_index i
                     JOIN pg_class ci ON ci.oid = i.indexrelid
                     JOIN pg_class ct ON ct.oid = i.indrelid
                     JOIN lateral unnest(i.indkey) WITH ORDINALITY AS x(k, n) ON true
                     JOIN pg_attribute a ON a.attrelid = ct.oid AND a.attnum = x.k
                     WHERE ci.relname = pi.indexname),
                    '[]'::json
                ) AS columns,
                COALESCE(
                    (SELECT indisunique FROM pg_index i
                     JOIN pg_class ci ON ci.oid = i.indexrelid
                     WHERE ci.relname = pi.indexname),
                    false
                ) AS is_unique
             FROM pg_indexes pi
             WHERE pi.schemaname = 'public'
               AND pi.tablename  = $1
               AND pi.indexname  NOT LIKE '%_pkey'
             ORDER BY pi.indexname`,
            [tableName]
        );
        // Ensure columns is always a JS array (json_agg returns native array via pg driver)
        const indexes = result.rows.map((row) => ({
            ...row,
            columns: Array.isArray(row.columns) ? row.columns : [],
        }));
        res.json({ indexes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const createIndex = async (req, res) => {
    const { projectId, columns, unique = false, method = "btree" } = req.body;
    const { tableName } = req.params;

    // Validate method
    const VALID_METHODS = ["btree", "hash", "gin", "gist", "brin", "spgist"];
    if (!VALID_METHODS.includes(method.toLowerCase())) {
        return res.status(400).json({ error: `Invalid index method. Choose: ${VALID_METHODS.join(", ")}` });
    }

    // Validate columns
    if (!Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ error: "At least one column is required." });
    }
    for (const col of columns) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) {
            return res.status(400).json({ error: `Invalid column name: "${col}"` });
        }
    }

    // Deterministic index name
    const indexName = `idx_${tableName}_${columns.join("_")}`.slice(0, 63);
    const colList = columns.map(c => `"${c}"`).join(", ");
    const uniqueClause = unique ? "UNIQUE" : "";

    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        await client.query(
            `CREATE ${uniqueClause} INDEX CONCURRENTLY IF NOT EXISTS "${indexName}"
             ON "${tableName}" USING ${method} (${colList})`
        );
        res.json({ success: true, indexName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const dropIndex = async (req, res) => {
    const { projectId } = req.body;
    const { tableName, indexName } = req.params;

    // Safety: don't allow dropping pkey or system indexes
    if (indexName.endsWith("_pkey") || !indexName.startsWith("idx_")) {
        return res.status(400).json({ error: "Cannot drop primary key or system indexes." });
    }

    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        await client.query(`DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

// ── Extension operations ─────────────────────────────────────────────────────
// Curated whitelist — prevents installing unsafe/superuser-only extensions
const SAFE_EXTENSIONS = new Set([
    "uuid-ossp", "pgcrypto", "hstore", "pg_trgm", "fuzzystrmatch",
    "citext", "ltree", "intarray", "tablefunc", "unaccent",
    "pg_stat_statements", "pgrowlocks", "pgstattuple",
    "postgis", "postgis_topology", "postgis_tiger_geocoder",
    "vector", "bloom", "btree_gin", "btree_gist",
    "dict_int", "dict_xsyn", "earthdistance", "cube",
    "isn", "lo", "seg", "xml2",
]);

const getExtensions = async (req, res) => {
    const { projectId } = req.query;
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        // Join available extensions with installed extensions
        const result = await client.query(`
            SELECT
                ae.name,
                ae.default_version,
                ae.installed_version,
                ae.comment,
                (e.extname IS NOT NULL) AS installed
            FROM pg_available_extensions ae
            LEFT JOIN pg_extension e ON e.extname = ae.name
            ORDER BY installed DESC, ae.name
        `);
        res.json({ extensions: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const enableExtension = async (req, res) => {
    const { projectId, name } = req.body;
    if (!SAFE_EXTENSIONS.has(name)) {
        return res.status(400).json({ error: `Extension "${name}" is not in the allowed list.` });
    }
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        await client.query(`CREATE EXTENSION IF NOT EXISTS "${name}"`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

const disableExtension = async (req, res) => {
    const { projectId, name } = req.body;
    if (!SAFE_EXTENSIONS.has(name)) {
        return res.status(400).json({ error: `Extension "${name}" is not in the allowed list.` });
    }
    const client = new Client({ connectionString: getProjectDBUrl(projectId) });
    try {
        await client.connect();
        await client.query(`DROP EXTENSION IF EXISTS "${name}" CASCADE`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        client.end();
    }
};

module.exports = {
    getTables, createTable, deleteTable, addColumn,
    getDocuments, createDocument, updateDocument,
    getIndexes, createIndex, dropIndex,
    getExtensions, enableExtension, disableExtension,
};
