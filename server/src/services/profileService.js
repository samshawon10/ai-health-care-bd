import { isDbConnected } from "../config/db.js";
import { User } from "../models/User.js";

export async function getStoredProfile(clientId) {
  if (!clientId || !isDbConnected()) {
    return {};
  }

  try {
    const user = await User.findOne({ clientId }).lean();
    if (!user) {
      return {};
    }

    return {
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      district: user.district,
      bloodGroup: user.bloodGroup,
      knownConditions: user.knownConditions
    };
  } catch (error) {
    console.error("Failed to load stored profile:", error.message);
    return {};
  }
}
