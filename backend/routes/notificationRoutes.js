const express = require("express");

const {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// AUTHENTICATION
// ======================================================

router.use(authMiddleware);


// ======================================================
// GET ALL MY NOTIFICATIONS
// ======================================================

router.get(
    "/",
    getMyNotifications
);


// ======================================================
// GET UNREAD NOTIFICATION COUNT
// ======================================================

router.get(
    "/unread-count",
    getUnreadNotificationCount
);


// ======================================================
// MARK ALL AS READ
// ======================================================

router.put(
    "/read-all",
    markAllNotificationsAsRead
);


// ======================================================
// MARK ONE AS READ
// ======================================================

router.put(
    "/:id/read",
    markNotificationAsRead
);


// ======================================================
// DELETE ONE NOTIFICATION
// ======================================================

router.delete(
    "/:id",
    deleteNotification
);


module.exports = router;