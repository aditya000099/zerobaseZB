const express = require("express");
const { authenticate } = require("../middleware/authenticate");
const { verifyAccess } = require("../middleware/verifyAccess");
const {
    initAuth,
    signup,
    login,
    googleAuth,
    setupOtp,
    getUsers,
    updateExpiry,
    deleteUser,
    getCurrentUser,
} = require("../controllers/authController");

// Factory so verifyAccess gets mainClient injected
module.exports = (mainClient) => {
    const router = express.Router();
    const sdk = verifyAccess(mainClient);

    // Dashboard-level init (no SDK key needed)
    router.post("/init", initAuth);

    // SDK routes — verified by origin or API key
    router.post("/signup", sdk, signup);
    router.post("/login", sdk, login);
    router.post("/google", sdk, googleAuth);
    router.get("/users", sdk, getUsers);
    router.delete("/users/:userId", sdk, deleteUser);

    // Dashboard-level routes — verified by JWT
    router.post("/otp/setup", authenticate, setupOtp);
    router.put("/expiry", authenticate, updateExpiry);

    return router;
};
