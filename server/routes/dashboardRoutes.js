
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Client = require("../models/Client");
const Document = require("../models/Document");
const Checklist = require("../models/Checklist");

const { protect } = require("../middleware/authMiddleware");

// GET /api/dashboard
router.get("/", protect, async (req, res) => {
  try {
    const user = req.user;

    // PARTNER DASHBOARD
    if (user.role === "partner") {
      const [totalClients, totalStaff, totalDocuments, pendingTasks] =
        await Promise.all([
          Client.countDocuments({ firm: user.firm }),
          User.countDocuments({ firm: user.firm, role: "staff" }),
          Document.countDocuments({ firm: user.firm }),
          Checklist.countDocuments({
            firm: user.firm,
            isCompleted: false,
          }),
        ]);

      return res.status(200).json({
        role: "partner",
        dashboard: {
          totalClients,
          totalStaff,
          totalDocuments,
          pendingTasks,
        },
      });
    }

    // STAFF DASHBOARD
    if (user.role === "staff") {
      const assignedClients = await Client.find({
        firm: user.firm,
        assignedStaff: user._id,
      }).select("_id name");

      const clientIds = assignedClients.map((client) => client._id);

      const [totalDocuments, totalTasks, pendingTasks] =
        await Promise.all([
          Document.countDocuments({ client: { $in: clientIds } }),
          Checklist.countDocuments({ assignedTo: user._id }),
          Checklist.countDocuments({
            assignedTo: user._id,
            isCompleted: false,
          }),
        ]);

      return res.status(200).json({
        role: "staff",
        dashboard: {
          totalClients: assignedClients.length,
          totalDocuments,
          totalTasks,
          pendingTasks,
        },
      });
    }

    // CLIENT DASHBOARD
    if (user.role === "client") {
      if (!user.client) {
        return res.status(400).json({
          message: "Client account is not linked to a client record.",
        });
      }

      const [totalDocuments, totalTasks, pendingTasks] =
        await Promise.all([
          Document.countDocuments({ client: user.client }),
          Checklist.countDocuments({ client: user.client }),
          Checklist.countDocuments({
            client: user.client,
            isCompleted: false,
          }),
        ]);

      return res.status(200).json({
        role: "client",
        dashboard: {
          totalDocuments,
          totalTasks,
          pendingTasks,
        },
      });
    }



    // AUDITOR DASHBOARD
    if (user.role === "auditor") {
      const assignedClients = await Client.find({
        _id: { $in: user.assignedClients || [] },
        firm: user.firm,
      }).select("_id");

      const clientIds = assignedClients.map((client) => client._id);

      const [totalDocuments, totalTasks, pendingTasks] =
        await Promise.all([
          Document.countDocuments({
            firm: user.firm,
            client: { $in: clientIds },
          }),
          Checklist.countDocuments({
            firm: user.firm,
            client: { $in: clientIds },
          }),
          Checklist.countDocuments({
            firm: user.firm,
            client: { $in: clientIds },
            isCompleted: false,
          }),
        ]);

      return res.status(200).json({
        role: "auditor",
        dashboard: {
          totalClients: assignedClients.length,
          totalDocuments,
          totalTasks,
          pendingTasks,
        },
      });
    }


    return res.status(403).json({
      message: "Invalid user role.",
    });

  } catch (error) {
    console.error("Dashboard error:", error.message);

    return res.status(500).json({
      message: "Failed to load dashboard.",
    });
  }
});

module.exports = router;
