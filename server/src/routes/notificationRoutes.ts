import { Router } from "express";

import {
  deleteAllNotifications,
  deleteNotification,
  deleteSelectedNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/selected", deleteSelectedNotifications);
router.delete("/", deleteAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
