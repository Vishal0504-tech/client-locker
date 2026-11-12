
const mongoose = require("mongoose");

const firmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
    },

    address: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Firm", firmSchema);
