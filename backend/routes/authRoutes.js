const express = require("express");

const {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ============================================================
// PUBLIC AUTHENTICATION ROUTES
// ============================================================

router.post(
    "/register",
    register
);

router.post(
    "/login",
    login
);


// ============================================================
// CUSTOMER PROFILE ROUTES
// ============================================================

router.get(
    "/profile",
    authMiddleware,
    authorizeRoles("customer"),
    getProfile
);

router.put(
    "/profile",
    authMiddleware,
    authorizeRoles("customer"),
    updateProfile
);

router.put(
    "/change-password",
    authMiddleware,
    authorizeRoles("customer"),
    changePassword
);


module.exports = router;