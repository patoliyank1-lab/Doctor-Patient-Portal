import express from "express";
import { authenticate } from "../../middlewares/authenticate";
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markAsRead,
} from "./notifications.controller";

const router = express.Router();

// Specific string routes FIRST — before any /:id param routes
router.get("/unread-count", authenticate, getUnreadCount);    // GET  /notifications/unread-count
router.put("/read-all",     authenticate, markAllRead);        // PUT  /notifications/read-all

// Parameterised routes
router.get("/",             authenticate, getNotifications);   // GET  /notifications
router.put("/:id/read",     authenticate, markAsRead);         // PUT  /notifications/:id/read
router.delete("/:id",       authenticate, deleteNotification); // DELETE /notifications/:id

export default router;
