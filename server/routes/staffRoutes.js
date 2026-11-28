
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const User = require("../models/User");
const MagicLink = require("../models/MagicLink");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  generateMagicToken,
  hashMagicToken,
} = require("../utils/magicLinkUtils");

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

// POST /api/staff
// Only partners can create staff members.
router.post("/", protect, authorize("partner"), async (req, res) => {
  try {
    const { name, email, designation } = req.body;

    if (!name?.trim() || !email?.trim() || !designation?.trim()) {
      return res.status(400).json({
        message: "Name, email and designation are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered.",
      });
    }

    const temporaryPassword = crypto.randomBytes(32).toString("hex");

    const staff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      designation: designation.trim(),
      password: temporaryPassword,
      role: "staff",
      firm: req.user.firm,
      isActive: true,
    });

    return res.status(201).json({
      message: "Staff member created successfully.",
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        designation: staff.designation,
        role: staff.role,
        isActive: staff.isActive,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    console.error("Staff creation error:", error.message);

    return res.status(500).json({
      message: "Failed to create staff member.",
    });
  }
});

// POST /api/staff/:id/invite
// Partner sends a password setup invitation to a staff member.
router.post("/:id/invite", protect, authorize("partner"), async (req, res) => {
  try {
    const staff = await User.findOne({
      _id: req.params.id,
      firm: req.user.firm,
      role: "staff",
      isActive: true,
    });

    if (!staff) {
      return res.status(404).json({
        message: "Active staff member not found.",
      });
    }

    // Invalidate previous unused invitations for this staff member.
    await MagicLink.updateMany(
      {
        user: staff._id,
        usedAt: null,
      },
      {
        $set: { usedAt: new Date() },
      }
    );

    const rawToken = generateMagicToken();
    const tokenHash = hashMagicToken(rawToken);

    // Invitation expires after 24 hours.
    await MagicLink.create({
      user: staff._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      return res.status(500).json({
        message: "Frontend URL is not configured.",
      });
    }

const invitationUrl =
  `${frontendUrl.replace(/\/$/, "")}/staff-invitation?token=${rawToken}`;

const emailResult = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: [process.env.MAGIC_LINK_TEST_EMAIL || staff.email],
  subject: "ClientLocker - Staff Account Invitation",
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to ClientLocker</h2>
      <p>Hello ${staff.name},</p>
      <p>Your staff account has been created.</p>
      <p>Click below to set your password and activate your login:</p>
      <a href="${invitationUrl}"
         style="background:#2563eb;color:white;padding:12px 20px;
                text-decoration:none;border-radius:6px;">
        Set Your Password
      </a>
      <p>This invitation expires in 24 hours and can only be used once.</p>
    </div>
  `,
});

if (emailResult.error) {
  await MagicLink.updateOne(
    { tokenHash },
    { $set: { usedAt: new Date() } }
  );

  console.error("Staff invitation email error:", emailResult.error);

  return res.status(502).json({
    message: "Unable to send staff invitation email.",
  });
}

return res.status(200).json({
  message: "Staff invitation email sent successfully.",
  expiresIn: "24 hours",
});

  } catch (error) {
    console.error("Staff invitation error:", error.message);

    return res.status(500).json({
      message: "Failed to create staff invitation.",
    });
  }
});

module.exports = router;
