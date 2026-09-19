const express = require("express");

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ===============================
// PUBLIC ROUTES
// ===============================

// Get all categories
router.get("/", getCategories);

// Get single category
router.get("/:id", getCategoryById);


// ===============================
// ADMIN ROUTES
// ===============================

// Create category
router.post(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    createCategory
);

// Update category
router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    updateCategory
);

// Delete category
router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    deleteCategory
);


module.exports = router;