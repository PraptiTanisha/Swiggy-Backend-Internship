const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error("MONGO_URL is missing from .env file");
    }

    await mongoose.connect(mongoURL);

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;

