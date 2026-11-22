
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/checklists", require("./routes/checklistRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/activity", require("./routes/activityRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));
app.use("/api/auditors", require("./routes/auditorRoutes"));

const { protect, authorize } = require("./middleware/authMiddleware");

app.get(
  "/api/test/partner",
  protect,
  authorize("partner"),
  (req, res) => {
    res.status(200).json({
      message: "Partner access granted!",
      role: req.user.role,
    });
  }
);

app.get("/api/test/protected", protect, (req, res) => {
  res.status(200).json({
    message: "Protected route accessed successfully!",
    user: {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

app.get("/", (req, res) => {
  res.send("ClientLocker Backend is running!");
});

module.exports = app;
