const pool = require("../config/db");


// ==========================================
// GET ALL COUPONS - ADMIN
// ==========================================

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

        return res.status(200).json({
            success: true,
            coupons
        });

    } catch (error) {
        console.error("Get all coupons error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch coupons."
        });
    }
};


// ==========================================
// GET SINGLE COUPON
// ==========================================

const getCouponById = async (req, res) => {
    try {
        const couponId = Number(req.params.id);

        if (!Number.isInteger(couponId) || couponId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid coupon ID."
            });
        }

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
            [couponId]
        );

        if (coupons.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        return res.status(200).json({
            success: true,
            coupon: coupons[0]
        });

    } catch (error) {
        console.error("Get coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch coupon."
        });
    }
};


// ==========================================
// CREATE COUPON - ADMIN
// ==========================================

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

        if (!code || !String(code).trim()) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required."
            });
        }

        const cleanCode = String(code)
            .trim()
            .toUpperCase();

        if (
            discount_type !== "percentage" &&
            discount_type !== "fixed"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Discount type must be percentage or fixed."
            });
        }

        const discountValue = Number(discount_value);

        if (
            !Number.isFinite(discountValue) ||
            discountValue <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Discount value must be greater than 0."
            });
        }

        if (
            discount_type === "percentage" &&
            discountValue > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Percentage discount cannot be greater than 100."
            });
        }

        const minOrderAmount =
            min_order_amount === undefined ||
            min_order_amount === null ||
            min_order_amount === ""
                ? 0
                : Number(min_order_amount);

        if (
            !Number.isFinite(minOrderAmount) ||
            minOrderAmount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum order amount cannot be negative."
            });
        }

        let maxDiscount = null;

        if (
            max_discount !== undefined &&
            max_discount !== null &&
            max_discount !== ""
        ) {
            maxDiscount = Number(max_discount);

            if (
                !Number.isFinite(maxDiscount) ||
                maxDiscount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum discount must be greater than 0."
                });
            }
        }

        let usageLimit = null;

        if (
            usage_limit !== undefined &&
            usage_limit !== null &&
            usage_limit !== ""
        ) {
            usageLimit = Number(usage_limit);

            if (
                !Number.isInteger(usageLimit) ||
                usageLimit <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Usage limit must be a positive whole number."
                });
            }
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
                message: "Coupon code already exists."
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


        return res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            couponId: result.insertId
        });

    } catch (error) {
        console.error("Create coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create coupon."
        });
    }
};


// ==========================================
// UPDATE COUPON - ADMIN
// ==========================================

const updateCoupon = async (req, res) => {
    try {
        const couponId = Number(req.params.id);

        if (!Number.isInteger(couponId) || couponId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid coupon ID."
            });
        }

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
            `
            SELECT id
            FROM coupons
            WHERE id = ?
            `,
            [couponId]
        );

        if (existingCoupon.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }


        if (!code || !String(code).trim()) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required."
            });
        }


        const cleanCode = String(code)
            .trim()
            .toUpperCase();


        if (
            discount_type !== "percentage" &&
            discount_type !== "fixed"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Discount type must be percentage or fixed."
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
            discount_type === "percentage" &&
            discountValue > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Percentage discount cannot be greater than 100."
            });
        }


        const minOrderAmount =
            min_order_amount === undefined ||
            min_order_amount === null ||
            min_order_amount === ""
                ? 0
                : Number(min_order_amount);


        if (
            !Number.isFinite(minOrderAmount) ||
            minOrderAmount < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum order amount cannot be negative."
            });
        }


        let maxDiscount = null;

        if (
            max_discount !== undefined &&
            max_discount !== null &&
            max_discount !== ""
        ) {
            maxDiscount = Number(max_discount);

            if (
                !Number.isFinite(maxDiscount) ||
                maxDiscount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum discount must be greater than 0."
                });
            }
        }


        let usageLimit = null;

        if (
            usage_limit !== undefined &&
            usage_limit !== null &&
            usage_limit !== ""
        ) {
            usageLimit = Number(usage_limit);

            if (
                !Number.isInteger(usageLimit) ||
                usageLimit <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Usage limit must be a positive whole number."
                });
            }
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
            [cleanCode, couponId]
        );

        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Coupon code already exists."
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
                couponId
            ]
        );


        return res.status(200).json({
            success: true,
            message: "Coupon updated successfully."
        });

    } catch (error) {
        console.error("Update coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update coupon."
        });
    }
};


// ==========================================
// DELETE COUPON - ADMIN
// ==========================================

const deleteCoupon = async (req, res) => {
    try {
        const couponId = Number(req.params.id);

        if (!Number.isInteger(couponId) || couponId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid coupon ID."
            });
        }


        const [existingCoupon] = await pool.query(
            `
            SELECT id
            FROM coupons
            WHERE id = ?
            `,
            [couponId]
        );

        if (existingCoupon.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }


        const [usage] = await pool.query(
            `
            SELECT id
            FROM coupon_usage
            WHERE coupon_id = ?
            LIMIT 1
            `,
            [couponId]
        );


        if (usage.length > 0) {
            await pool.query(
                `
                UPDATE coupons
                SET status = 'inactive'
                WHERE id = ?
                `,
                [couponId]
            );

            return res.status(200).json({
                success: true,
                message:
                    "Coupon has usage history, so it was deactivated instead of deleted."
            });
        }


        await pool.query(
            `
            DELETE FROM coupons
            WHERE id = ?
            `,
            [couponId]
        );


        return res.status(200).json({
            success: true,
            message: "Coupon deleted successfully."
        });

    } catch (error) {
        console.error("Delete coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete coupon."
        });
    }
};


// ==========================================
// VALIDATE COUPON - CUSTOMER
// ==========================================

const validateCoupon = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            code,
            subtotal
        } = req.body;


        if (!code || !String(code).trim()) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required."
            });
        }


        const orderSubtotal = Number(subtotal);

        if (
            !Number.isFinite(orderSubtotal) ||
            orderSubtotal < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid order subtotal."
            });
        }


        const cleanCode = String(code)
            .trim()
            .toUpperCase();


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
                status
            FROM coupons
            WHERE code = ?
            `,
            [cleanCode]
        );


        if (coupons.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Invalid coupon code."
            });
        }


        const coupon = coupons[0];


        if (coupon.status !== "active") {
            return res.status(400).json({
                success: false,
                message: "This coupon is inactive."
            });
        }


        if (
            coupon.expires_at &&
            new Date(coupon.expires_at) <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "This coupon has expired."
            });
        }


        if (
            coupon.usage_limit !== null &&
            Number(coupon.usage_count) >=
                Number(coupon.usage_limit)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This coupon has reached its usage limit."
            });
        }


        if (
            orderSubtotal <
            Number(coupon.min_order_amount || 0)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Minimum order amount for this coupon is ₹${Number(
                        coupon.min_order_amount
                    ).toFixed(2)}.`
            });
        }


        const [previousUsage] = await pool.query(
            `
            SELECT id
            FROM coupon_usage
            WHERE coupon_id = ?
            AND user_id = ?
            LIMIT 1
            `,
            [coupon.id, userId]
        );


        if (previousUsage.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "You have already used this coupon."
            });
        }


        let discountAmount = 0;


        if (coupon.discount_type === "percentage") {
            discountAmount =
                orderSubtotal *
                (Number(coupon.discount_value) / 100);
        } else {
            discountAmount =
                Number(coupon.discount_value);
        }


        if (
            coupon.max_discount !== null &&
            Number(coupon.max_discount) > 0
        ) {
            discountAmount = Math.min(
                discountAmount,
                Number(coupon.max_discount)
            );
        }


        discountAmount = Math.min(
            discountAmount,
            orderSubtotal
        );


        discountAmount = Number(
            discountAmount.toFixed(2)
        );


        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully.",
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value
            },
            discount_amount: discountAmount,
            subtotal: orderSubtotal,
            payable_amount:
                Number(
                    (orderSubtotal - discountAmount).toFixed(2)
                )
        });

    } catch (error) {
        console.error("Validate coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to validate coupon."
        });
    }
};


module.exports = {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon
};