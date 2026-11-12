
const express = require("express");
const router = express.Router();

const Client = require("../models/Client");
const { protect } = require("../middleware/authMiddleware");

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
    }

    else {
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

module.exports = router;
