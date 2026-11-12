
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["partner", "staff", "client"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    firm: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Firm",
  default: null,
},

client: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Client",
  default: null,
},

designation: {
  type: String,
  trim: true,
  default: "",
},
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare login password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
