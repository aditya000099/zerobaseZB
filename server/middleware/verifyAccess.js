const { verifyApiKey } = require("../utils/apiKey");

/**
 * verifyAccess — SDK access middleware
 *
 * Access rules (in priority order):
 *  1. No Origin header (same-origin / server-side call)  → ✅ always allowed
 *  2. Origin is localhost / 127.0.0.1 / [::1]           → ✅ always allowed
 *  3. Origin is in project's authorized_urls list        → ✅ allowed
 *  4. X-API-Key header matches project's hashed key     → ✅ allowed (server-to-server)
 *  5. Anything else                                      → ❌ 403
 *
 * projectId is read from: params > query > body
 */
const verifyAccess = (mainClient) => async (req, res, next) => {
    const projectId =
        req.params?.projectId ||
        req.query.projectId ||
        req.body?.projectId;

    if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
    }

    const origin = req.headers.origin;

    // ── 1. No Origin → same-origin or server-side, always allow ─────────────
    if (!origin) {
        req.projectId = projectId;
        return next();
    }

    // ── 2. Localhost is always allowed ───────────────────────────────────────
    const isLocalhost =
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("http://[::1]");

    if (isLocalhost) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        req.projectId = projectId;
        return next();
    }

    // ── Need to look up project for rules 3 & 4 ─────────────────────────────
    try {
        const result = await mainClient.query(
            "SELECT apikey, authorized_urls FROM projects WHERE id = $1",
            [projectId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: "Project not found" });
        }

        const { apikey: hashedKey, authorized_urls: authorizedUrls = [] } = result.rows[0];

        // ── 3. Authorized URLs list ──────────────────────────────────────────
        const normalised = origin.replace(/\/$/, "").toLowerCase();
        const isAllowed = (authorizedUrls || []).some(
            (u) => u.replace(/\/$/, "").toLowerCase() === normalised
        );
        if (isAllowed) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
            req.projectId = projectId;
            return next();
        }

        // ── 4. API key fallback (for server-to-server from unknown origins) ──
        const providedKey =
            req.headers["x-api-key"] ||
            req.headers["authorization"]?.replace("Bearer ", "");

        if (providedKey && hashedKey) {
            const isValid = await verifyApiKey(providedKey, hashedKey);
            if (isValid) {
                req.projectId = projectId;
                return next();
            }
        }

        // ── 5. Denied ────────────────────────────────────────────────────────
        return res.status(403).json({
            error: `Origin "${origin}" is not authorized for this project. Add it in the project Settings → Authorized URLs.`,
        });
    } catch (err) {
        console.error("verifyAccess error:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { verifyAccess };
