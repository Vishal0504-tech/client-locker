
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({ path: ".env.test" });

const mongoose = require("mongoose");
const app = require("../app");

module.exports = { mongoose, app };
