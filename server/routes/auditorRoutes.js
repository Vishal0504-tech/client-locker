
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const User = require("../models/User");
const Client = require("../models/Client");
const { protect, authorize } = require("../middleware/authMiddleware");

// POST /api/auditors
// Partner creates an auditor account.
router.post("/", protect, authorize("partner"), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const auditor = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "auditor",
      firm: req.user.firm,
      assignedClients: [],
    });

    return res.status(201).json({
      message: "Auditor account created successfully.",
      auditor: {
        id: auditor._id,
        name: auditor.name,
        email: auditor.email,
        role: auditor.role,
        assignedClients: auditor.assignedClients,
      },
    });
  } catch (error) {
    console.error("Auditor creation error:", error.message);

    return res.status(500).json({
      message: "Failed to create auditor account.",
    });
  }
});

// GET /api/auditors
// Partner views auditors in their firm.
router.get("/", protect, authorize("partner"), async (req, res) => {
  try {
    const auditors = await User.find({
      firm: req.user.firm,
      role: "auditor",
    })
      .select("name email assignedClients isActive createdAt")
      .populate("assignedClients", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: auditors.length,
      auditors,
    });
  } catch (error) {
    console.error("Auditor fetch error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch auditors.",
    });
  }
});

// PATCH /api/auditors/:id/clients
// Partner assigns up to two clients to an auditor.
router.patch(
  "/:id/clients",
  protect,
  authorize("partner"),
  async (req, res) => {
    try {
      const { clientIds } = req.body;

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          message: "Invalid auditor ID.",
        });
      }

      if (
        !Array.isArray(clientIds) ||
        clientIds.length < 1 ||
        clientIds.length > 2
      ) {
        return res.status(400).json({
          message: "Assign one or two clients to the auditor.",
        });
      }

      const uniqueClientIds = [...new Set(clientIds.map(String))];

      if (
        uniqueClientIds.length !== clientIds.length ||
        uniqueClientIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
      ) {
        return res.status(400).json({
          message: "Client IDs must be valid and unique.",
        });
      }

      const auditor = await User.findOne({
        _id: req.params.id,
        firm: req.user.firm,
        role: "auditor",
      });

      if (!auditor) {
        return res.status(404).json({
          message: "Auditor not found in your firm.",
        });
      }

      const clients = await Client.find({
        _id: { $in: uniqueClientIds },
        firm: req.user.firm,
      }).select("_id");

      if (clients.length !== uniqueClientIds.length) {
        return res.status(400).json({
          message: "One or more clients do not belong to your firm.",
        });
      }

      auditor.assignedClients = uniqueClientIds;
      await auditor.save();

      return res.status(200).json({
        message: "Auditor client access updated successfully.",
        auditor: {
          id: auditor._id,
          name: auditor.name,
          assignedClients: auditor.assignedClients,
        },
      });
    } catch (error) {
      console.error("Auditor assignment error:", error.message);

      return res.status(500).json({
        message: "Failed to assign clients to auditor.",
      });
    }
  }
);

module.exports = router;
