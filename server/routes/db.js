const express = require("express");
const { verifyAccess } = require("../middleware/verifyAccess");
const {
    getTables, createTable, deleteTable, addColumn,
    getDocuments, createDocument, updateDocument,
    getIndexes, createIndex, dropIndex,
    getExtensions, enableExtension, disableExtension,
} = require("../controllers/dbController");

const validateColumnInput = (req, res, next) => {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: "Missing name or type" });
    next();
};

module.exports = (mainClient) => {
    const router = express.Router();
    const sdk = verifyAccess(mainClient);

    // Tables
    router.get("/tables", sdk, getTables);
    router.post("/tables", sdk, createTable);
    router.delete("/tables/:tableName", sdk, deleteTable);

    // Columns
    router.post("/tables/:tableName/columns", sdk, validateColumnInput, addColumn);

    // Documents
    router.get("/tables/:tableName/documents", sdk, getDocuments);
    router.post("/tables/:tableName/documents", sdk, createDocument);
    router.put("/tables/auth_users/documents/:userId", sdk, updateDocument);

    // Indexes
    router.get("/tables/:tableName/indexes", sdk, getIndexes);
    router.post("/tables/:tableName/indexes", sdk, createIndex);
    router.delete("/tables/:tableName/indexes/:indexName", sdk, dropIndex);

    // Extensions (dashboard only)
    router.get("/extensions", sdk, getExtensions);
    router.post("/extensions/enable", sdk, enableExtension);
    router.post("/extensions/disable", sdk, disableExtension);

    return router;
};
