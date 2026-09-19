const express = require("express");

const {
    getPendingPayments,
    getPaymentById,
    approvePayment,
    rejectPayment
} = require("../controllers/adminPaymentController");

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// ADMIN PAYMENT ROUTES
// ============================================================

// Get pending manual payments
router.get(
    "/pending",
    authMiddleware,
    authorizeRoles("admin"),
    getPendingPayments
);


// Get one payment
router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    getPaymentById
);


// Approve payment
router.put(
    "/:id/approve",
    authMiddleware,
    authorizeRoles("admin"),
    approvePayment
);


// Reject payment
router.put(
    "/:id/reject",
    authMiddleware,
    authorizeRoles("admin"),
    rejectPayment
);


module.exports = router;