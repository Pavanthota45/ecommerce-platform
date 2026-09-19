const express = require("express");

const {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon
} = require("../controllers/adminCouponController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(authorizeRoles("admin"));

router.get("/", getAllCoupons);

router.get("/:id", getCouponById);

router.post("/", createCoupon);

router.put("/:id", updateCoupon);

router.put("/:id/toggle", toggleCouponStatus);

router.delete("/:id", deleteCoupon);

module.exports = router;