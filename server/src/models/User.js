import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    uid: {
      type: String,
      index: true,
      trim: true,
      default: ""
    },
    name: {
      type: String,
      trim: true,
      default: ""
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },
    photoURL: {
      type: String,
      trim: true,
      default: ""
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "clinic_admin"],
      default: "patient"
    },
    age: {
      type: Number,
      min: 0,
      max: 130
    },
    gender: {
      type: String,
      enum: ["female", "male", "other", "prefer_not_to_say", ""],
      default: ""
    },
    district: {
      type: String,
      trim: true,
      default: ""
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: ""
    },
    knownConditions: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
