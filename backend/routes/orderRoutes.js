const express = require("express");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    requestReturn
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    createOrder
);

router.get(
    "/",
    authMiddleware,
    authorizeRoles("customer"),
    getMyOrders
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("customer"),
    getOrderById
);

router.put(
    "/:id/cancel",
    authMiddleware,
    authorizeRoles("customer"),
    cancelOrder
);

router.put(
    "/:id/return",
    authMiddleware,
    authorizeRoles("customer"),
    requestReturn
);

module.exports = router;