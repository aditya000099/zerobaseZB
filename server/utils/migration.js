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
};

const autoMigrateSchema = async (client, tableName, schema) => {
    try {
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

module.exports = { LATEST_SCHEMA, autoMigrateSchema };
