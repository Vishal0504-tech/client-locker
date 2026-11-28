
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const Client = require("../models/Client");
const ActivityLog = require("../models/ActivityLog");
const MagicLink = require("../models/MagicLink");

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  generateMagicToken,
  hashMagicToken,
} = require("../utils/magicLinkUtils");

const router = express.Router();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Existing password login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    try {
      await ActivityLog.create({
        user: user._id,
        action: "login",
        details: `${user.role} logged in successfully.`,
      });
    } catch (logError) {
      console.error("Login activity logging failed:", logError.message);
    }

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// Generate a one-time magic link (Partner only)
router.post(
  "/magic-link",
  protect,
  authorize("partner"),
  async (req, res) => {
    try {
      const { clientId } = req.body;

      if (!clientId || !crypto.isValidUUID?.(clientId) && !/^[a-fA-F0-9]{24}$/.test(clientId)) {
        return res.status(400).json({
          message: "A valid client ID is required.",
        });
      }

      const client = await Client.findOne({
        _id: clientId,
        firm: req.user.firm,
      });

      if (!client) {
        return res.status(404).json({
          message: "Client not found in your firm.",
        });
      }

      const user = await User.findOne({
        client: client._id,
        firm: req.user.firm,
        role: "client",
        isActive: true,
      });

      if (!user) {
        return res.status(404).json({
          message: "Active client login account not found.",
        });
      }

      // Invalidate any previous unused magic links for this user
      await MagicLink.updateMany(
        { user: user._id, usedAt: null },
        { $set: { usedAt: new Date() } }
      );

      const rawToken = generateMagicToken();
      const tokenHash = hashMagicToken(rawToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await MagicLink.create({
        user: user._id,
        tokenHash,
        expiresAt,
      });

      const frontendUrl = process.env.FRONTEND_URL;

      if (!frontendUrl) {
        await MagicLink.updateOne(
          { tokenHash },
          { $set: { usedAt: new Date() } }
        );

        return res.status(500).json({
          message: "Frontend URL is not configured.",
        });
      }

      const magicUrl =
        `${frontendUrl.replace(/\/$/, "")}/magic-login?token=${rawToken}`;

      // Email delivery will be connected in the next step.


const emailResult = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: [process.env.MAGIC_LINK_TEST_EMAIL || user.email],
  subject: "ClientLocker - Your Secure Login Link",
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>ClientLocker Secure Login</h2>
      <p>Click below to access your ClientLocker account.</p>
      <a href="${magicUrl}"
         style="background:#2563eb;color:white;padding:12px 20px;
                text-decoration:none;border-radius:6px;">
        Login to ClientLocker
      </a>
      <p>This link expires in 15 minutes and can only be used once.</p>
    </div>
  `,
});

if (emailResult.error) {
  await MagicLink.updateOne(
    { tokenHash },
    { $set: { usedAt: new Date() } }
  );

  console.error("Resend error:", emailResult.error);

  return res.status(502).json({
    message: "Unable to send magic link email.",
  });
}

return res.status(200).json({
  message: "Magic link email sent successfully.",
  expiresInMinutes: 15,
});
    } catch (error) {
      console.error("Magic link generation error:", error.message);
      return res.status(500).json({
        message: "Failed to generate magic link.",
      });
    }
  }
);

// Verify and consume a one-time magic link
router.post("/magic-link/verify", async (req, res) => {
  try {
    const { token } = req.body;

    if (
      typeof token !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(token)
    ) {
      return res.status(400).json({
        message: "Invalid or expired magic link.",
      });
    }

    const tokenHash = hashMagicToken(token);

    // Atomic update prevents two simultaneous uses of the same token
    const magicLink = await MagicLink.findOneAndUpdate(
      {
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true }
    );

    if (!magicLink) {
      return res.status(401).json({
        message: "Invalid, expired or already used magic link.",
      });
    }

    const user = await User.findOne({
      _id: magicLink.user,
      role: "client",
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        message: "Client account is unavailable.",
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    try {
      await ActivityLog.create({
        user: user._id,
        action: "login",
        details: "Client logged in using a one-time magic link.",
      });
    } catch (logError) {
      console.error("Magic link activity logging failed:", logError.message);
    }

    return res.status(200).json({
      message: "Magic link login successful.",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Magic link verification error:", error.message);
    return res.status(500).json({
      message: "Magic link verification failed.",
    });
  }
});


// POST /api/auth/staff-invitation/verify
// Staff members use their invitation token to set their password.
router.post("/staff-invitation/verify", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Invitation token and password are required.",
      });
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Invalid invitation token.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const tokenHash = hashMagicToken(token);

    // Verify and consume the invitation token.
    const invitation = await MagicLink.findOneAndUpdate(
      {
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: { usedAt: new Date() },
      },
      { new: true }
    );

    if (!invitation) {
      return res.status(400).json({
        message: "Invitation link is invalid, expired, or already used.",
      });
    }

    const staff = await User.findOne({
      _id: invitation.user,
      role: "staff",
      isActive: true,
    });

    if (!staff) {
      return res.status(404).json({
        message: "Active staff account not found.",
      });
    }

    // User model automatically hashes the password before saving.
    staff.password = password;
    await staff.save();

    return res.status(200).json({
      message: "Password created successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Staff password setup error:", error.message);

    return res.status(500).json({
      message: "Failed to set staff password.",
    });
  }
});


module.exports = router;
