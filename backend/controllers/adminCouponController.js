const pool = require("../config/db");


// =====================================================
// GET ALL COUPONS
// =====================================================

const getAllCoupons = async (req, res) => {
    try {
        const [coupons] = await pool.query(`
            SELECT
                id,
                code,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount,
                usage_limit,
                usage_count,
                expires_at,
                status,
                created_at
            FROM coupons
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            coupons
        });

    } catch (error) {
        console.error("Get coupons error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch coupons."
        });
    }
};


// =====================================================
// GET COUPON BY ID
// =====================================================

const getCouponById = async (req, res) => {
    try {
        const { id } = req.params;

        const [coupons] = await pool.query(
            `
            SELECT
                id,
                code,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount,
                usage_limit,
                usage_count,
                expires_at,
                status,
                created_at
            FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        if (coupons.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        res.json({
            success: true,
            coupon: coupons[0]
        });

    } catch (error) {
        console.error("Get coupon error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch coupon."
        });
    }
};


// =====================================================
// CREATE COUPON
// =====================================================

const createCoupon = async (req, res) => {
    try {
        const {
            code,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount,
            usage_limit,
            expires_at,
            status
        } = req.body;

        if (!code || !discount_type || discount_value === undefined) {
            return res.status(400).json({
                success: false,
                message:
                    "Code, discount type and discount value are required."
            });
        }

        const cleanCode = String(code)
            .trim()
            .toUpperCase();

        if (!["PERCENTAGE", "FIXED"].includes(discount_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid discount type."
            });
        }

        const discountValue = Number(discount_value);

        if (
            !Number.isFinite(discountValue) ||
            discountValue <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Discount value must be greater than 0."
            });
        }

        if (
            discount_type === "PERCENTAGE" &&
            discountValue > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Percentage discount cannot exceed 100."
            });
        }

        const minOrderAmount =
            min_order_amount === undefined ||
            min_order_amount === ""
                ? 0
                : Number(min_order_amount);

        const maxDiscount =
            max_discount === undefined ||
            max_discount === ""
                ? null
                : Number(max_discount);

        const usageLimit =
            usage_limit === undefined ||
            usage_limit === ""
                ? null
                : Number(usage_limit);

        if (
            !Number.isFinite(minOrderAmount) ||
            minOrderAmount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid minimum order amount."
            });
        }

        if (
            maxDiscount !== null &&
            (
                !Number.isFinite(maxDiscount) ||
                maxDiscount <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid maximum discount."
            });
        }

        if (
            usageLimit !== null &&
            (
                !Number.isInteger(usageLimit) ||
                usageLimit <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Usage limit must be a positive whole number."
            });
        }

        const couponStatus =
            status === "inactive"
                ? "inactive"
                : "active";

        const [existing] = await pool.query(
            `
            SELECT id
            FROM coupons
            WHERE code = ?
            `,
            [cleanCode]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Coupon code already exists."
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO coupons
            (
                code,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount,
                usage_limit,
                usage_count,
                expires_at,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
            `,
            [
                cleanCode,
                discount_type,
                discountValue,
                minOrderAmount,
                maxDiscount,
                usageLimit,
                expires_at || null,
                couponStatus
            ]
        );

        const [newCoupon] = await pool.query(
            `
            SELECT
                id,
                code,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount,
                usage_limit,
                usage_count,
                expires_at,
                status,
                created_at
            FROM coupons
            WHERE id = ?
            `,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            coupon: newCoupon[0]
        });

    } catch (error) {
        console.error("Create coupon error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create coupon."
        });
    }
};


// =====================================================
// UPDATE COUPON
// =====================================================

const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            code,
            discount_type,
            discount_value,
            min_order_amount,
            max_discount,
            usage_limit,
            expires_at,
            status
        } = req.body;

        const [existingCoupon] = await pool.query(
            "SELECT * FROM coupons WHERE id = ?",
            [id]
        );

        if (existingCoupon.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        if (
            !code ||
            !discount_type ||
            discount_value === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Code, discount type and discount value are required."
            });
        }

        const cleanCode = String(code)
            .trim()
            .toUpperCase();

        if (!["PERCENTAGE", "FIXED"].includes(discount_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid discount type."
            });
        }

        const discountValue = Number(discount_value);

        if (
            !Number.isFinite(discountValue) ||
            discountValue <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Discount value must be greater than 0."
            });
        }

        if (
            discount_type === "PERCENTAGE" &&
            discountValue > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Percentage discount cannot exceed 100."
            });
        }

        const minOrderAmount =
            min_order_amount === undefined ||
            min_order_amount === ""
                ? 0
                : Number(min_order_amount);

        const maxDiscount =
            max_discount === undefined ||
            max_discount === ""
                ? null
                : Number(max_discount);

        const usageLimit =
            usage_limit === undefined ||
            usage_limit === ""
                ? null
                : Number(usage_limit);

        if (
            !Number.isFinite(minOrderAmount) ||
            minOrderAmount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid minimum order amount."
            });
        }

        if (
            maxDiscount !== null &&
            (
                !Number.isFinite(maxDiscount) ||
                maxDiscount <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid maximum discount."
            });
        }

        if (
            usageLimit !== null &&
            (
                !Number.isInteger(usageLimit) ||
                usageLimit <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Usage limit must be a positive whole number."
            });
        }

        if (
            usageLimit !== null &&
            usageLimit < existingCoupon[0].usage_count
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Usage limit cannot be less than current usage count."
            });
        }

        const couponStatus =
            status === "inactive"
                ? "inactive"
                : "active";

        const [duplicate] = await pool.query(
            `
            SELECT id
            FROM coupons
            WHERE code = ?
            AND id != ?
            `,
            [cleanCode, id]
        );

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Another coupon already uses this code."
            });
        }

        await pool.query(
            `
            UPDATE coupons
            SET
                code = ?,
                discount_type = ?,
                discount_value = ?,
                min_order_amount = ?,
                max_discount = ?,
                usage_limit = ?,
                expires_at = ?,
                status = ?
            WHERE id = ?
            `,
            [
                cleanCode,
                discount_type,
                discountValue,
                minOrderAmount,
                maxDiscount,
                usageLimit,
                expires_at || null,
                couponStatus,
                id
            ]
        );

        const [updatedCoupon] = await pool.query(
            `
            SELECT
                id,
                code,
                discount_type,
                discount_value,
                min_order_amount,
                max_discount,
                usage_limit,
                usage_count,
                expires_at,
                status,
                created_at
            FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Coupon updated successfully.",
            coupon: updatedCoupon[0]
        });

    } catch (error) {
        console.error("Update coupon error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update coupon."
        });
    }
};


// =====================================================
// TOGGLE STATUS
// =====================================================

const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const [coupons] = await pool.query(
            `
            SELECT id, status
            FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        if (coupons.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        const newStatus =
            coupons[0].status === "active"
                ? "inactive"
                : "active";

        await pool.query(
            `
            UPDATE coupons
            SET status = ?
            WHERE id = ?
            `,
            [newStatus, id]
        );

        res.json({
            success: true,
            message:
                newStatus === "active"
                    ? "Coupon activated successfully."
                    : "Coupon deactivated successfully.",
            status: newStatus
        });

    } catch (error) {
        console.error(
            "Toggle coupon status error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to change coupon status."
        });
    }
};


// =====================================================
// DELETE COUPON
// =====================================================

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const [coupons] = await pool.query(
            `
            SELECT id
            FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        if (coupons.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        const [usage] = await pool.query(
            `
            SELECT COUNT(*) AS count
            FROM coupon_usage
            WHERE coupon_id = ?
            `,
            [id]
        );

        if (usage[0].count > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This coupon has already been used and cannot be deleted. Deactivate it instead."
            });
        }

        await pool.query(
            `
            DELETE FROM coupons
            WHERE id = ?
            `,
            [id]
        );

        res.json({
            success: true,
            message: "Coupon deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete coupon error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete coupon."
        });
    }
};


module.exports = {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon
};