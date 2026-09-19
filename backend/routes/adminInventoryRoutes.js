const express = require("express");

const {
    getAllInventory,
    getInventoryByProduct,
    updateInventory,
    addStock,
    reduceStock
} = require("../controllers/adminInventoryController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// All inventory routes require admin authentication
router.use(authMiddleware);
router.use(authorizeRoles("admin"));


// Get all inventory
router.get("/", getAllInventory);


// Get inventory for one product
router.get("/:productId", getInventoryByProduct);


// Set exact stock quantity
router.put("/:productId", updateInventory);


// Add stock
router.post("/:productId/add", addStock);


// Reduce stock
router.post("/:productId/reduce", reduceStock);


module.exports = router;