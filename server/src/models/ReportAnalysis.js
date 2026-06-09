import mongoose from "mongoose";
import { guidanceSchema } from "./HealthCheck.js";

const reportAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    reportText: {
      type: String,
      required: true,
      trim: true
    },
    guidance: guidanceSchema,
    aiModel: String,
    source: {
      type: String,
      enum: ["openai", "fallback", "rules"],
      default: "openai"
    }
  },
  { timestamps: true }
);

export const ReportAnalysis = mongoose.model("ReportAnalysis", reportAnalysisSchema);
