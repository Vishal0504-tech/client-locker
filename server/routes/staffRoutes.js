
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { protect, authorize } = require("../middleware/authMiddleware");

// GET /api/staff
// Only partners can view staff members in their firm.
router.get("/", protect, authorize("partner"), async (req, res) => {
  try {
    const staff = await User.find({
      firm: req.user.firm,
      role: "staff",
    })
      .select("name email designation isActive createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error("Staff fetch error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch staff members.",
    });
  }
});

module.exports = router;
