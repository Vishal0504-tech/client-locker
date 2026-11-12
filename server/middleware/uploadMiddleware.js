
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Store uploaded files in the private uploads folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },

  filename: (req, file, cb) => {
    const uniqueName =
      crypto.randomBytes(16).toString("hex") +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  },
});

// Allow only PDF, JPG and PNG
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG and PNG files are allowed."));
  }
};

// Configure Multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB
  },
});

module.exports = upload;
