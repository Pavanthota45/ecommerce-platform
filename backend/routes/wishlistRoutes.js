const express = require("express");

const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist
} = require("../controllers/wishlistController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// GET WISHLIST
// GET /api/wishlist
// ==========================================
router.get(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    getWishlist
);


// ==========================================
// ADD PRODUCT TO WISHLIST
// POST /api/wishlist/items
// ==========================================
router.post(
    "/items",
    authMiddleware,
    authorizeRoles("customer"),
    addToWishlist
);


// ==========================================
// CHECK PRODUCT IN WISHLIST
// GET /api/wishlist/check/:productId
// ==========================================
router.get(
    "/check/:productId",
    authMiddleware,
    authorizeRoles("customer"),
    checkWishlist
);


// ==========================================
// REMOVE PRODUCT FROM WISHLIST
// DELETE /api/wishlist/items/:productId
// ==========================================
router.delete(
    "/items/:productId",
    authMiddleware,
    authorizeRoles("customer"),
    removeFromWishlist
);


module.exports = router;