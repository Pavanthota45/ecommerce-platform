const express = require("express");

const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../controllers/cartController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ==========================================
// GET CUSTOMER CART
// ==========================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    getCart
);

// ==========================================
// ADD PRODUCT TO CART
// ==========================================

router.post(
    "/items",
    authMiddleware,
    authorizeRoles("customer"),
    addToCart
);

// ==========================================
// UPDATE CART ITEM QUANTITY
// ==========================================

router.put(
    "/items/:productId",
    authMiddleware,
    authorizeRoles("customer"),
    updateCartItem
);

// ==========================================
// REMOVE PRODUCT FROM CART
// ==========================================

router.delete(
    "/items/:productId",
    authMiddleware,
    authorizeRoles("customer"),
    removeCartItem
);

// ==========================================
// CLEAR CART
// ==========================================

router.delete(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    clearCart
);

module.exports = router;