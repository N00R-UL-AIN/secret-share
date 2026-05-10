const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== "production",
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = { connectDB };