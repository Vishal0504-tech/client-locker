
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Client = require("../models/Client");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/authMiddleware");
const { generateChecklistSuggestions } = require("../services/aiChecklistService");

// GET /api/clients
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;
    let clients;

    // PARTNER: View all clients in their firm
    if (user.role === "partner") {
      clients = await Client.find({
        firm: user.firm,
      }).populate("assignedStaff", "name email designation");
    }

    // STAFF: View only assigned clients
    else if (user.role === "staff") {
      clients = await Client.find({
        firm: user.firm,
        assignedStaff: user._id,
      }).populate("assignedStaff", "name email designation");
    }

    // CLIENT: View only their own details
    else if (user.role === "client") {
      if (!user.client) {
        return res.status(400).json({
          message: "Client account is not linked to a client record.",
        });
      }

      clients = await Client.find({
        _id: user.client,
        firm: user.firm,
      }).populate("assignedStaff", "name email designation");
    } else {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      count: clients.length,
      clients,
    });
  } catch (error) {
    console.error("Client API error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch clients.",
    });
  }
});

// PATCH /api/clients/:id/assign
// PARTNER ONLY: Assign, reassign or unassign staff
router.patch("/:id/assign", protect, authorize("partner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedStaffId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid client ID.",
      });
    }

    // Find client within partner's firm
    const client = await Client.findOne({
      _id: id,
      firm: req.user.firm,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    // Null means remove the current staff assignment
    if (assignedStaffId === null) {
      client.assignedStaff = null;
      await client.save();

      return res.status(200).json({
        message: "Staff assignment removed successfully.",
        client,
      });
    }

    if (
      typeof assignedStaffId !== "string" ||
      !mongoose.Types.ObjectId.isValid(assignedStaffId)
    ) {
      return res.status(400).json({
        message: "A valid staff ID is required.",
      });
    }

    // Verify staff belongs to the same firm and is active
    const staff = await User.findOne({
      _id: assignedStaffId,
      firm: req.user.firm,
      role: "staff",
      isActive: true,
    });

    if (!staff) {
      return res.status(404).json({
        message: "Active staff member not found in your firm.",
      });
    }

    client.assignedStaff = staff._id;
    await client.save();

    const updatedClient = await Client.findById(client._id)
      .populate("assignedStaff", "name email designation");

    return res.status(200).json({
      message: "Staff assigned successfully.",
      client: updatedClient,
    });
  } catch (error) {
    console.error("Client assignment error:", error.message);

    return res.status(500).json({
      message: "Failed to update staff assignment.",

    });
  }
});


// POST /api/checklists/ai-suggestions
// Generate AI checklist suggestions for an accessible client
router.post("/ai-suggestions", protect, async (req, res) => {
  try {
    const { clientId } = req.body;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        message: "A valid client ID is required.",
      });
    }

    if (!["partner", "staff"].includes(user.role)) {
      return res.status(403).json({
        message: "Only partners and staff can generate suggestions.",
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      firm: user.firm,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    // Staff can only access their assigned clients
    if (
      user.role === "staff" &&
      (!client.assignedStaff ||
        client.assignedStaff.toString() !== user._id.toString())
    ) {
      return res.status(403).json({
        message: "You are not assigned to this client.",
      });
    }

    const existingTasks = await Checklist.find({
      client: client._id,
      firm: user.firm,
    }).select("title");

    const suggestions = await generateChecklistSuggestions(
      {
        status: client.status,
      },
      existingTasks
    );

    return res.status(200).json({
      message: "AI suggestions generated successfully.",
      suggestions,
    });
  } catch (error) {
    console.error("AI checklist suggestion error:", error.message);

    return res.status(503).json({
      message: "AI suggestions are temporarily unavailable. Please use manual checklist entry.",
    });
  }
});


// POST /api/checklists/ai-suggestions/approve
// Save only suggestions explicitly approved by staff or partner
router.post("/ai-suggestions/approve", protect, async (req, res) => {
  try {
    const { clientId, suggestions } = req.body;
    const user = req.user;

    if (!["partner", "staff"].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        message: "A valid client ID is required.",
      });
    }

    if (
      !Array.isArray(suggestions) ||
      suggestions.length === 0 ||
      suggestions.length > 5
    ) {
      return res.status(400).json({
        message: "Please approve between 1 and 5 suggestions.",
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      firm: user.firm,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found.",
      });
    }

    if (
      user.role === "staff" &&
      (!client.assignedStaff ||
        client.assignedStaff.toString() !== user._id.toString())
    ) {
      return res.status(403).json({
        message: "You are not assigned to this client.",
      });
    }

    const existingTasks = await Checklist.find({
      client: client._id,
      firm: user.firm,
    }).select("title");

    const existingTitles = new Set(
      existingTasks.map((task) => task.title.trim().toLowerCase())
    );

    const approvedTasks = [];

    for (const task of suggestions) {
      if (
        !task ||
        typeof task.title !== "string" ||
        typeof task.description !== "string" ||
        typeof task.category !== "string"
      ) {
        return res.status(400).json({
          message: "Each suggestion must contain title, description and category.",
        });
      }

      const title = task.title.trim().slice(0, 150);
      const description = task.description.trim().slice(0, 500);
      const category = task.category.trim().slice(0, 50);

      if (!title || !description || !category) {
        return res.status(400).json({
          message: "Checklist fields cannot be empty.",
        });
      }

      if (existingTitles.has(title.toLowerCase())) {
        continue;
      }

      existingTitles.add(title.toLowerCase());

      approvedTasks.push({
        title,
        description,
        category,
        client: client._id,
        firm: user.firm,
        assignedTo: client.assignedStaff || null,
        createdBy: user._id,
      });
    }

    if (approvedTasks.length === 0) {
      return res.status(400).json({
        message: "No new checklist tasks to save.",
      });
    }

    const savedTasks = await Checklist.insertMany(approvedTasks);

    return res.status(201).json({
      message: "Approved checklist suggestions saved successfully.",
      count: savedTasks.length,
      checklists: savedTasks,
    });
  } catch (error) {
    console.error("AI checklist approval error:", error.message);

    return res.status(500).json({
      message: "Failed to save approved checklist suggestions.",
    });
  }
});


module.exports = router;
