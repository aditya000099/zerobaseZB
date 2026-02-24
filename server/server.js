require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/auth");
const dbRoutes = require("./routes/db");
const logsRoutes = require("./routes/logs");
const projectRoutes = require("./routes/projects");
const storageRoutes = require("./routes/storage");
const { authenticate } = require("./middleware/authenticate");
const { getCurrentUser } = require("./controllers/authController");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// The dashboard itself always needs CORS (localhost dev).
// SDK routes handle their own per-project origin validation via verifyAccess middleware.
app.use(
  cors({
    origin: [
      "http://localhost:3002",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "X-API-Key",
      "projectid",
    ],
    credentials: true,
  })
);

// Expose CORS to all origins for SDK routes (verifyAccess will enforce per-project allowlist)
app.use("/api/auth", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use("/api/db", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use("/api/storage", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

const startServer = async () => {
  const mainClient = await connectDB();

  // ── Migrations ───────────────────────────────────────────────────────────
  try {
    await mainClient.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS storage_quota_mb INTEGER DEFAULT 1024;
    `);
    await mainClient.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS authorized_urls TEXT[] DEFAULT '{}';
    `);
    console.log("✓ DB migrations applied");
  } catch (err) {
    console.error("Migration warning:", err.message);
  }

  // ── Health check ─────────────────────────────────────────────────────────
  app.get("/api/health", async (req, res) => {
    try {
      await mainClient.query("SELECT 1");
      res.json({
        status: "ok",
        db: "connected",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      });
    } catch {
      res.status(503).json({
        status: "degraded",
        db: "disconnected",
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ── Routes ───────────────────────────────────────────────────────────────
  app.use("/api/auth", authRoutes(mainClient));
  app.use("/api/db", dbRoutes(mainClient));
  app.use("/api/logs", logsRoutes);
  app.use("/api/projects", projectRoutes(mainClient));
  app.use("/api/storage", storageRoutes(mainClient));
  app.get("/api/account/me", authenticate, getCurrentUser);

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
