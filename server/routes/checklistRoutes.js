
const express = require("express");
const router = express.Router();

const Checklist = require("../models/Checklist");
const Client = require("../models/Client");
const {
  protect,
  authorize,
  userCanAccessClient,
  requireClientAccess,
} = require("../middleware/authMiddleware");
const { generateChecklistSuggestions } = require("../services/aiChecklistService");


// GET /api/checklists
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;
    let filter = {};

    // PARTNER: All checklist tasks in their firm
    if (user.role === "partner") {
      filter = { firm: user.firm };
    }

    // STAFF: Only tasks assigned to them
    else if (user.role === "staff") {
      filter = {
        firm: user.firm,
        assignedTo: user._id,
      };
    }

    // CLIENT: Only tasks belonging to them
    else if (user.role === "client") {
      if (!user.client) {
        return res.status(400).json({
          message: "Client account is not linked to a client record.",
        });
      }

          filter = {
      firm: user.firm,
      client: user.client,
    };
  }

  // AUDITOR: Only tasks belonging to assigned clients
  else if (user.role === "auditor") {
    filter = {
      firm: user.firm,
      client: { $in: user.assignedClients || [] },
    };
  }

  else {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

    const checklists = await Checklist.find(filter)
      .populate("client", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: checklists.length,
      checklists,
    });

  } catch (error) {
    console.error("Checklist API error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch checklist tasks.",
    });
  }
});



// MANUAL CHECKLIST TASK CREATION
router.post(
  "/manual",
  protect,
  authorize("partner", "staff"),
  requireClientAccess((req) => req.body.clientId),
  async (req, res) => {
  try {
    const user = req.user;
    const { title, description, category } = req.body;
    const client = req.client;

    // Validate task fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 150
    ) {
      return res.status(400).json({
        message: "Task title is required and must not exceed 150 characters.",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 500)
    ) {
      return res.status(400).json({
        message: "Description must not exceed 500 characters.",
      });
    }

    if (
      typeof category !== "string" ||
      !category.trim() ||
      category.trim().length > 50
    ) {
      return res.status(400).json({
        message: "Valid task category is required.",
      });
    }

    // Save manual checklist task
    const task = await Checklist.create({
      title: title.trim(),
      description: (description || "").trim(),
      category: category.trim(),
      client: client._id,
      firm: user.firm,
      assignedTo: client.assignedStaff || null,
      createdBy: user._id,
    });

    return res.status(201).json({
      message: "Manual checklist task created successfully.",
      task,
    });

  } catch (error) {
    console.error("Manual checklist creation error:", error.message);

    return res.status(500).json({
      message: "Failed to create manual checklist task.",
    });
  }
});



// PATCH /api/checklists/:id
// Update checklist completion status
router.patch("/:id", protect, async (req, res) => {
  try {
    const user = req.user;
    const { isCompleted } = req.body;

    // Validate input
    if (typeof isCompleted !== "boolean") {
      return res.status(400).json({
        message: "isCompleted must be true or false.",
      });
    }

    if (user.role === "auditor") {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    if (user.role === "client" && !user.client) {
      return res.status(400).json({
        message: "Client account is not linked to a client record.",
      });
    }

    const checklist = await Checklist.findById(req.params.id);

    if (!checklist) {
      return res.status(404).json({
        message: "Checklist task not found.",
      });
    }

    const client = await Client.findById(checklist.client);

    if (!client || !userCanAccessClient(user, client)) {
      return res.status(403).json({
        message: "Access denied. You do not have permission to access this client.",
      });
    }

    // Staff can complete only tasks assigned to them
    if (
      user.role === "staff" &&
      String(checklist.assignedTo) !== String(user._id)
    ) {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    checklist.isCompleted = isCompleted;
    await checklist.save();

    return res.status(200).json({
      message: "Checklist status updated successfully.",
      checklist,
    });

  } catch (error) {
    console.error("Checklist update error:", error.message);

    return res.status(500).json({
      message: "Failed to update checklist status.",
    });
  }
});


// AI CHECKLIST SUGGESTIONS
router.post(
  "/ai-suggestions",
  protect,
  authorize("partner", "staff"),
  requireClientAccess((req) => req.body.clientId),
  async (req, res) => {
  try {
    const user = req.user;
    const client = req.client;

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
    console.error("AI checklist error:", error.message);
    return res.status(503).json({
      message: "AI suggestions are temporarily unavailable. Please use the manual checklist.",
    });
  }
});

// APPROVE AND SAVE AI CHECKLIST SUGGESTIONS
router.post(
  "/ai-suggestions/approve",
  protect,
  authorize("partner", "staff"),
  requireClientAccess((req) => req.body.clientId),
  async (req, res) => {
  try {
    const { suggestions } = req.body;
    const user = req.user;
    const client = req.client;

    if (!Array.isArray(suggestions) || suggestions.length === 0 || suggestions.length > 5) {
      return res.status(400).json({ message: "Select between 1 and 5 suggestions." });
    }

    const existingTasks = await Checklist.find({
      client: client._id,
      firm: user.firm,
    }).select("title");

    const existingTitles = new Set(
      existingTasks.map(task => task.title.trim().toLowerCase())
    );

    const newTasks = [];
    const submittedTitles = new Set();

    for (const item of suggestions) {
      if (
        typeof item.title !== "string" ||
        typeof item.description !== "string" ||
        typeof item.category !== "string"
      ) {
        return res.status(400).json({ message: "Invalid suggestion format." });
      }

      const title = item.title.trim().slice(0, 150);
      const description = item.description.trim().slice(0, 500);
      const category = item.category.trim().slice(0, 50);
      const normalizedTitle = title.toLowerCase();

      if (!title || !description || !category) {
        return res.status(400).json({ message: "Suggestion fields cannot be empty." });
      }

      if (
        existingTitles.has(normalizedTitle) ||
        submittedTitles.has(normalizedTitle)
      ) {
        continue;
      }

      submittedTitles.add(normalizedTitle);

      newTasks.push({
        title,
        description,
        category,
        client: client._id,
        firm: user.firm,
        assignedTo: client.assignedStaff || null,
        createdBy: user._id,
      });
    }

    if (newTasks.length === 0) {
      return res.status(400).json({
        message: "No new suggestions to save. Tasks may already exist.",
      });
    }

    const savedTasks = await Checklist.insertMany(newTasks);

    return res.status(201).json({
      message: "Approved checklist suggestions saved successfully.",
      count: savedTasks.length,
      tasks: savedTasks,
    });
  } catch (error) {
    console.error("AI checklist approval error:", error.message);
    return res.status(500).json({
      message: "Unable to save approved suggestions.",
    });
  }
});
module.exports = router;
