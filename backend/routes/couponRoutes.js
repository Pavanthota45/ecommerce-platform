const express = require("express");

const {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon
} = require("../controllers/couponController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ==========================================
// CUSTOMER ROUTE
// ==========================================

router.post(
    "/validate",
    authMiddleware,
    authorizeRoles("customer"),
    validateCoupon
);


// ==========================================
// ADMIN ROUTES
// ==========================================

router.get(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    getAllCoupons
);

router.post(
    "/",
    authMiddleware,
    authorizeRoles("admin"),
    createCoupon
);

router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    getCouponById
);

router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    updateCoupon
);

router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("admin"),
    deleteCoupon
);


module.exports = router;