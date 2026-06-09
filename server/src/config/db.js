import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  if (!env.mongodbUri) {
    console.warn("MONGODB_URI is not set. Write operations will be skipped.");
    return null;
  }

  mongoose.set("strictQuery", true);

  try {
    const connection = await mongoose.connect(env.mongodbUri, {
      autoIndex: env.nodeEnv !== "production"
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    if (env.mongodbRequired) {
      throw error;
    }

    return null;
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
