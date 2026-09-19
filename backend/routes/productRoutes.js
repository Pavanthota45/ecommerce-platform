const express = require("express");

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// PUBLIC PRODUCT ROUTES
// ==========================================

router.get("/", getProducts);

router.get("/:id", getProductById);


// ==========================================
// ADMIN PRODUCT ROUTES
// ==========================================

router.post(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    createProduct
);

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    updateProduct
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    deleteProduct
);


module.exports = router;