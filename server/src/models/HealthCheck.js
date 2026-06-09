import mongoose from "mongoose";

const guidanceSchema = new mongoose.Schema(
  {
    possibleCondition: String,
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },
    explanation: String,
    recommendation: String,
    emergencyAction: String,
    emergencyRequired: {
      type: Boolean,
      default: false
    },
    disclaimer: String,
    language: String
  },
  { _id: false }
);

const healthCheckSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    symptoms: {
      type: String,
      required: true,
      trim: true
    },
    age: Number,
    sex: String,
    location: String,
    emergencyFlags: {
      type: [String],
      default: []
    },
    matchedEmergencyTerms: {
      type: [String],
      default: []
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

export const HealthCheck = mongoose.model("HealthCheck", healthCheckSchema);
export { guidanceSchema };
