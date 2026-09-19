const express = require("express");

const {
    getPaymentSettings,
    uploadPaymentScreenshot,
    getPendingManualPayments,
    getAllManualPayments,
    approveManualPayment,
    rejectManualPayment
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const uploadPaymentScreenshotMiddleware = require(
    "../middleware/uploadPaymentScreenshot"
);

const router = express.Router();

// =====================================================
// GET PUBLIC PAYMENT SETTINGS
// =====================================================

router.get(
    "/settings",
    getPaymentSettings
);

// =====================================================
// SUBMIT MANUAL PAYMENT DETAILS
//
// CUSTOMER ONLY
//
// Customer sends:
// - transaction_id
// - optional payment_screenshot
//
// Supported methods:
// - UPI
// - QR
// - BANK_TRANSFER
// =====================================================

router.post(
    "/upload-screenshot/:orderId",

    authMiddleware,

    authorizeRoles("customer"),

    uploadPaymentScreenshotMiddleware.single(
        "payment_screenshot"
    ),

    uploadPaymentScreenshot
);

// =====================================================
// GET PENDING MANUAL PAYMENTS
//
// ADMIN ONLY
//
// Used by Admin Payment Verification page.
// =====================================================

router.get(
    "/admin/pending",

    authMiddleware,

    authorizeRoles("admin"),

    getPendingManualPayments
);

// =====================================================
// GET ALL MANUAL PAYMENTS
//
// ADMIN ONLY
//
// Used for payment verification history.
// =====================================================

router.get(
    "/admin/all",

    authMiddleware,

    authorizeRoles("admin"),

    getAllManualPayments
);

// =====================================================
// APPROVE MANUAL PAYMENT
//
// ADMIN ONLY
// =====================================================

router.put(
    "/admin/:paymentId/approve",

    authMiddleware,

    authorizeRoles("admin"),

    approveManualPayment
);

// =====================================================
// REJECT MANUAL PAYMENT
//
// ADMIN ONLY
//
// Optional body:
// {
//     "reason": "Transaction could not be verified."
// }
// =====================================================

router.put(
    "/admin/:paymentId/reject",

    authMiddleware,

    authorizeRoles("admin"),

    rejectManualPayment
);

module.exports = router;