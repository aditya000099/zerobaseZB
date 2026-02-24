const express = require("express");
const { verifyAccess } = require("../middleware/verifyAccess");
const {
    getStorageInfo,
    updateStorageQuota,
    uploadFile,
    listFiles,
    downloadFile,
    deleteFile,
} = require("../controllers/storageController");

module.exports = (mainClient) => {
    const router = express.Router();
    const sdk = verifyAccess(mainClient);

    // Quota & info — SDK protected
    router.get("/:projectId", sdk, getStorageInfo(mainClient));
    router.put("/:projectId/quota", sdk, updateStorageQuota(mainClient));

    // File management — SDK protected
    router.post("/:projectId/files", sdk, ...uploadFile(mainClient));
    router.get("/:projectId/files", sdk, listFiles());
    router.get("/:projectId/files/:filename", sdk, downloadFile());
    router.delete("/:projectId/files/:filename", sdk, deleteFile());

    return router;
};
