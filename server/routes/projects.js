const express = require("express");
const {
    createProject,
    getProject,
    getAllProjects,
    verifyProjectKey,
    getAuthorizedUrls,
    addAuthorizedUrl,
    removeAuthorizedUrl,
    regenerateApiKey,
} = require("../controllers/projectController");

module.exports = (mainClient) => {
    const router = express.Router();

    router.post("/", createProject(mainClient));
    router.get("/", getAllProjects(mainClient));
    router.get("/:id", getProject(mainClient));
    router.post("/verify-key", verifyProjectKey(mainClient));

    // Authorized URLs CRUD
    router.get("/:id/urls", getAuthorizedUrls(mainClient));
    router.post("/:id/urls", addAuthorizedUrl(mainClient));
    router.delete("/:id/urls", removeAuthorizedUrl(mainClient));

    // API key management
    router.post("/:id/regenerate-key", regenerateApiKey(mainClient));

    return router;
};
