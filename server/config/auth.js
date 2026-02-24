const authConfig = {
    jwtSecret: process.env.JWT_SECRET || "default_secret",
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    defaultExpiry: "365d",
};

module.exports = authConfig;
