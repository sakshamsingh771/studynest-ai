const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[db] MongoDB connected -> ${mongoose.connection.host}`);
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1); // fail fast — an app with no DB should not silently keep running
  }
}

module.exports = connectDB;
