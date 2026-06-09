import mongoose from "mongoose";

const clinicalNoteSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["note", "prescription", "patient_message"],
      default: "note"
    },
    title: {
      type: String,
      trim: true,
      default: "Clinical note"
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["draft", "sent", "archived"],
      default: "sent"
    }
  },
  { timestamps: true }
);

export const ClinicalNote = mongoose.model("ClinicalNote", clinicalNoteSchema);
