
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const Client = require("../models/Client");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "User account not found or inactive.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

// Role-based access control
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

const idsMatch = (left, right) => {
  if (!left || !right) {
    return false;
  }

  return left.toString() === right.toString();
};

const userCanAccessClient = (user, client) => {
  if (!user || !user.isActive || !client) {
    return false;
  }

  if (user.role === "partner") {
    return idsMatch(user.firm, client.firm);
  }

  if (user.role === "staff") {
    return (
      idsMatch(user.firm, client.firm) &&
      idsMatch(client.assignedStaff, user._id)
    );
  }

  if (user.role === "auditor") {
    const assignedClients = user.assignedClients || [];
    const isAssigned = assignedClients.some((clientId) =>
      idsMatch(clientId, client._id)
    );

    return idsMatch(user.firm, client.firm) && isAssigned;
  }

  if (user.role === "client") {
  return (
    idsMatch(user.client, client._id) &&
    idsMatch(user.firm, client.firm)
  );
}

  return false;
};

const requireClientAccess = (getClientId) => {
  return async (req, res, next) => {
    try {
      const clientId =
        typeof getClientId === "function"
          ? getClientId(req)
          : req.params.id || req.body.clientId;

      if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({
          message: "A valid client ID is required.",
        });
      }

      const client = await Client.findById(clientId);

      if (!client) {
        return res.status(404).json({
          message: "Client not found.",
        });
      }

      if (!userCanAccessClient(req.user, client)) {
        return res.status(403).json({
          message: "Access denied. You do not have permission to access this client.",
        });
      }

      req.client = client;
      next();
    } catch (error) {
      return res.status(500).json({
        message: "Failed to verify client access.",
      });
    }
  };
};

module.exports = {
  protect,
  authorize,
  userCanAccessClient,
  requireClientAccess,
};
