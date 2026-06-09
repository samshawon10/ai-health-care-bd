import { Router } from "express";
import {
  createChildProfile,
  getProfile,
  getRoleDashboard,
  listUsers,
  updateUserAccess,
  upsertProfile
} from "../controllers/userController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { verifyFirebaseAuth } from "../middleware/firebaseAuth.js";
import { ROLE, attachUserContext, requireAuthenticated, requireRole, requireUserAccess } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { adminUserAccessSchema, childProfileSchema, profileSchema } from "../validators/schemas.js";

export const userRoutes = Router();

userRoutes.get("/roles", (req, res) =>
  res.json({
    roles: [
      { id: ROLE.SUPER_ADMIN, label: "Super Admin" },
      { id: ROLE.DOCTOR, label: "Doctor" },
      { id: ROLE.PATIENT, label: "Patient" },
      { id: ROLE.GUARDIAN, label: "Child Care / Guardian" }
    ]
  })
);

userRoutes.use(verifyFirebaseAuth, attachUserContext);

userRoutes.get("/dashboard", requireAuthenticated, asyncHandler(getRoleDashboard));
userRoutes.get("/admin/users", requireRole(ROLE.SUPER_ADMIN), asyncHandler(listUsers));
userRoutes.patch(
  "/admin/users/:clientId/access",
  requireRole(ROLE.SUPER_ADMIN),
  validate(adminUserAccessSchema),
  asyncHandler(updateUserAccess)
);
userRoutes.get("/doctor/dashboard", requireRole(ROLE.DOCTOR), asyncHandler(getRoleDashboard));
userRoutes.get("/guardian/dashboard", requireRole(ROLE.GUARDIAN, ROLE.CHILD_CARE), asyncHandler(getRoleDashboard));
userRoutes.post(
  "/guardian/children",
  requireRole(ROLE.GUARDIAN, ROLE.CHILD_CARE, ROLE.PATIENT),
  validate(childProfileSchema),
  asyncHandler(createChildProfile)
);
userRoutes.get("/profile/:clientId", requireAuthenticated, requireUserAccess("params", "clientId"), asyncHandler(getProfile));
userRoutes.put("/profile/:clientId", requireAuthenticated, validate(profileSchema), requireUserAccess("params", "clientId"), asyncHandler(upsertProfile));
