const pool = require("../config/db");


// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {
    const connection = await pool.getConnection();

    let transactionStarted = false;

    try {
        const userId = req.user.id;

        const {
            address_id,
            payment_method = "COD",
            coupon_code
        } = req.body;

        if (!address_id) {
            return res.status(400).json({
                success: false,
                message: "Address is required."
            });
        }

        await connection.beginTransaction();
        transactionStarted = true;


        // =================================================
        // VERIFY ADDRESS
        // =================================================

        const [addresses] = await connection.query(
            `
            SELECT
                id,
                user_id,
                full_name,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country
            FROM addresses
            WHERE id = ?
              AND user_id = ?
            `,
            [address_id, userId]
        );

        if (addresses.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Selected address was not found."
            });
        }


        // =================================================
        // GET CUSTOMER CART
        // =================================================

        const [carts] = await connection.query(
            `
            SELECT
                id
            FROM cart
            WHERE user_id = ?
            `,
            [userId]
        );

        if (carts.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        const cartId = carts[0].id;


        // =================================================
        // GET CART ITEMS
        // =================================================

        const [cartItems] = await connection.query(
            `
            SELECT
                ci.product_id,
                ci.quantity,

                p.name,
                p.price,
                p.discount_price,
                p.status,
                p.sku,

                i.stock_quantity,
                i.reserved_quantity

            FROM cart_items ci

            INNER JOIN products p
                ON ci.product_id = p.id

            INNER JOIN inventory i
                ON p.id = i.product_id

            WHERE ci.cart_id = ?

            FOR UPDATE
            `,
            [cartId]
        );

        if (cartItems.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }


        // =================================================
        // VALIDATE STOCK
        // =================================================

        for (const item of cartItems) {

            const stockQuantity =
                Number(item.stock_quantity || 0);

            const reservedQuantity =
                Number(item.reserved_quantity || 0);

            const availableStock =
                stockQuantity - reservedQuantity;


            if (item.status !== "active") {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        `${item.name} is no longer available.`
                });
            }


            if (availableStock < Number(item.quantity)) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        `Only ${availableStock} unit(s) of ${item.name} are available.`
                });
            }
        }


        // =================================================
        // CALCULATE SUBTOTAL
        // =================================================

        let subtotal = 0;

        for (const item of cartItems) {

            const itemPrice =
                item.discount_price !== null &&
                item.discount_price !== undefined
                    ? Number(item.discount_price)
                    : Number(item.price);

            subtotal +=
                itemPrice *
                Number(item.quantity);
        }

        subtotal =
            Number(subtotal.toFixed(2));


        // =================================================
        // DELIVERY FEE
        // =================================================

        const deliveryFee =
            subtotal >= 1000
                ? 0
                : 50;


        // =================================================
        // COUPON VALIDATION
        // =================================================

        let discount = 0;
        let appliedCoupon = null;

        if (
            coupon_code &&
            String(coupon_code).trim() !== ""
        ) {

            const normalizedCode =
                String(coupon_code)
                    .trim()
                    .toUpperCase();


            // ---------------------------------------------
            // LOCK COUPON
            // ---------------------------------------------

            const [coupons] =
                await connection.query(
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

                    FOR UPDATE
                    `,
                    [normalizedCode]
                );


            if (coupons.length === 0) {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: "Invalid coupon code."
                });
            }


            const coupon =
                coupons[0];


            // ---------------------------------------------
            // CHECK STATUS
            // ---------------------------------------------

            if (coupon.status !== "active") {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: "This coupon is inactive."
                });
            }


            // ---------------------------------------------
            // CHECK EXPIRY
            // ---------------------------------------------

            if (
                coupon.expires_at &&
                new Date(coupon.expires_at) < new Date()
            ) {

                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message: "This coupon has expired."
                });
            }


            // ---------------------------------------------
            // CHECK USAGE LIMIT
            // ---------------------------------------------

            if (
                coupon.usage_limit !== null &&
                coupon.usage_limit !== undefined &&
                Number(coupon.usage_count || 0) >=
                    Number(coupon.usage_limit)
            ) {

                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        "This coupon has reached its usage limit."
                });
            }


            // ---------------------------------------------
            // CHECK USER PREVIOUS USAGE
            // ---------------------------------------------

            const [previousUsage] =
                await connection.query(
                    `
                    SELECT
                        id

                    FROM coupon_usage

                    WHERE coupon_id = ?
                      AND user_id = ?

                    LIMIT 1
                    `,
                    [
                        coupon.id,
                        userId
                    ]
                );


            if (previousUsage.length > 0) {

                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        "You have already used this coupon."
                });
            }


            // ---------------------------------------------
            // CHECK MINIMUM ORDER
            // ---------------------------------------------

            const minimumOrder =
                Number(
                    coupon.min_order_amount || 0
                );


            if (subtotal < minimumOrder) {

                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    success: false,
                    message:
                        `Minimum order amount for this coupon is ₹${minimumOrder.toFixed(2)}.`
                });
            }


            // ---------------------------------------------
            // CALCULATE DISCOUNT
            // ---------------------------------------------

            if (
                coupon.discount_type ===
                "percentage"
            ) {

                discount =
                    subtotal *
                    Number(coupon.discount_value) /
                    100;

            } else if (
                coupon.discount_type ===
                "fixed"
            ) {

                discount =
                    Number(
                        coupon.discount_value
                    );
            }


            // ---------------------------------------------
            // MAXIMUM DISCOUNT
            // ---------------------------------------------

            if (
                coupon.max_discount !== null &&
                coupon.max_discount !== undefined &&
                Number(coupon.max_discount) > 0
            ) {

                discount =
                    Math.min(
                        discount,
                        Number(coupon.max_discount)
                    );
            }


            // ---------------------------------------------
            // DISCOUNT CANNOT EXCEED SUBTOTAL
            // ---------------------------------------------

            discount =
                Math.min(
                    discount,
                    subtotal
                );


            discount =
                Number(
                    discount.toFixed(2)
                );


            appliedCoupon =
                coupon;
        }


        // =================================================
        // FINAL TOTAL
        // =================================================

        const totalAmount =
            Number(
                (
                    subtotal -
                    discount +
                    deliveryFee
                ).toFixed(2)
            );


        // =================================================
        // CREATE ORDER
        // =================================================

        const [orderResult] =
            await connection.query(
                `
                INSERT INTO orders
                (
                    user_id,
                    address_id,
                    subtotal,
                    discount,
                    delivery_fee,
                    total_amount,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    userId,
                    address_id,
                    subtotal,
                    discount,
                    deliveryFee,
                    totalAmount,
                    "PLACED"
                ]
            );


        const orderId =
            orderResult.insertId;


        // =================================================
        // CREATE ORDER ITEMS
        // =================================================

        for (const item of cartItems) {

            const itemPrice =
                item.discount_price !== null &&
                item.discount_price !== undefined
                    ? Number(item.discount_price)
                    : Number(item.price);


            await connection.query(
                `
                INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    quantity,
                    price
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    orderId,
                    item.product_id,
                    item.quantity,
                    itemPrice
                ]
            );


            // =================================================
            // RESERVE INVENTORY
            // =================================================

            const [reservationResult] =
                await connection.query(
                    `
                    UPDATE inventory

                    SET reserved_quantity =
                        reserved_quantity + ?

                    WHERE product_id = ?

                    AND (
                        stock_quantity -
                        reserved_quantity
                    ) >= ?
                    `,
                    [
                        item.quantity,
                        item.product_id,
                        item.quantity
                    ]
                );


            /*
                If no row was updated, another
                order may have consumed the stock.
            */

            if (
                reservationResult.affectedRows === 0
            ) {

                await connection.rollback();
                transactionStarted = false;

                return res.status(409).json({
                    success: false,
                    message:
                        `Stock for ${item.name} is no longer available. Please refresh your cart and try again.`
                });
            }
        }


        // =================================================
        // CREATE PAYMENT
        // =================================================

        await connection.query(
            `
            INSERT INTO payments
            (
                order_id,
                payment_method,
                transaction_id,
                amount,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                orderId,
                payment_method,
                null,
                totalAmount,
                "PENDING"
            ]
        );


        // =================================================
        // RECORD COUPON USAGE
        // =================================================

        if (appliedCoupon) {

            await connection.query(
                `
                INSERT INTO coupon_usage
                (
                    coupon_id,
                    user_id,
                    order_id
                )
                VALUES (?, ?, ?)
                `,
                [
                    appliedCoupon.id,
                    userId,
                    orderId
                ]
            );


            await connection.query(
                `
                UPDATE coupons

                SET usage_count =
                    usage_count + 1

                WHERE id = ?
                `,
                [
                    appliedCoupon.id
                ]
            );
        }


        // =================================================
        // CLEAR CART
        // =================================================

        await connection.query(
            `
            DELETE FROM cart_items

            WHERE cart_id = ?
            `,
            [cartId]
        );


        // =================================================
        // CREATE NOTIFICATION
        // =================================================

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                is_read
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                userId,
                "Order Placed",
                `Your order #${orderId} has been placed successfully.`,
                0
            ]
        );


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();
        transactionStarted = false;


        return res.status(201).json({
            success: true,
            message: "Order placed successfully.",

            order_id: orderId,

            subtotal,

            discount,

            delivery_fee: deliveryFee,

            total_amount: totalAmount,

            coupon_code:
                appliedCoupon
                    ? appliedCoupon.code
                    : null
        });


    } catch (error) {

        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Create order rollback error:",
                    rollbackError
                );
            }
        }


        console.error(
            "Create order error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to create order.",
            error: error.message
        });

    } finally {

        connection.release();
    }
};


// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (req, res) => {
    try {

        const userId =
            req.user.id;


        const [orders] =
            await pool.query(
                `
                SELECT
                    o.id,
                    o.subtotal,
                    o.discount,
                    o.delivery_fee,
                    o.total_amount,
                    o.status,
                    o.created_at,

                    a.full_name,
                    a.phone,
                    a.address_line1,
                    a.address_line2,
                    a.city,
                    a.state,
                    a.postal_code,
                    a.country,

                    p.payment_method,
                    p.transaction_id,
                    p.amount AS payment_amount,
                    p.status AS payment_status,
                    p.verification_status

                FROM orders o

                INNER JOIN addresses a
                    ON o.address_id = a.id

                LEFT JOIN payments p
                    ON o.id = p.order_id

                WHERE o.user_id = ?

                ORDER BY o.created_at DESC
                `,
                [userId]
            );


        for (const order of orders) {

            const [items] =
                await pool.query(
                    `
                    SELECT
                        oi.id,
                        oi.product_id,
                        oi.quantity,
                        oi.price,

                        pr.name,
                        pr.sku,

                        (
                            SELECT
                                pi.image_url

                            FROM product_images pi

                            WHERE pi.product_id = pr.id

                            ORDER BY
                                pi.is_primary DESC,
                                pi.id ASC

                            LIMIT 1

                        ) AS image_url

                    FROM order_items oi

                    INNER JOIN products pr
                        ON oi.product_id = pr.id

                    WHERE oi.order_id = ?
                    `,
                    [order.id]
                );


            order.items =
                items;
        }


        return res.status(200).json({
            success: true,
            orders
        });


    } catch (error) {

        console.error(
            "Get my orders error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch orders.",
            error: error.message
        });
    }
};


// =====================================================
// GET ORDER BY ID
// =====================================================

const getOrderById = async (req, res) => {
    try {

        const userId =
            req.user.id;

        const orderId =
            Number(req.params.id);


        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order ID."
            });
        }


        const [orders] =
            await pool.query(
                `
                SELECT
                    o.id,
                    o.user_id,
                    o.subtotal,
                    o.discount,
                    o.delivery_fee,
                    o.total_amount,
                    o.status,
                    o.created_at,

                    a.id AS address_id,
                    a.full_name,
                    a.phone,
                    a.address_line1,
                    a.address_line2,
                    a.city,
                    a.state,
                    a.postal_code,
                    a.country,

                    p.payment_method,
                    p.transaction_id,
                    p.amount AS payment_amount,
                    p.status AS payment_status,
                    p.verification_status

                FROM orders o

                INNER JOIN addresses a
                    ON o.address_id = a.id

                LEFT JOIN payments p
                    ON o.id = p.order_id

                WHERE o.id = ?
                  AND o.user_id = ?
                `,
                [
                    orderId,
                    userId
                ]
            );


        if (orders.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });
        }


        const order =
            orders[0];


        const [items] =
            await pool.query(
                `
                SELECT
                    oi.id,
                    oi.product_id,
                    oi.quantity,
                    oi.price,

                    pr.name,
                    pr.description,
                    pr.brand,
                    pr.sku,

                    (
                        SELECT
                            pi.image_url

                        FROM product_images pi

                        WHERE pi.product_id = pr.id

                        ORDER BY
                            pi.is_primary DESC,
                            pi.id ASC

                        LIMIT 1

                    ) AS image_url

                FROM order_items oi

                INNER JOIN products pr
                    ON oi.product_id = pr.id

                WHERE oi.order_id = ?
                `,
                [orderId]
            );


        order.items =
            items;


        return res.status(200).json({
            success: true,
            order
        });


    } catch (error) {

        console.error(
            "Get order by ID error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch order.",
            error: error.message
        });
    }
};


// =====================================================
// CANCEL ORDER
// =====================================================

const cancelOrder = async (req, res) => {

    const connection =
        await pool.getConnection();

    let transactionStarted = false;


    try {

        const userId =
            req.user.id;

        const orderId =
            Number(req.params.id);


        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order ID."
            });
        }


        await connection.beginTransaction();
        transactionStarted = true;


        // =================================================
        // LOCK ORDER
        // =================================================

        const [orders] =
            await connection.query(
                `
                SELECT
                    id,
                    user_id,
                    status

                FROM orders

                WHERE id = ?
                  AND user_id = ?

                FOR UPDATE
                `,
                [
                    orderId,
                    userId
                ]
            );


        if (orders.length === 0) {

            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });
        }


        const order =
            orders[0];


        // =================================================
        // CANCELLABLE STATUSES
        // =================================================

        const cancellableStatuses = [
            "PLACED",
            "CONFIRMED",
            "PACKED"
        ];


        if (
            !cancellableStatuses.includes(
                order.status
            )
        ) {

            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    "This order cannot be cancelled at its current status."
            });
        }


        // =================================================
        // GET ORDER ITEMS
        // =================================================

        const [items] =
            await connection.query(
                `
                SELECT
                    product_id,
                    quantity

                FROM order_items

                WHERE order_id = ?
                `,
                [orderId]
            );


        // =================================================
        // RELEASE RESERVED INVENTORY
        // =================================================

        for (const item of items) {

            const [inventoryResult] =
                await connection.query(
                    `
                    UPDATE inventory

                    SET reserved_quantity =
                        GREATEST(
                            reserved_quantity - ?,
                            0
                        )

                    WHERE product_id = ?
                    `,
                    [
                        item.quantity,
                        item.product_id
                    ]
                );


            if (
                inventoryResult.affectedRows === 0
            ) {

                await connection.rollback();
                transactionStarted = false;

                return res.status(500).json({
                    success: false,
                    message:
                        `Inventory record not found for product ${item.product_id}.`
                });
            }
        }


        // =================================================
        // UPDATE ORDER STATUS
        // =================================================

        await connection.query(
            `
            UPDATE orders

            SET status = 'CANCELLED'

            WHERE id = ?
            `,
            [orderId]
        );


        // =================================================
        // UPDATE PAYMENT IF REQUIRED
        // =================================================

        const [payments] =
            await connection.query(
                `
                SELECT
                    id,
                    status

                FROM payments

                WHERE order_id = ?
                `,
                [orderId]
            );


        if (
            payments.length > 0 &&
            payments[0].status === "SUCCESS"
        ) {

            await connection.query(
                `
                UPDATE payments

                SET status = 'REFUNDED'

                WHERE order_id = ?
                `,
                [orderId]
            );
        }


        // =================================================
        // CREATE NOTIFICATION
        // =================================================

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                is_read
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                userId,
                "Order Cancelled",
                `Your order #${orderId} has been cancelled.`,
                0
            ]
        );


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();
        transactionStarted = false;


        return res.status(200).json({
            success: true,
            message:
                "Order cancelled successfully."
        });


    } catch (error) {

        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Cancel order rollback error:",
                    rollbackError
                );
            }
        }


        console.error(
            "Cancel order error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to cancel order.",
            error: error.message
        });


    } finally {

        connection.release();
    }
};


// =====================================================
// REQUEST RETURN
// =====================================================

const requestReturn = async (req, res) => {

    const connection =
        await pool.getConnection();

    let transactionStarted = false;


    try {

        const userId =
            req.user.id;

        const orderId =
            Number(req.params.id);


        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order ID."
            });
        }


        await connection.beginTransaction();
        transactionStarted = true;


        // =================================================
        // LOCK ORDER
        // =================================================

        const [orders] =
            await connection.query(
                `
                SELECT
                    id,
                    status

                FROM orders

                WHERE id = ?
                  AND user_id = ?

                FOR UPDATE
                `,
                [
                    orderId,
                    userId
                ]
            );


        if (orders.length === 0) {

            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });
        }


        // =================================================
        // ONLY DELIVERED ORDERS CAN BE RETURNED
        // =================================================

        if (
            orders[0].status !==
            "DELIVERED"
        ) {

            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message:
                    "Return can only be requested for delivered orders."
            });
        }


        // =================================================
        // UPDATE ORDER
        // =================================================

        await connection.query(
            `
            UPDATE orders

            SET status = 'RETURN_REQUESTED'

            WHERE id = ?
              AND user_id = ?
            `,
            [
                orderId,
                userId
            ]
        );


        // =================================================
        // CREATE NOTIFICATION
        // =================================================

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                is_read
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                userId,
                "Return Requested",
                `Your return request for order #${orderId} has been submitted.`,
                0
            ]
        );


        // =================================================
        // COMMIT
        // =================================================

        await connection.commit();
        transactionStarted = false;


        return res.status(200).json({
            success: true,
            message:
                "Return request submitted successfully."
        });


    } catch (error) {

        if (transactionStarted) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    "Return rollback error:",
                    rollbackError
                );
            }
        }


        console.error(
            "Request return error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Unable to request return.",
            error: error.message
        });


    } finally {

        connection.release();
    }
};


module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    requestReturn
};