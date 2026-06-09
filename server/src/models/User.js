import mongoose from "mongoose";

export const USER_ROLES = ["super_admin", "doctor", "patient", "guardian", "child_care", "clinic_admin"];
export const ACTIVE_USER_STATUSES = ["active", "pending", "banned"];

const childProfileSchema = new mongoose.Schema(
  {
    childId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      min: 0,
      max: 18
    },
    gender: {
      type: String,
      enum: ["female", "male", "other", "prefer_not_to_say", ""],
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
    },
    relationship: {
      type: String,
      trim: true,
      default: "Guardian"
    }
  },
  { timestamps: true, _id: false }
);

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
      enum: USER_ROLES,
      default: "patient"
    },
    status: {
      type: String,
      enum: ACTIVE_USER_STATUSES,
      default: "active",
      index: true
    },
    specialty: {
      type: String,
      trim: true,
      default: ""
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: ""
    },
    assignedPatientIds: {
      type: [String],
      default: [],
      index: true
    },
    assignedDoctorIds: {
      type: [String],
      default: []
    },
    dependentIds: {
      type: [String],
      default: [],
      index: true
    },
    childProfiles: {
      type: [childProfileSchema],
      default: []
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
