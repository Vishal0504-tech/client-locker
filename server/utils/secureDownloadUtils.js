
const crypto = require("crypto");

const generateDownloadToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashDownloadToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateDownloadToken,
  hashDownloadToken,
};
