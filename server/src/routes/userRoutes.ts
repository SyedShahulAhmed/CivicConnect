import { Router } from "express";

import { authMiddleware } from "../middleware/authMiddleware";
import {
  getUserProfile,
  updateUserPassword,
  updateUserProfile,
} from "../controllers/userController";

const router = Router();

router.use(authMiddleware);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.put("/password", updateUserPassword);

export default router;
