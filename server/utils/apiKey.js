const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const generateApiKey = async () => {
    const apiKey = uuidv4();
    const saltRounds = 10;
    const hashedApiKey = await bcrypt.hash(apiKey, saltRounds);
    return { apiKey, hashedApiKey };
};

const verifyApiKey = async (providedApiKey, hashedApiKey) => {
    return await bcrypt.compare(providedApiKey, hashedApiKey);
};

module.exports = { generateApiKey, verifyApiKey };
