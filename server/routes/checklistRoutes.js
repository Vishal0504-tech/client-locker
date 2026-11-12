
const express = require("express");
const router = express.Router();

const Checklist = require("../models/Checklist");
const { protect } = require("../middleware/authMiddleware");

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

    // Base filter: task must belong to the user's firm
    let filter = {
      _id: req.params.id,
      firm: user.firm,
    };

    // Partner: Any task in their firm
    if (user.role === "partner") {
      // No additional filter needed
    }

    // Staff: Only tasks assigned to them
    else if (user.role === "staff") {
      filter.assignedTo = user._id;
    }

    // Client: Only tasks belonging to them
    else if (user.role === "client") {
      if (!user.client) {
        return res.status(400).json({
          message: "Client account is not linked to a client record.",
        });
      }

      filter.client = user.client;
    }

    else {
      return res.status(403).json({
        message: "Access denied.",
      });
    }

    const checklist = await Checklist.findOneAndUpdate(
      filter,
      { isCompleted },
      { new: true, runValidators: true }
    );

    if (!checklist) {
      return res.status(404).json({
        message: "Checklist task not found or access denied.",
      });
    }

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

module.exports = router;
