
const express = require("express");
const router = express.Router();

const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// GET /api/activity
// View activity history for the partner's firm
router.get("/", protect, authorize("partner"), async (req, res) => {
  try {
    const firmUsers = await User.find({
      firm: req.user.firm,
    }).select("_id");

    const userIds = firmUsers.map((user) => user._id);

    const activities = await ActivityLog.find({
      user: { $in: userIds },
    })
      .populate("user", "name email role")
      .populate("document", "originalName mimeType")
      .populate("client", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      count: activities.length,
      activities,
    });

  } catch (error) {
    console.error("Activity listing error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch activity logs.",
    });
  }
});

module.exports = router;
