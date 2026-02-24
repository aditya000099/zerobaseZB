const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { Client } = require("pg");

const STORAGE_PATH = process.env.STORAGE_PATH || "/storage";
const ALLOWED_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file

function getProjectStoragePath(projectId) {
    return path.join(STORAGE_PATH, projectId);
}

function getDiskUsageMb(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) return 0;
        // du -sm returns "<size>\t<path>"
        const out = execSync(`du -sm "${dirPath}"`, { timeout: 5000 }).toString();
        return parseInt(out.split("\t")[0], 10) || 0;
    } catch {
        return 0;
    }
}

function getAvailableDiskMb(targetPath) {
    try {
        // df -m returns header + data line; last line has: Filesystem 1M-blocks Used Available Use% Mounted
        const out = execSync(`df -m "${targetPath}"`, { timeout: 5000 }).toString();
        const lines = out.trim().split("\n");
        const parts = lines[lines.length - 1].trim().split(/\s+/);
        return parseInt(parts[3], 10) || 0;
    } catch {
        return 0;
    }
}

const getStorageInfo = (mainClient) => async (req, res) => {
    const { projectId } = req.params;

    try {
        const result = await mainClient.query(
            "SELECT storage_quota_mb FROM projects WHERE id = $1",
            [projectId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: "Project not found" });
        }

        const quotaMb = result.rows[0].storage_quota_mb || 1024;
        const storagePath = getProjectStoragePath(projectId);
        const usedMb = getDiskUsageMb(storagePath);
        const availableDiskMb = getAvailableDiskMb(STORAGE_PATH);

        res.json({
            projectId,
            quotaMb,
            usedMb,
            availableDiskMb,
            storagePath,
        });
    } catch (error) {
        console.error("Storage info error:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateStorageQuota = (mainClient) => async (req, res) => {
    const { projectId } = req.params;
    const { newQuotaMb } = req.body;

    if (!newQuotaMb || newQuotaMb < 1) {
        return res.status(400).json({ error: "Invalid quota value" });
    }

    try {
        const storagePath = getProjectStoragePath(projectId);
        const usedMb = getDiskUsageMb(storagePath);
        const availableDiskMb = getAvailableDiskMb(STORAGE_PATH);

        if (newQuotaMb < usedMb) {
            return res.status(400).json({
                error: `Cannot set quota below current usage (${usedMb} MB used)`,
            });
        }

        if (newQuotaMb > availableDiskMb + usedMb) {
            return res.status(400).json({
                error: `Not enough disk space. Only ${availableDiskMb} MB available on server.`,
            });
        }

        await mainClient.query(
            "UPDATE projects SET storage_quota_mb = $1 WHERE id = $2",
            [newQuotaMb, projectId]
        );

        res.json({ success: true, quotaMb: newQuotaMb, usedMb, availableDiskMb });
    } catch (error) {
        console.error("Update quota error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ─── Multer setup (disk storage, per-project folder) ─────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = getProjectStoragePath(req.params.projectId);
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Preserve original name but sanitise it
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, safe);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    },
});

// ─── File handlers ────────────────────────────────────────────────────────────

const uploadFile = (mainClient) => [
    upload.single("file"),
    async (req, res) => {
        const { projectId } = req.params;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        try {
            // Quota check
            const result = await mainClient.query(
                "SELECT storage_quota_mb FROM projects WHERE id = $1",
                [projectId]
            );
            if (!result.rows[0]) return res.status(404).json({ error: "Project not found" });

            const quotaMb = result.rows[0].storage_quota_mb || 1024;
            const storagePath = getProjectStoragePath(projectId);
            const usedMb = getDiskUsageMb(storagePath);

            if (usedMb > quotaMb) {
                // Remove already-written file
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    error: `Storage quota exceeded. Used: ${usedMb} MB / ${quotaMb} MB`,
                });
            }

            res.json({
                success: true,
                file: {
                    name: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                },
            });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({ error: error.message });
        }
    },
];

const listFiles = () => async (req, res) => {
    const { projectId } = req.params;
    const storagePath = getProjectStoragePath(projectId);

    try {
        if (!fs.existsSync(storagePath)) {
            return res.json({ files: [] });
        }

        const entries = fs.readdirSync(storagePath, { withFileTypes: true });
        const files = entries
            .filter((e) => e.isFile())
            .map((e) => {
                const fullPath = path.join(storagePath, e.name);
                const stat = fs.statSync(fullPath);
                return {
                    name: e.name,
                    sizeBytes: stat.size,
                    sizeMb: parseFloat((stat.size / (1024 * 1024)).toFixed(2)),
                    modifiedAt: stat.mtime,
                    ext: path.extname(e.name).toLowerCase(),
                };
            });

        res.json({ files });
    } catch (error) {
        console.error("List files error:", error);
        res.status(500).json({ error: error.message });
    }
};

const downloadFile = () => async (req, res) => {
    const { projectId, filename } = req.params;
    const filePath = path.join(getProjectStoragePath(projectId), filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
    }

    res.download(filePath, filename);
};

const deleteFile = () => async (req, res) => {
    const { projectId, filename } = req.params;
    const filePath = path.join(getProjectStoragePath(projectId), filename);

    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete file error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getStorageInfo,
    updateStorageQuota,
    uploadFile,
    listFiles,
    downloadFile,
    deleteFile,
};
