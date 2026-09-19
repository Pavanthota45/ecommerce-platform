const express = require("express");

const authMiddleware =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const adminDashboardRoutes =
    require("./adminDashboardRoutes");

const adminAnalyticsRoutes =
    require("./adminAnalyticsRoutes");

const adminCouponRoutes =
    require("./adminCouponRoutes");

const adminCustomerRoutes =
    require("./adminCustomerRoutes");

const adminInventoryRoutes =
    require("./adminInventoryRoutes");

const adminOrderRoutes =
    require("./adminOrderRoutes");

const adminReviewRoutes =
    require("./adminReviewRoutes");

const adminPaymentSettingsRoutes =
    require("./adminPaymentSettingsRoutes");

const adminPaymentRoutes =
    require("./adminPaymentRoutes");

const router = express.Router();


// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.use(
    "/dashboard",
    authMiddleware,
    authorizeRoles("admin"),
    adminDashboardRoutes
);


// ============================================================
// ADMIN ANALYTICS
// ============================================================

router.use(
    "/analytics",
    authMiddleware,
    authorizeRoles("admin"),
    adminAnalyticsRoutes
);


// ============================================================
// ADMIN COUPONS
// ============================================================

router.use(
    "/coupons",
    authMiddleware,
    authorizeRoles("admin"),
    adminCouponRoutes
);


// ============================================================
// ADMIN CUSTOMERS
// ============================================================

router.use(
    "/customers",
    authMiddleware,
    authorizeRoles("admin"),
    adminCustomerRoutes
);


// ============================================================
// ADMIN INVENTORY
// ============================================================

router.use(
    "/inventory",
    authMiddleware,
    authorizeRoles("admin"),
    adminInventoryRoutes
);


// ============================================================
// ADMIN ORDERS
// ============================================================

router.use(
    "/orders",
    authMiddleware,
    authorizeRoles("admin"),
    adminOrderRoutes
);


// ============================================================
// ADMIN REVIEWS
// ============================================================

router.use(
    "/reviews",
    authMiddleware,
    authorizeRoles("admin"),
    adminReviewRoutes
);


// ============================================================
// ADMIN PAYMENT SETTINGS
// ============================================================

router.use(
    "/payment-settings",
    authMiddleware,
    authorizeRoles("admin"),
    adminPaymentSettingsRoutes
);


// ============================================================
// ADMIN PAYMENT VERIFICATION
// ============================================================

router.use(
    "/payments",
    authMiddleware,
    authorizeRoles("admin"),
    adminPaymentRoutes
);


module.exports = router;