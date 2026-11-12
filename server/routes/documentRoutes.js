const ActivityLog = require("../models/ActivityLog");
const express = require("express");
const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");

const router = express.Router();

const Document = require("../models/Document");
const Client = require("../models/Client");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


// Handle Multer errors and validate actual file signatures
const handleUpload = (req, res, next) => {
  upload.single("document")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (!req.file) {
      return next();
    }

    try {
      const fileBuffer = await fs.readFile(req.file.path);

      let isValid = false;

      // Check PDF signature
      if (req.file.mimetype === "application/pdf") {
        isValid =
          fileBuffer.subarray(0, 5).toString() === "%PDF-";
      }

      // Check JPG signature
      else if (req.file.mimetype === "image/jpeg") {
        isValid =
          fileBuffer[0] === 0xff &&
          fileBuffer[1] === 0xd8 &&
          fileBuffer[2] === 0xff;
      }

      // Check PNG signature
      else if (req.file.mimetype === "image/png") {
        const pngSignature = Buffer.from([
          0x89, 0x50, 0x4e, 0x47,
          0x0d, 0x0a, 0x1a, 0x0a,
        ]);

        isValid = fileBuffer
          .subarray(0, 8)
          .equals(pngSignature);
      }

      if (!isValid) {
        await fs.unlink(req.file.path).catch(() => {});

        return res.status(400).json({
          message: "Invalid file content. Please upload a valid PDF, JPG or PNG file.",
        });
      }

      next();

    } catch (validationError) {
      await fs.unlink(req.file.path).catch(() => {});

      console.error(
        "File validation error:",
        validationError.message
      );

      return res.status(400).json({
        message: "Unable to validate uploaded file.",
      });
    }
  });
};


// POST /api/documents
// Upload a document

router.post("/", protect, handleUpload, async (req, res) => {
  let uploadedFilePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a document to upload.",
      });
    }

    uploadedFilePath = req.file.path;

    const user = req.user;

    let clientFilter = {
      _id: req.body.clientId,
      firm: user.firm,
    };

    if (user.role === "staff") {
      clientFilter.assignedStaff = user._id;
    } else if (user.role === "client") {
      if (!user.client) {
        await fs.unlink(uploadedFilePath).catch(() => {});
        uploadedFilePath = null;

        return res.status(400).json({
          message: "Client account is not linked.",
        });
      }

      clientFilter._id = user.client;
    } else if (user.role !== "partner") {
      await fs.unlink(uploadedFilePath).catch(() => {});
      uploadedFilePath = null;

      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const client = await Client.findOne(clientFilter);

    if (!client) {
      await fs.unlink(uploadedFilePath).catch(() => {});
      uploadedFilePath = null;

      return res.status(404).json({
        message: "Client not found or access denied.",
      });
    }

    const document = await Document.create({
      originalName: path.basename(req.file.originalname),
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      uploadedBy: user._id,
      client: client._id,
      firm: user.firm,
    });

    // Document is saved, so keep the uploaded file.
    uploadedFilePath = null;

    // Record upload activity
    try {
      await ActivityLog.create({
        user: user._id,
        action: "upload",
        document: document._id,
        client: client._id,
        details: `${user.role} uploaded ${document.originalName}.`,
      });
    } catch (logError) {
      console.error("Upload activity logging failed:", logError.message);
    }

    // Return only safe document information
    return res.status(201).json({
      message: "Document uploaded successfully.",
      document: {
        _id: document._id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        client: document.client,
        uploadedBy: document.uploadedBy,
        createdAt: document.createdAt,
      },
    });

  } catch (error) {
    if (uploadedFilePath) {
      await fs.unlink(uploadedFilePath).catch(() => {});
    }

    console.error("Document upload error:", error.message);

    return res.status(500).json({
      message: "Failed to upload document.",
    });
  }
});


// GET /api/documents
// List documents based on user role
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;
    let filter = {
      firm: user.firm,
    };

    // PARTNER: All documents in their firm
    if (user.role === "partner") {
      // Firm filter is sufficient
    }

    // STAFF: Documents belonging to assigned clients
    else if (user.role === "staff") {
      const assignedClients = await Client.find({
        firm: user.firm,
        assignedStaff: user._id,
      }).select("_id");

      const clientIds = assignedClients.map(
        (client) => client._id
      );

      filter.client = { $in: clientIds };
    }

    // CLIENT: Only their own documents
    else if (user.role === "client") {
      if (!user.client) {
        return res.status(400).json({
          message: "Client account is not linked.",
        });
      }

      filter.client = user.client;
    }

    else {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const documents = await Document.find(filter)
  .select("originalName mimeType size client uploadedBy createdAt")
  .populate("client", "name email")
  .populate("uploadedBy", "name email role")
  .sort({ createdAt: -1 });

    return res.status(200).json({
      count: documents.length,
      documents,
    });

  } catch (error) {
    console.error("Document listing error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch documents.",
    });
  }
});


// GET /api/documents/:id/open
// Securely open a document
router.get("/:id/open", protect, async (req, res) => {
  try {
    const user = req.user;

    // Find document within the user's firm
    const document = await Document.findOne({
      _id: req.params.id,
      firm: user.firm,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or access denied.",
      });
    }

    // Check role-based access
    if (user.role === "staff") {
      const assignedClient = await Client.findOne({
        _id: document.client,
        firm: user.firm,
        assignedStaff: user._id,
      });

      if (!assignedClient) {
        return res.status(404).json({
          message: "Document not found or access denied.",
        });
      }
    }

    else if (user.role === "client") {
      if (
        !user.client ||
        document.client.toString() !== user.client.toString()
      ) {
        return res.status(404).json({
          message: "Document not found or access denied.",
        });
      }
    }

    else if (user.role !== "partner") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    // Ensure file is inside the private uploads folder
    const uploadsDir = path.resolve(__dirname, "..", "uploads");
    const filePath = path.resolve(document.storagePath);
    const relativePath = path.relative(uploadsDir, filePath);

    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      return res.status(403).json({
        message: "Invalid file location.",
      });
    }

    // Check whether the file exists
    await fs.access(filePath);

    // Set secure response headers
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(document.originalName)}`
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    // Stream the file to the browser
    const fileStream = fsSync.createReadStream(filePath);

    // Record document opening activity
try {
  await ActivityLog.create({
    user: user._id,
    action: "open",
    document: document._id,
    client: document.client,
    details: `${user.role} opened ${document.originalName}.`,
  });
} catch (logError) {
  console.error("Document opening activity logging failed:", logError.message);
}

    fileStream.on("error", (error) => {
      console.error("Document opening error:", error.message);

      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to open document.",
        });
      } else {
        res.destroy(error);
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    if (error.name === "CastError" || error.code === "ENOENT") {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    console.error("Document opening error:", error.message);

    return res.status(500).json({
      message: "Failed to open document.",
    });
  }
});


module.exports = router;
