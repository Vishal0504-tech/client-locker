
const ActivityLog = require("../models/ActivityLog");
const express = require("express");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();

const Document = require("../models/Document");
const Client = require("../models/Client");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const supabase = require("../config/supabase");

const SecureDownload = require("../models/SecureDownload");
const User = require("../models/User");





const {
  generateDownloadToken,
  hashDownloadToken,
} = require("../utils/secureDownloadUtils");

const BUCKET = "clientlocker-documents";


// Validate actual PDF, JPG and PNG file signatures

const handleUpload = (req, res, next) => {
  upload.single("document")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (!req.file) {
      return next();
    }

    const fileBuffer = req.file.buffer;
    let isValid = false;

    if (req.file.mimetype === "application/pdf") {
      isValid = fileBuffer.subarray(0, 5).toString() === "%PDF-";
    } else if (req.file.mimetype === "image/jpeg") {
      isValid =
        fileBuffer[0] === 0xff &&
        fileBuffer[1] === 0xd8 &&
        fileBuffer[2] === 0xff;
    } else if (req.file.mimetype === "image/png") {
      const pngSignature = Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
      ]);

      isValid = fileBuffer.subarray(0, 8).equals(pngSignature);
    }

    if (!isValid) {
      return res.status(400).json({
        message:
          "Invalid file content. Please upload a valid PDF, JPG or PNG file.",
      });
    }

    next();
  });
};


// POST /api/documents
// Upload document to Supabase Storage
// Auditor is not allowed to upload.

router.post("/", protect, handleUpload, async (req, res) => {
  let uploadedStoragePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a document to upload.",
      });
    }

    const user = req.user;

    let clientFilter = {
      _id: req.body.clientId,
      firm: user.firm,
    };

    if (user.role === "staff") {
      clientFilter.assignedStaff = user._id;
    } else if (user.role === "client") {
      if (!user.client) {
        return res.status(400).json({
          message: "Client account is not linked.",
        });
      }

      clientFilter._id = user.client;
    } else if (user.role !== "partner") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const client = await Client.findOne(clientFilter);

    if (!client) {
      return res.status(404).json({
        message: "Client not found or access denied.",
      });
    }

    const storedName =
      crypto.randomBytes(16).toString("hex") +
      path.extname(req.file.originalname).toLowerCase();

    const storagePath =
      `${user.firm.toString()}/${client._id.toString()}/${storedName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    uploadedStoragePath = storagePath;

    const document = await Document.create({
      originalName: path.basename(req.file.originalname),
      storedName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath,
      uploadedBy: user._id,
      client: client._id,
      firm: user.firm,
    });

    uploadedStoragePath = null;

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
    if (uploadedStoragePath) {
      await supabase.storage
        .from(BUCKET)
        .remove([uploadedStoragePath])
        .catch(() => {});
    }

    console.error("Document upload error:", error.message);

    return res.status(500).json({
      message: "Failed to upload document.",
    });
  }
});


// GET /api/documents
// List documents based on user role.

router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;

    let filter = {
      firm: user.firm,
    };

    if (user.role === "partner") {
      // Partner can view all documents in the firm.
    } else if (user.role === "staff") {
      const assignedClients = await Client.find({
        firm: user.firm,
        assignedStaff: user._id,
      }).select("_id");

      const clientIds = assignedClients.map(
        (client) => client._id
      );

      filter.client = { $in: clientIds };

    } else if (user.role === "client") {
      if (!user.client) {
        return res.status(400).json({
          message: "Client account is not linked.",
        });
      }

      filter.client = user.client;

    } else if (user.role === "auditor") {
      const auditorClients = await Client.find({
        _id: { $in: user.assignedClients || [] },
        firm: user.firm,
      }).select("_id");

      const clientIds = auditorClients.map(
        (client) => client._id
      );

      filter.client = { $in: clientIds };

    } else {
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
// Open document from private Supabase Storage.

router.get("/:id/open", protect, async (req, res) => {
  try {
    const user = req.user;

    const document = await Document.findOne({
      _id: req.params.id,
      firm: user.firm,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or access denied.",
      });
    }

    // Check role-based access.

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

    } else if (user.role === "client") {
      if (
        !user.client ||
        document.client.toString() !== user.client.toString()
      ) {
        return res.status(404).json({
          message: "Document not found or access denied.",
        });
      }

    } else if (user.role === "auditor") {
      const assignedClient = await Client.findOne({
        _id: document.client,
        firm: user.firm,
      });

      const hasAssignment = (user.assignedClients || []).some(
        (clientId) =>
          clientId.toString() === document.client.toString()
      );

      if (!assignedClient || !hasAssignment) {
        return res.status(404).json({
          message: "Document not found or access denied.",
        });
      }

    } else if (user.role !== "partner") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    // Validate Supabase storage path.

    if (
      !document.storagePath ||
      document.storagePath.startsWith("/") ||
      document.storagePath.split("/").includes("..")
    ) {
      return res.status(403).json({
        message: "Invalid file location.",
      });
    }

    // Retrieve private file from Supabase.

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(document.storagePath);

    if (error || !data) {
      console.error(
        "Supabase document download error:",
        error?.message || "File not found"
      );

      return res.status(404).json({
        message: "Document file not found in storage.",
      });
    }

    const fileBuffer = Buffer.from(
      await data.arrayBuffer()
    );

    // Secure response headers.

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(document.originalName)}`
    );
    res.setHeader("Content-Length", fileBuffer.length);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    // Record document opening activity.

    try {
      await ActivityLog.create({
        user: user._id,
        action: "open",
        document: document._id,
        client: document.client,
        details: `${user.role} opened ${document.originalName}.`,
      });
    } catch (logError) {
      console.error(
        "Document opening activity logging failed:",
        logError.message
      );
    }

    return res.end(fileBuffer);

  } catch (error) {
    if (error.name === "CastError") {
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


// Check whether the current user can access a document.
// Used for secure download generation and verification.

const canAccessDocument = async (user, document) => {
  if (
    !user ||
    !user.isActive ||
    !user.firm ||
    !document.firm ||
    user.firm.toString() !== document.firm.toString()
  ) {
    return false;
  }

  if (user.role === "partner") {
    return true;
  }

  if (user.role === "staff") {
    const assignedClient = await Client.findOne({
      _id: document.client,
      firm: user.firm,
      assignedStaff: user._id,
    });

    return Boolean(assignedClient);
  }

  if (user.role === "client") {
    return Boolean(
      user.client &&
      document.client.toString() === user.client.toString()
    );
  }

  if (user.role === "auditor") {
    const hasAssignment = (user.assignedClients || []).some(
      (clientId) =>
        clientId.toString() === document.client.toString()
    );

    if (!hasAssignment) {
      return false;
    }

    const assignedClient = await Client.findOne({
      _id: document.client,
      firm: user.firm,
    });

    return Boolean(assignedClient);
  }

  return false;
};


// POST /api/documents/:id/download-link
// Generate a single-use secure download link.
// Link expires after 10 minutes.

router.post("/:id/download-link", protect, async (req, res) => {
  try {
    const user = req.user;

    const document = await Document.findOne({
      _id: req.params.id,
      firm: user.firm,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or access denied.",
      });
    }

    const hasAccess = await canAccessDocument(user, document);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have permission to download this document.",
      });
    }

    const rawToken = generateDownloadToken();
    const tokenHash = hashDownloadToken(rawToken);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await SecureDownload.create({
      document: document._id,
      user: user._id,
      tokenHash,
      expiresAt,
    });

    return res.status(201).json({
      message: "Secure download link generated successfully.",
      downloadPath: `/api/documents/download/${rawToken}`,
      expiresAt,
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    console.error("Secure download link error:", error.message);

    return res.status(500).json({
      message: "Failed to generate secure download link.",
    });
  }
});


// GET /api/documents/download/:token
// Verify and consume a secure download link.

router.get("/download/:token", async (req, res) => {
  try {
    const rawToken = req.params.token;

    if (!/^[a-fA-F0-9]{64}$/.test(rawToken)) {
      return res.status(400).json({
        message: "Invalid download link.",
      });
    }

    const tokenHash = hashDownloadToken(rawToken);

    const downloadRecord = await SecureDownload.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!downloadRecord) {
      return res.status(401).json({
        message: "Download link is invalid, expired or already used.",
      });
    }

    // Recheck current user status from MongoDB.

    const user = await User.findById(downloadRecord.user);

    if (!user || !user.isActive) {
      return res.status(403).json({
        message: "User account is inactive or unavailable.",
      });
    }

    // Recheck current document and firm.

    const document = await Document.findOne({
      _id: downloadRecord.document,
      firm: user.firm,
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found or access denied.",
      });
    }

    // Recheck current ownership, staff assignment or auditor assignment.

    const hasAccess = await canAccessDocument(user, document);

    if (!hasAccess) {
      return res.status(403).json({
        message: "Document access has been revoked.",
      });
    }

    // Atomically consume the link to prevent reuse.

    const consumedLink = await SecureDownload.findOneAndUpdate(
      {
        _id: downloadRecord._id,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true }
    );

    if (!consumedLink) {
      return res.status(401).json({
        message: "Download link is invalid, expired or already used.",
      });
    }

    // Validate private storage path.

    if (
      !document.storagePath ||
      document.storagePath.startsWith("/") ||
      document.storagePath.split("/").includes("..")
    ) {
      return res.status(403).json({
        message: "Invalid file location.",
      });
    }

    // Download from private Supabase Storage.

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(document.storagePath);

    if (error || !data) {
      console.error(
        "Secure file download error:",
        error?.message || "File not found"
      );

      return res.status(404).json({
        message: "Document file not found in storage.",
      });
    }

    const fileBuffer = Buffer.from(
      await data.arrayBuffer()
    );

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`
    );
    res.setHeader("Content-Length", fileBuffer.length);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    // Record successful download activity.

    try {
      await ActivityLog.create({
        user: user._id,
        action: "download",
        document: document._id,
        client: document.client,
        details: `${user.role} downloaded ${document.originalName}.`,
      });
    } catch (logError) {
      console.error(
        "Download activity logging failed:",
        logError.message
      );
    }

    return res.end(fileBuffer);

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        message: "Document not found.",
      });
    }

    console.error("Secure download error:", error.message);

    return res.status(500).json({
      message: "Failed to download document.",
    });
  }
});


module.exports = router;
