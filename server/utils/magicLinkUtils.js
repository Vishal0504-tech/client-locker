
const crypto = require("crypto");

// Generate a secure random token
const generateMagicToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Convert token into SHA-256 hash for database storage
const hashMagicToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateMagicToken,
  hashMagicToken,
};
