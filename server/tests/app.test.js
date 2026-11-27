
const { test, before, after, mock } = require("node:test");

const request = require("supertest");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { mongoose, app } = require("./setup");
const supabase = require("../config/supabase");
const Firm = require("../models/Firm");
const User = require("../models/User");
const Client = require("../models/Client");
const Document = require("../models/Document");
const SecureDownload = require("../models/SecureDownload");

const {
  hashDownloadToken,
} = require("../utils/secureDownloadUtils");

let firm;
let partner;
let staff;
let client;
let clientUser;

let partnerToken;
let staffToken;
let clientToken;
let testDocument;

const testId = crypto.randomBytes(5).toString("hex");

before(async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  if (mongoose.connection.name !== "clientlocker_test") {
    throw new Error("Refusing to run tests outside clientlocker_test.");
  }

  firm = await Firm.create({
    name: `Automated Test Firm ${testId}`,
    email: `firm-${testId}@test.com`,
  });

  partner = await User.create({
    name: "Test Partner",
    email: `partner-${testId}@test.com`,
    password: "TestPassword@123",
    role: "partner",
    firm: firm._id,
  });

  staff = await User.create({
    name: "Test Staff",
    email: `staff-${testId}@test.com`,
    password: "TestPassword@123",
    role: "staff",
    firm: firm._id,
  });

  client = await Client.create({
    name: "Test Client",
    email: `client-${testId}@test.com`,
    phone: "9876543210",
    firm: firm._id,
    assignedStaff: staff._id,
  });

  clientUser = await User.create({
    name: "Test Client User",
    email: `clientuser-${testId}@test.com`,
    password: "TestPassword@123",
    role: "client",
    firm: firm._id,
    client: client._id,
  });

  testDocument = await Document.create({
  originalName: "test-document.pdf",
  storedName: "test-document.pdf",
  mimeType: "application/pdf",
  size: 100,
  storagePath: `${firm._id}/${client._id}/test-document.pdf`,
  uploadedBy: partner._id,
  client: client._id,
  firm: firm._id,
});

  partnerToken = jwt.sign(
    { id: partner._id, role: partner.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  staffToken = jwt.sign(
    { id: staff._id, role: staff.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  clientToken = jwt.sign(
    { id: clientUser._id, role: clientUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
});

after(async () => {

  await SecureDownload.deleteMany({
  user: { $in: [partner?._id, staff?._id, clientUser?._id].filter(Boolean) },
});

if (testDocument?._id) {
  await Document.deleteOne({ _id: testDocument._id });
}

  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({
      _id: { $in: [partner?._id, staff?._id, clientUser?._id].filter(Boolean) },
    });

    if (client?._id) {
      await Client.deleteOne({ _id: client._id });
    }

    if (firm?._id) {
      await Firm.deleteOne({ _id: firm._id });
    }

    await mongoose.disconnect();
  }
});

// TEST 1: Reject requests without a token
test("1. Protected dashboard rejects missing token", async () => {
  const response = await request(app).get("/api/dashboard");

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}`);
  }
});

// TEST 2: Reject invalid tokens
test("2. Protected dashboard rejects invalid token", async () => {
  const response = await request(app)
    .get("/api/dashboard")
    .set("Authorization", "Bearer invalid-token");

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}`);
  }
});

// TEST 3: Partner dashboard access
test("3. Partner can access dashboard", async () => {
  const response = await request(app)
    .get("/api/dashboard")
    .set("Authorization", `Bearer ${partnerToken}`);

  if (response.status !== 200 || response.body.role !== "partner") {
    throw new Error(`Partner dashboard failed: ${response.status}`);
  }
});

// TEST 4: Staff dashboard access
test("4. Staff can access dashboard", async () => {
  const response = await request(app)
    .get("/api/dashboard")
    .set("Authorization", `Bearer ${staffToken}`);

  if (response.status !== 200 || response.body.role !== "staff") {
    throw new Error(`Staff dashboard failed: ${response.status}`);
  }
});

// TEST 5: Client dashboard access
test("5. Client can access dashboard", async () => {
  const response = await request(app)
    .get("/api/dashboard")
    .set("Authorization", `Bearer ${clientToken}`);

  if (response.status !== 200 || response.body.role !== "client") {
    throw new Error(`Client dashboard failed: ${response.status}`);
  }
});


// TEST 6: Partner-only route allows partner
test("6. Partner can access partner-only route", async () => {
  const response = await request(app)
    .get("/api/test/partner")
    .set("Authorization", `Bearer ${partnerToken}`);

  if (response.status !== 200) {
    throw new Error(`Expected 200, received ${response.status}`);
  }
});

// TEST 7: Partner-only route rejects staff
test("7. Staff cannot access partner-only route", async () => {
  const response = await request(app)
    .get("/api/test/partner")
    .set("Authorization", `Bearer ${staffToken}`);

  if (response.status !== 403) {
    throw new Error(`Expected 403, received ${response.status}`);
  }
});

// TEST 8: Partner-only route rejects client
test("8. Client cannot access partner-only route", async () => {
  const response = await request(app)
    .get("/api/test/partner")
    .set("Authorization", `Bearer ${clientToken}`);

  if (response.status !== 403) {
    throw new Error(`Expected 403, received ${response.status}`);
  }
});

// TEST 9: Inactive account is rejected
test("9. Inactive staff account cannot access protected route", async () => {
  staff.isActive = false;
  await staff.save();

  try {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);

    if (response.status !== 401) {
      throw new Error(`Expected 401, received ${response.status}`);
    }
  } finally {
    staff.isActive = true;
    await staff.save();
  }
});

// TEST 10: Invalid password is rejected
test("10. Login rejects incorrect password", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: staff.email,
      password: "WrongPassword@123",
    });

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}`);
  }
});

// TEST 11: Secure download rejects missing JWT
test("11. Secure download rejects missing JWT", async () => {
  const response = await request(app)
    .get(`/api/documents/download/${crypto.randomBytes(32).toString("hex")}`);

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}`);
  }
});

// TEST 12: Secure download rejects invalid JWT
test("12. Secure download rejects invalid JWT", async () => {
  const response = await request(app)
    .get(`/api/documents/download/${crypto.randomBytes(32).toString("hex")}`)
    .set("Authorization", "Bearer invalid-token");

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}`);
  }
});

// TEST 13: Secure download rejects another user's JWT
test("13. Secure download rejects a different user", async () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await SecureDownload.create({
    document: testDocument._id,
    user: partner._id,
    tokenHash: hashDownloadToken(rawToken),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const response = await request(app)
    .get(`/api/documents/download/${rawToken}`)
    .set("Authorization", `Bearer ${staffToken}`);

  if (response.status !== 403) {
    throw new Error(`Expected 403, received ${response.status}`);
  }
});

// TEST 14: Secure download rejects expired links
test("14. Secure download rejects expired links", async () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await SecureDownload.create({
    document: testDocument._id,
    user: partner._id,
    tokenHash: hashDownloadToken(rawToken),
    expiresAt: new Date(Date.now() - 60 * 1000),
  });

  const response = await request(app)
    .get(`/api/documents/download/${rawToken}`)
    .set("Authorization", `Bearer ${partnerToken}`);

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}`);
  }
});

// TEST 15: Secure download rejects reused links
test("15. Secure download rejects reused links", async () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await SecureDownload.create({
    document: testDocument._id,
    user: partner._id,
    tokenHash: hashDownloadToken(rawToken),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: new Date(),
  });

  const response = await request(app)
    .get(`/api/documents/download/${rawToken}`)
    .set("Authorization", `Bearer ${partnerToken}`);

  if (response.status !== 401) {
    throw new Error(`Expected 401, received ${response.status}`);
  }
});

// TEST 16: Authorized user can successfully download a document
test("16. Authorized user can download a document", async () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await SecureDownload.create({
    document: testDocument._id,
    user: partner._id,
    tokenHash: hashDownloadToken(rawToken),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const storageMock = mock.method(
    supabase.storage,
    "from",
    () => ({
      download: async () => ({
        data: new Blob(
          [Buffer.from("Test PDF content")],
          { type: "application/pdf" }
        ),
        error: null,
      }),
    })
  );

  try {
    const response = await request(app)
      .get(`/api/documents/download/${rawToken}`)
      .set("Authorization", `Bearer ${partnerToken}`);

    if (response.status !== 200) {
      throw new Error(
        `Expected 200, received ${response.status}: ${response.text}`
      );
    }

    if (!response.headers["content-disposition"]?.includes("attachment")) {
      throw new Error("Download attachment header is missing.");
    }

    if (!response.body.equals(Buffer.from("Test PDF content"))) {
      throw new Error("Downloaded file content does not match.");
    }

    const savedToken = await SecureDownload.findOne({
      tokenHash: hashDownloadToken(rawToken),
    });

    if (!savedToken?.usedAt) {
      throw new Error("Download token was not marked as used.");
    }
  } finally {
    storageMock.mock.restore();
  }
});
