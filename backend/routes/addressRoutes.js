const express = require("express");

const {
    getAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress
} = require("../controllers/addressController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// GET ALL CUSTOMER ADDRESSES
// ==========================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    getAddresses
);

// ==========================================
// GET SINGLE ADDRESS
// ==========================================

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("customer"),
    getAddressById
);

// ==========================================
// CREATE ADDRESS
// ==========================================

router.post(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    createAddress
);

// ==========================================
// UPDATE ADDRESS
// ==========================================

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("customer"),
    updateAddress
);

// ==========================================
// SET DEFAULT ADDRESS
// ==========================================

router.put(
    "/:id/default",
    authMiddleware,
    authorizeRoles("customer"),
    setDefaultAddress
);

// ==========================================
// DELETE ADDRESS
// ==========================================

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("customer"),
    deleteAddress
);

module.exports = router;