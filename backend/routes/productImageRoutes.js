const express = require("express");

const {
    getProductImages,
    addProductImage,
    setPrimaryImage,
    deleteProductImage
} = require("../controllers/productImageController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// GET PRODUCT IMAGES
// ==========================================

router.get(
    "/product/:productId",
    getProductImages
);


// ==========================================
// ADD PRODUCT IMAGE
// ADMIN ONLY
// ==========================================

router.post(
    "/product/:productId",
    authMiddleware,
    authorizeRoles("admin"),
    addProductImage
);


// ==========================================
// SET PRIMARY IMAGE
// ADMIN ONLY
// ==========================================

router.put(
    "/product/:productId/:imageId/primary",
    authMiddleware,
    authorizeRoles("admin"),
    setPrimaryImage
);


// ==========================================
// DELETE PRODUCT IMAGE
// ADMIN ONLY
// ==========================================

router.delete(
    "/product/:productId/:imageId",
    authMiddleware,
    authorizeRoles("admin"),
    deleteProductImage
);


module.exports = router;