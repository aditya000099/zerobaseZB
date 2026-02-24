const express = require("express");
const { verifyAccess } = require("../middleware/verifyAccess");
const {
    getTables,
    createTable,
    deleteTable,
    addColumn,
    getDocuments,
    createDocument,
    updateDocument,
} = require("../controllers/dbController");

const validateColumnInput = (req, res, next) => {
    const validTypes = ["text", "integer", "boolean", "timestamp"];
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: "Missing name or type" });
    if (!validTypes.includes(type.toLowerCase()))
        return res.status(400).json({ error: `Invalid type: ${type}. Valid: ${validTypes.join(", ")}` });
    next();
};

module.exports = (mainClient) => {
    const router = express.Router();
    const sdk = verifyAccess(mainClient);

    router.get("/tables", sdk, getTables);
    router.post("/tables", sdk, createTable);
    router.delete("/tables/:tableName", sdk, deleteTable);
    router.post("/tables/:tableName/columns", sdk, validateColumnInput, addColumn);
    router.get("/tables/:tableName/documents", sdk, getDocuments);
    router.post("/tables/:tableName/documents", sdk, createDocument);
    router.put("/tables/auth_users/documents/:userId", sdk, updateDocument);

    return router;
};
