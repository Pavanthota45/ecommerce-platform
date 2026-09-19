const express = require("express");

const {
    getAdminAnalytics
} = require("../controllers/adminAnalyticsController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// GET ADMIN ANALYTICS
// ======================================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    getAdminAnalytics
);

module.exports = router;