import { User } from "../models/User.js";
import { isDbConnected } from "../config/db.js";

export async function getProfile(req, res) {
  if (!isDbConnected()) {
    return res.json({
      user: null,
      storageAvailable: false,
      warning: "Database is not connected."
    });
  }

  const user = await User.findOne({ clientId: req.params.clientId }).lean();
  res.json({ user, storageAvailable: true });
}

export async function upsertProfile(req, res) {
  if (!isDbConnected()) {
    return res.status(503).json({
      code: "DB_UNAVAILABLE",
      error: "Profile storage is unavailable because MongoDB is not connected."
    });
  }

  const user = await User.findOneAndUpdate(
    { clientId: req.params.clientId },
    {
      $set: {
        clientId: req.params.clientId,
        ...req.body
      }
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  ).lean();

  res.json({ user });
}
