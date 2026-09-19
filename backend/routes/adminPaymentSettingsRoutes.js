const express = require("express");

const {
    getPaymentSettings,
    updatePaymentSettings
} = require("../controllers/adminPaymentSettingsController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// ADMIN AUTHENTICATION
// ======================================================

router.use(authMiddleware);

router.use(
    authorizeRoles("admin")
);


// ======================================================
// GET PAYMENT SETTINGS
// ======================================================

router.get(
    "/",
    getPaymentSettings
);


// ======================================================
// UPDATE PAYMENT SETTINGS
// ======================================================

router.put(
    "/",
    updatePaymentSettings
);


module.exports = router;