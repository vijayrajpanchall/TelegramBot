import mongoose from "mongoose";
import { logger } from "../utils/logger.js";


const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
    });
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Database connection error:", error);
    process.kill(process.pid, "SIGTERM");
  }
};

export default connectDb;
