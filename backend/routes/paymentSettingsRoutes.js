const express = require("express");

const {
    getPaymentSettings,
    updatePaymentSettings
} = require("../controllers/paymentSettingsController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// =====================================================
// CUSTOMER
// GET PAYMENT SETTINGS
// =====================================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("customer", "admin"),
    getPaymentSettings
);


// =====================================================
// ADMIN
// UPDATE PAYMENT SETTINGS
// =====================================================

router.put(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    updatePaymentSettings
);


module.exports = router;