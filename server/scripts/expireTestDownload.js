
require("dotenv").config();

const mongoose = require("mongoose");
const SecureDownload = require("../models/SecureDownload");
const { hashDownloadToken } = require("../utils/secureDownloadUtils");

async function expireTestLink() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const token = process.env.TEST_DOWNLOAD_TOKEN;

    if (!token) {
      throw new Error("Test token is missing.");
    }

    const result = await SecureDownload.findOneAndUpdate(
      {
        tokenHash: hashDownloadToken(token),
        usedAt: null,
      },
      {
        $set: {
          expiresAt: new Date(Date.now() - 60000),
        },
      },
      { new: true }
    );

    console.log(
      result
        ? "Test link expiry set to past."
        : "No matching unused link found."
    );
  } catch (error) {
    console.error("Test error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

expireTestLink();
