const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Firm = require("./models/Firm");
const User = require("./models/User");
const Client = require("./models/Client");
const Checklist = require("./models/Checklist");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected!");

    // Clear previous sample data
    await Checklist.deleteMany({});
    await Client.deleteMany({});
    await User.deleteMany({});
    await Firm.deleteMany({});

    // 1. Create one firm
    const firm = await Firm.create({
      name: "Vaigai Vel & Associates",
      email: "info@vaigaivel.com",
      phone: "9876543210",
      address: "Chennai, Tamil Nadu",
    });

    // 2. Create two partners and six staff
    const users = [
      {
        name: "Arun Kumar",
        email: "partner1@clientlocker.com",
        password: "Partner@123",
        role: "partner",
        designation: "Managing Partner",
      },
      {
        name: "Priya Devi",
        email: "partner2@clientlocker.com",
        password: "Partner@123",
        role: "partner",
        designation: "Partner",
      },
      {
        name: "Karthik",
        email: "staff1@clientlocker.com",
        password: "Staff@123",
        role: "staff",
        designation: "Senior Staff",
      },
      {
        name: "Divya",
        email: "staff2@clientlocker.com",
        password: "Staff@123",
        role: "staff",
        designation: "Accountant",
      },
      {
        name: "Rahul",
        email: "staff3@clientlocker.com",
        password: "Staff@123",
        role: "staff",
        designation: "Document Manager",
      },
      {
        name: "Sneha",
        email: "staff4@clientlocker.com",
        password: "Staff@123",
        role: "staff",
        designation: "Staff",
      },
      {
        name: "Manoj",
        email: "staff5@clientlocker.com",
        password: "Staff@123",
        role: "staff",
        designation: "Staff",
      },
      {
        name: "Ajay",
        email: "trainee@clientlocker.com",
        password: "Trainee@123",
        role: "staff",
        designation: "Trainee",
      },
    ];

    const createdUsers = await Promise.all(
      users.map(async (user) => {
        return User.create({
          ...user,
          firm: firm._id,
        });
      })
    );

    // 3. Create ten clients
    const clientData = [
      ["Ramesh", "ramesh@example.com"],
      ["Suresh", "suresh@example.com"],
      ["Kavitha", "kavitha@example.com"],
      ["Meena", "meena@example.com"],
      ["Prakash", "prakash@example.com"],
      ["Anitha", "anitha@example.com"],
      ["Vijay", "vijay@example.com"],
      ["Divakar", "divakar@example.com"],
      ["Lakshmi", "lakshmi@example.com"],
      ["Ganesh", "ganesh@example.com"],
    ];

    const clients = await Client.create(
      clientData.map(([name, email], index) => ({
        name,
        email,
        phone: `90000000${String(index + 1).padStart(2, "0")}`,
        company: `${name} Enterprises`,
        address: "Chennai, Tamil Nadu",
        firm: firm._id,
        assignedStaff: createdUsers[2 + (index % 6)]._id,
      }))
    );

    // 3.1 Create login accounts for all ten clients
const clientUsers = await User.create(
  clients.map((client) => ({
    name: client.name,
    email: client.email,
    password: "Client@123",
    role: "client",
    designation: "Client",
    firm: firm._id,
    client: client._id,
  }))
);

console.log("Client login accounts:", clientUsers.length);

    // 4. Create 50 checklist items
    const checklistTitles = [
      "Collect identity proof",
      "Collect address proof",
      "Verify client details",
      "Collect required documents",
      "Review submitted documents",
    ];

    const checklistItems = [];

    clients.forEach((client, index) => {
      checklistTitles.forEach((title, taskIndex) => {
        checklistItems.push({
          title,
          description: `${title} for ${client.name}`,
          category: "Document Verification",
          isCompleted: false,
          client: client._id,
          assignedTo: createdUsers[2 + (index % 6)]._id,
          firm: firm._id,
          createdBy: createdUsers[0]._id,
        });
      });
    });

    await Checklist.insertMany(checklistItems);

    console.log("Sample database created successfully!");
    console.log("Firm: 1");
    console.log("Partners: 2");
    console.log("Staff: 6");
    console.log("Clients: 10");
    console.log("Checklist items:", checklistItems.length);
    console.log("Client passwords: Client@123 (to be configured separately)");

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();