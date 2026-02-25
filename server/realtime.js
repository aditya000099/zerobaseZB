const { WebSocketServer } = require("ws");
const { verifyApiKey } = require("./utils/apiKey");

// ── State ────────────────────────────────────────────────────────────────────
// projectId → Set<{ ws, subscribedTables: Set<string> }>
const projects = new Map();

function getProjectStats() {
    const stats = {};
    for (const [pid, clients] of projects) {
        const tables = {};
        for (const c of clients) {
            for (const t of c.subscribedTables) {
                tables[t] = (tables[t] || 0) + 1;
            }
        }
        stats[pid] = { connections: clients.size, tables };
    }
    return stats;
}

// ── Broadcast (called from dbController) ─────────────────────────────────────
function broadcast(projectId, tableName, event, data) {
    const clients = projects.get(projectId);
    if (!clients) return;
    const msg = JSON.stringify({ type: "change", event, table: tableName, data, ts: Date.now() });
    for (const c of clients) {
        if (c.subscribedTables.has(tableName) && c.ws.readyState === 1) {
            c.ws.send(msg);
        }
    }
}

// ── Init ─────────────────────────────────────────────────────────────────────
function initRealtime(httpServer, mainClient) {
    const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

    wss.on("connection", async (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const projectId = url.searchParams.get("projectId");
        const apiKey = url.searchParams.get("apiKey");

        if (!projectId || !apiKey) {
            ws.close(4001, "Missing projectId or apiKey");
            return;
        }

        // Validate API key against main DB
        try {
            const result = await mainClient.query("SELECT apikey FROM projects WHERE id = $1", [projectId]);
            if (result.rows.length === 0) { ws.close(4004, "Project not found"); return; }
            const valid = await verifyApiKey(apiKey, result.rows[0].apikey);
            if (!valid) { ws.close(4003, "Invalid API key"); return; }
        } catch {
            ws.close(4500, "Auth error");
            return;
        }

        // Register client
        const client = { ws, subscribedTables: new Set() };
        if (!projects.has(projectId)) projects.set(projectId, new Set());
        projects.get(projectId).add(client);

        ws.send(JSON.stringify({ type: "connected", projectId }));

        ws.on("message", (raw) => {
            try {
                const msg = JSON.parse(raw);
                if (msg.type === "subscribe" && msg.table) {
                    client.subscribedTables.add(msg.table);
                    ws.send(JSON.stringify({ type: "subscribed", table: msg.table }));
                } else if (msg.type === "unsubscribe" && msg.table) {
                    client.subscribedTables.delete(msg.table);
                    ws.send(JSON.stringify({ type: "unsubscribed", table: msg.table }));
                }
            } catch { /* ignore bad messages */ }
        });

        ws.on("close", () => {
            const set = projects.get(projectId);
            if (set) {
                set.delete(client);
                if (set.size === 0) projects.delete(projectId);
            }
        });
    });

    console.log("  ⚡ Realtime WebSocket attached at /ws");
}

module.exports = { initRealtime, broadcast, getProjectStats };
