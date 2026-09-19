const express = require("express");

const {
    getAllCustomers,
    getCustomerById,
    getCustomerOrders,
    getCustomerAddresses
} = require("../controllers/adminCustomerController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
    All admin customer routes require:
    1. Valid JWT token
    2. Admin role
*/
router.use(authMiddleware);
router.use(authorizeRoles("admin"));

/*
    GET ALL CUSTOMERS

    GET /api/admin/customers
*/
router.get("/", getAllCustomers);

/*
    GET CUSTOMER BY ID

    GET /api/admin/customers/:id
*/
router.get("/:id", getCustomerById);

/*
    GET CUSTOMER ORDERS

    GET /api/admin/customers/:id/orders
*/
router.get("/:id/orders", getCustomerOrders);

/*
    GET CUSTOMER ADDRESSES

    GET /api/admin/customers/:id/addresses
*/
router.get("/:id/addresses", getCustomerAddresses);

module.exports = router;