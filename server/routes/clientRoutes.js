
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const crypto = require("crypto");
const Client = require("../models/Client");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const Checklist = require("../models/Checklist");

const {
  protect,
  authorize,
  requireClientAccess,
} = require("../middleware/authMiddleware");

const {
  generateChecklistSuggestions,
} = require("../services/aiChecklistService");

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

    // AUDITOR: View only assigned clients in the same firm
    else if (user.role === "auditor") {
      clients = await Client.find({
        _id: { $in: user.assignedClients || [] },
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

// POST /api/clients
// PARTNER ONLY: Create client and login account
router.post("/", protect, authorize("partner"), async (req, res) => {
  let createdClient = null;

  try {
    const {
      name,
      email,
      phone,
      company,
      address,
      assignedStaffId,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({
        message: "Name, email and phone are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const existingClient = await Client.findOne({
      email: normalizedEmail,
      firm: req.user.firm,
    });

    if (existingClient) {
      return res.status(409).json({
        message: "This client already exists in your firm.",
      });
    }

    let staff = null;

    if (assignedStaffId) {
      if (!mongoose.Types.ObjectId.isValid(assignedStaffId)) {
        return res.status(400).json({
          message: "Invalid staff ID.",
        });
      }

      staff = await User.findOne({
        _id: assignedStaffId,
        firm: req.user.firm,
        role: "staff",
        isActive: true,
      });

      if (!staff) {
        return res.status(404).json({
          message: "Active staff member not found.",
        });
      }
    }

    createdClient = await Client.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      company: company?.trim() || "",
      address: address?.trim() || "",
      firm: req.user.firm,
      assignedStaff: staff?._id || null,
      status: "active",
    });

    const temporaryPassword = crypto.randomBytes(32).toString("hex");

    try {
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: temporaryPassword,
        role: "client",
        firm: req.user.firm,
        client: createdClient._id,
        isActive: true,
      });
    } catch (userError) {
      await Client.findByIdAndDelete(createdClient._id);
      throw userError;
    }

    return res.status(201).json({
      message: "Client and login account created successfully.",
      client: createdClient,
    });
  } catch (error) {
    console.error("Client creation error:", error.message);

    return res.status(500).json({
      message: "Failed to create client.",
    });
  }
});


// PATCH /api/clients/:id
// PARTNER ONLY: Edit client details
router.patch(
  "/:id",
  protect,
  authorize("partner"),
  requireClientAccess((req) => req.params.id),
  async (req, res) => {
    try {
      const client = req.client;
      const { name, email, phone, company, address, status } = req.body;

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          return res.status(400).json({ message: "Valid name is required." });
        }
        client.name = name.trim();
      }

      if (email !== undefined) {
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      message: "Valid email is required.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const linkedUser = await User.findOne({
    client: client._id,
    role: "client",
    firm: req.user.firm,
  });

  const existingUser = await User.findOne({
    email: normalizedEmail,
    ...(linkedUser ? { _id: { $ne: linkedUser._id } } : {}),
  });

  if (existingUser) {
    return res.status(409).json({
      message: "This email is already used by another account.",
    });
  }

  if (!linkedUser) {
    return res.status(404).json({
      message: "Linked client login account not found.",
    });
  }

  client.email = normalizedEmail;
  linkedUser.email = normalizedEmail;

  await linkedUser.save();
}

      if (phone !== undefined) {
        if (typeof phone !== "string" || !phone.trim()) {
          return res.status(400).json({ message: "Valid phone is required." });
        }
        client.phone = phone.trim();
      }

      if (company !== undefined) {
        client.company = typeof company === "string" ? company.trim() : "";
      }

      if (address !== undefined) {
        client.address = typeof address === "string" ? address.trim() : "";
      }

      if (status !== undefined) {
        if (!["active", "inactive"].includes(status)) {
          return res.status(400).json({ message: "Invalid client status." });
        }
        client.status = status;
      }

      await client.save();

      const updatedClient = await Client.findById(client._id)
        .populate("assignedStaff", "name email designation");

      return res.status(200).json({
        message: "Client updated successfully.",
        client: updatedClient,
      });
    } catch (error) {
      console.error("Client update error:", error.message);
      return res.status(500).json({
        message: "Failed to update client.",
      });
    }
  }
);
// PATCH /api/clients/:id/assign
// PARTNER ONLY: Assign, reassign or unassign staff
router.patch(
  "/:id/assign",
  protect,
  authorize("partner"),
  requireClientAccess((req) => req.params.id),
  async (req, res) => {
    try {
      const { assignedStaffId } = req.body;
      const client = req.client;

      // Remove the current staff assignment
      if (assignedStaffId === null) {
        const previousStaffId = client.assignedStaff
          ? String(client.assignedStaff)
          : null;

        if (!previousStaffId) {
          return res.status(400).json({
            message: "No staff assignment exists for this client.",
          });
        }

        client.assignedStaff = null;
        await client.save();

        try {
          await ActivityLog.create({
            user: req.user._id,
            action: "access_revoke",
            client: client._id,
            details: `Staff access removed from client ${client.name}. Previous staff ID: ${previousStaffId}`,
          });
        } catch (logError) {
          console.error(
            "Staff access revoke logging failed:",
            logError.message
          );
        }

        return res.status(200).json({
          message: "Staff assignment removed successfully.",
          client,
        });
      }

      // Validate staff ID
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

      // Capture previous assignment before changing it
      const previousStaffId = client.assignedStaff
        ? String(client.assignedStaff)
        : null;

      const newStaffId = String(staff._id);

      // Update staff assignment
      client.assignedStaff = staff._id;
      await client.save();

      // Log access changes only when the assignment changes
      if (previousStaffId !== newStaffId) {
        try {
          if (previousStaffId) {
            await ActivityLog.create({
              user: req.user._id,
              action: "access_revoke",
              client: client._id,
              details: `Staff access revoked from previous staff ID: ${previousStaffId} for client ${client.name}`,
            });
          }

          await ActivityLog.create({
            user: req.user._id,
            action: "access_grant",
            client: client._id,
            details: `Staff access granted to ${staff.name} (${staff._id}) for client ${client.name}`,
          });
        } catch (logError) {
          console.error(
            "Staff assignment logging failed:",
            logError.message
          );
        }
      }

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
  }
);

// POST /api/checklists/ai-suggestions
// Generate AI checklist suggestions for an accessible client
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
      console.error("AI checklist suggestion error:", error.message);

      return res.status(503).json({
        message:
          "AI suggestions are temporarily unavailable. Please use manual checklist entry.",
      });
    }
  }
);

// POST /api/checklists/ai-suggestions/approve
// Save only suggestions explicitly approved by staff or partner
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

      if (
        !Array.isArray(suggestions) ||
        suggestions.length === 0 ||
        suggestions.length > 5
      ) {
        return res.status(400).json({
          message: "Please approve between 1 and 5 suggestions.",
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
            message:
              "Each suggestion must contain title, description and category.",
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
  }
);

module.exports = router;
