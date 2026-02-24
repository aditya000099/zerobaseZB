require("dotenv").config();
const { Client } = require("pg");

const connectDB = async () => {
    console.log("Connecting to PostgreSQL...");

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

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to zerobase_main database");

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

function getProjectDBUrl(projectId) {
    const baseUrl = process.env.DATABASE_URL.split("/").slice(0, -1).join("/");
    return `${baseUrl}/${projectId}`;
}

module.exports = { connectDB, getProjectDBUrl };
