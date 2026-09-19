const express = require("express");

const {
    getAllOrders,
    getAdminOrderById,
    updateOrderStatus,
    getOrderStatistics
} = require("../controllers/adminOrderController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// GET ORDER STATISTICS
// ======================================================

router.get(
    "/statistics",
    authMiddleware,
    authorizeRoles("admin"),
    getOrderStatistics
);


// ======================================================
// GET ALL ORDERS
// Supports:
// page
// limit
// search
// status
// ======================================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    getAllOrders
);


// ======================================================
// GET ONE ORDER
// ======================================================

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    getAdminOrderById
);


// ======================================================
// UPDATE ORDER STATUS
// ======================================================

router.put(
    "/:id/status",
    authMiddleware,
    authorizeRoles("admin"),
    updateOrderStatus
);


module.exports = router;