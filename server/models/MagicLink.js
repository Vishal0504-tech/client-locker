
const mongoose = require("mongoose");

const magicLinkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

   expiresAt: {
  type: Date,
  required: true,
},

    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Automatically remove expired records from MongoDB.
// Authentication also checks expiresAt directly.
magicLinkSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model("MagicLink", magicLinkSchema);
