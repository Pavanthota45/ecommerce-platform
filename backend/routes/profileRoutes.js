const express = require("express");

const {
    getMyProfile,
    updateMyProfile,
    changePassword
} = require("../controllers/profileController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// CUSTOMER PROFILE
// ==========================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    getMyProfile
);

// ==========================================
// UPDATE PROFILE
// ==========================================

router.put(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    updateMyProfile
);

// ==========================================
// CHANGE PASSWORD
// ==========================================

router.put(
    "/password",
    authMiddleware,
    authorizeRoles("customer"),
    changePassword
);

module.exports = router;