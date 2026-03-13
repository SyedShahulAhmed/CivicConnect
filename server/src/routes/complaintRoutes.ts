import { Router } from "express";
import multer from "multer";

import {
  createComplaint,
  getComplaintById,
  getComplaints,
  getNearbyComplaints,
  patchComplaintStatus,
  updateComplaint,
} from "../controllers/complaintController";
import { authMiddleware, optionalAuth } from "../middleware/authMiddleware";
import { roleMiddleware } from "../middleware/roleMiddleware";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", optionalAuth, getComplaints);
router.get("/nearby", getNearbyComplaints);
router.get("/:id", getComplaintById);
router.post("/", authMiddleware, roleMiddleware("citizen", "admin"), upload.single("image"), createComplaint);
router.patch("/:id", authMiddleware, roleMiddleware("citizen", "admin"), upload.single("image"), updateComplaint);
router.patch("/:id/status", authMiddleware, roleMiddleware("admin"), patchComplaintStatus);

export default router;
