const pool = require("../config/db");

// ======================================================
// GET ALL ADMIN ORDERS
// Supports:
// page
// limit
// search
// status
// ======================================================

const getAllOrders = async (req, res) => {
    try {
        const page = Math.max(
            Number.parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                Number.parseInt(req.query.limit, 10) || 20,
                1
            ),
            100
        );

        const offset = (page - 1) * limit;

        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        const status =
            typeof req.query.status === "string"
                ? req.query.status.trim().toUpperCase()
                : "ALL";

        const whereConditions = [];
        const queryParams = [];

        if (search) {
            whereConditions.push(`
                (
                    CAST(o.id AS CHAR) LIKE ?
                    OR u.name LIKE ?
                    OR u.email LIKE ?
                    OR u.phone LIKE ?
                )
            `);

            const searchValue = `%${search}%`;

            queryParams.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }

        if (status && status !== "ALL") {
            const allowedStatuses = [
                "PLACED",
                "CONFIRMED",
                "PACKED",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
                "RETURN_REQUESTED",
                "RETURNED",
                "REFUNDED"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid order status filter."
                });
            }

            whereConditions.push("o.status = ?");
            queryParams.push(status);
        }

        const whereClause =
            whereConditions.length > 0
                ? `WHERE ${whereConditions.join(" AND ")}`
                : "";

        // ==================================================
        // TOTAL ORDER COUNT
        // ==================================================

        const [countResult] = await pool.query(
            `
            SELECT
                COUNT(*) AS total

            FROM orders o

            INNER JOIN users u
                ON o.user_id = u.id

            ${whereClause}
            `,
            queryParams
        );

        const total = Number(
            countResult[0]?.total || 0
        );

        const totalPages =
            total > 0
                ? Math.ceil(total / limit)
                : 0;

        // ==================================================
        // GET ORDERS
        // ==================================================

        const orderQueryParams = [
            ...queryParams,
            limit,
            offset
        ];

        const [orders] = await pool.query(
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
                o.updated_at,

                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,

                a.full_name AS address_full_name,
                a.phone AS address_phone,
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

            INNER JOIN users u
                ON o.user_id = u.id

            LEFT JOIN addresses a
                ON o.address_id = a.id

            LEFT JOIN payments p
                ON o.id = p.order_id

            ${whereClause}

            ORDER BY
                o.created_at DESC

            LIMIT ?
            OFFSET ?
            `,
            orderQueryParams
        );

        // ==================================================
        // GET ORDER ITEMS
        // ==================================================

        const orderIds = orders.map(
            (order) => order.id
        );

        let items = [];

        if (orderIds.length > 0) {
            const placeholders = orderIds
                .map(() => "?")
                .join(",");

            const [itemRows] = await pool.query(
                `
                SELECT
                    oi.order_id,
                    oi.product_id,
                    oi.quantity,
                    oi.price,

                    p.name,
                    p.brand,
                    p.sku

                FROM order_items oi

                LEFT JOIN products p
                    ON oi.product_id = p.id

                WHERE oi.order_id IN (
                    ${placeholders}
                )

                ORDER BY
                    oi.order_id DESC
                `,
                orderIds
            );

            items = itemRows;
        }

        // ==================================================
        // ATTACH ITEMS TO ORDERS
        // ==================================================

        const ordersWithItems = orders.map(
            (order) => {

                const orderItems = items
                    .filter(
                        (item) =>
                            Number(item.order_id) ===
                            Number(order.id)
                    )
                    .map((item) => ({
                        product_id:
                            item.product_id,

                        quantity:
                            Number(item.quantity),

                        price:
                            Number(item.price),

                        name:
                            item.name,

                        brand:
                            item.brand,

                        sku:
                            item.sku
                    }));

                return {
                    id:
                        order.id,

                    user_id:
                        order.user_id,

                    customer_name:
                        order.customer_name,

                    customer_email:
                        order.customer_email,

                    customer_phone:
                        order.customer_phone,

                    subtotal:
                        Number(order.subtotal),

                    discount:
                        Number(order.discount),

                    delivery_fee:
                        Number(order.delivery_fee),

                    total_amount:
                        Number(order.total_amount),

                    status:
                        order.status,

                    created_at:
                        order.created_at,

                    updated_at:
                        order.updated_at,

                    address: {
                        full_name:
                            order.address_full_name,

                        phone:
                            order.address_phone,

                        address_line1:
                            order.address_line1,

                        address_line2:
                            order.address_line2,

                        city:
                            order.city,

                        state:
                            order.state,

                        postal_code:
                            order.postal_code,

                        country:
                            order.country
                    },

                    payment_method:
                        order.payment_method,

                    transaction_id:
                        order.transaction_id,

                    payment_amount:
                        Number(
                            order.payment_amount || 0
                        ),

                    payment_status:
                        order.payment_status ||
                        "PENDING",

                    verification_status:
                        order.verification_status ||
                        "PENDING",

                    items:
                        orderItems
                };
            }
        );

        return res.status(200).json({
            success: true,

            orders:
                ordersWithItems,

            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (error) {

        console.error(
            "Get all admin orders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch orders.",
            error:
                error.message
        });
    }
};


// ======================================================
// GET ADMIN ORDER BY ID
// ======================================================

const getAdminOrderById = async (
    req,
    res
) => {
    try {

        const orderId =
            Number.parseInt(
                req.params.id,
                10
            );

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

        // ==================================================
        // GET ORDER
        // ==================================================

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
                    o.updated_at,

                    u.name AS customer_name,
                    u.email AS customer_email,
                    u.phone AS customer_phone,

                    a.full_name AS address_full_name,
                    a.phone AS address_phone,
                    a.address_line1,
                    a.address_line2,
                    a.city,
                    a.state,
                    a.postal_code,
                    a.country,

                    p.id AS payment_id,
                    p.payment_method,
                    p.transaction_id,
                    p.amount AS payment_amount,
                    p.status AS payment_status,
                    p.verification_status,

                    p.payment_screenshot AS screenshot

                FROM orders o

                INNER JOIN users u
                    ON o.user_id = u.id

                LEFT JOIN addresses a
                    ON o.address_id = a.id

                LEFT JOIN payments p
                    ON o.id = p.order_id

                WHERE o.id = ?

                LIMIT 1
                `,
                [orderId]
            );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });
        }

        const order = orders[0];

        // ==================================================
        // GET ITEMS
        // ==================================================

        const [items] =
            await pool.query(
                `
                SELECT
                    oi.product_id,
                    oi.quantity,
                    oi.price,

                    p.name,
                    p.description,
                    p.brand,
                    p.sku

                FROM order_items oi

                LEFT JOIN products p
                    ON oi.product_id = p.id

                WHERE oi.order_id = ?

                ORDER BY
                    oi.id ASC
                `,
                [orderId]
            );

        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({
            success: true,

            order: {

                id:
                    order.id,

                user_id:
                    order.user_id,

                customer_name:
                    order.customer_name,

                customer_email:
                    order.customer_email,

                customer_phone:
                    order.customer_phone,

                subtotal:
                    Number(
                        order.subtotal
                    ),

                discount:
                    Number(
                        order.discount
                    ),

                delivery_fee:
                    Number(
                        order.delivery_fee
                    ),

                total_amount:
                    Number(
                        order.total_amount
                    ),

                status:
                    order.status,

                created_at:
                    order.created_at,

                updated_at:
                    order.updated_at,

                // ==================================================
                // ADDRESS
                // ==================================================

                address: {

                    full_name:
                        order.address_full_name,

                    phone:
                        order.address_phone,

                    address_line1:
                        order.address_line1,

                    address_line2:
                        order.address_line2,

                    city:
                        order.city,

                    state:
                        order.state,

                    postal_code:
                        order.postal_code,

                    country:
                        order.country
                },

                // ==================================================
                // PAYMENT
                // ==================================================

                payment: {

                    id:
                        order.payment_id,

                    method:
                        order.payment_method,

                    transaction_id:
                        order.transaction_id,

                    amount:
                        Number(
                            order.payment_amount || 0
                        ),

                    status:
                        order.payment_status ||
                        "PENDING",

                    verification_status:
                        order.verification_status ||
                        "PENDING",

                    screenshot:
                        order.screenshot
                },

                // ==================================================
                // ITEMS
                // ==================================================

                items:
                    items.map(
                        (item) => ({

                            product_id:
                                item.product_id,

                            quantity:
                                Number(
                                    item.quantity
                                ),

                            price:
                                Number(
                                    item.price
                                ),

                            name:
                                item.name,

                            description:
                                item.description,

                            brand:
                                item.brand,

                            sku:
                                item.sku
                        })
                    )
            }
        });

    } catch (error) {

        console.error(
            "Get admin order by ID error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch order.",
            error:
                error.message
        });
    }
};


// ======================================================
// UPDATE ORDER STATUS
// ======================================================

const updateOrderStatus = async (
    req,
    res
) => {

    const connection =
        await pool.getConnection();

    try {

        const orderId =
            Number.parseInt(
                req.params.id,
                10
            );

        const newStatus =
            typeof req.body.status === "string"
                ? req.body.status
                    .trim()
                    .toUpperCase()
                : "";

        const allowedStatuses = [
            "PLACED",
            "CONFIRMED",
            "PACKED",
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED",
            "RETURN_REQUESTED",
            "RETURNED",
            "REFUNDED"
        ];

        // ==================================================
        // VALIDATION
        // ==================================================

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

        if (
            !allowedStatuses.includes(
                newStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid order status."
            });
        }

        await connection.beginTransaction();

        // ==================================================
        // GET ORDER + PAYMENT
        // ==================================================

        const [orders] =
            await connection.query(
                `
                SELECT
                    o.id,
                    o.user_id,
                    o.status,
                    o.total_amount,

                    p.id AS payment_id,
                    p.payment_method,
                    p.status AS payment_status

                FROM orders o

                LEFT JOIN payments p
                    ON o.id = p.order_id

                WHERE o.id = ?

                LIMIT 1
                `,
                [orderId]
            );

        if (orders.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });
        }

        const order =
            orders[0];

        const currentStatus =
            order.status;

        // ==================================================
        // PREVENT INVALID FINAL STATE CHANGES
        // ==================================================

        if (
            [
                "CANCELLED",
                "RETURNED",
                "REFUNDED"
            ].includes(
                currentStatus
            ) &&
            currentStatus !== newStatus
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    `Order is already ${currentStatus} and cannot be changed.`
            });
        }

        // ==================================================
        // UPDATE ORDER STATUS
        // ==================================================

        await connection.query(
            `
            UPDATE orders

            SET
                status = ?,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = ?
            `,
            [
                newStatus,
                orderId
            ]
        );

        // ==================================================
        // COD PAYMENT
        //
        // COD becomes SUCCESS ONLY AFTER DELIVERY.
        //
        // IMPORTANT:
        // payments.verification_status supports:
        // PENDING, APPROVED, REJECTED
        //
        // Therefore COD delivery uses APPROVED.
        // ==================================================

        if (
            newStatus === "DELIVERED" &&
            order.payment_id &&
            String(
                order.payment_method
            ).toUpperCase() === "COD"
        ) {

            await connection.query(
                `
                UPDATE payments

                SET
                    status = 'SUCCESS',
                    verification_status = 'APPROVED'

                WHERE id = ?
                `,
                [
                    order.payment_id
                ]
            );
        }

        // ==================================================
        // CANCELLED ORDER
        //
        // Release reserved inventory.
        // ==================================================

        if (
            newStatus === "CANCELLED" &&
            currentStatus !== "CANCELLED"
        ) {

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

            for (
                const item of items
            ) {

                await connection.query(
                    `
                    UPDATE inventory

                    SET
                        reserved_quantity =
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
            }

            // ==================================================
            // REFUND SUCCESSFUL PAYMENT
            // ==================================================

            if (
                order.payment_id &&
                order.payment_status ===
                    "SUCCESS"
            ) {

                await connection.query(
                    `
                    UPDATE payments

                    SET
                        status = 'REFUNDED'

                    WHERE id = ?
                    `,
                    [
                        order.payment_id
                    ]
                );
            }
        }

        // ==================================================
        // NOTIFICATION MESSAGE
        // ==================================================

        const statusMessageMap = {

            PLACED:
                "Your order has been placed.",

            CONFIRMED:
                "Your order has been confirmed.",

            PACKED:
                "Your order has been packed.",

            SHIPPED:
                "Your order has been shipped.",

            OUT_FOR_DELIVERY:
                "Your order is out for delivery.",

            DELIVERED:
                "Your order has been delivered.",

            CANCELLED:
                "Your order has been cancelled.",

            RETURN_REQUESTED:
                "Your return request has been received.",

            RETURNED:
                "Your order has been returned.",

            REFUNDED:
                "Your order payment has been refunded."
        };

        const message =
            statusMessageMap[newStatus] ||
            `Your order status is now ${newStatus}.`;

        // ==================================================
        // CREATE CUSTOMER NOTIFICATION
        // ==================================================

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                is_read
            )

            VALUES (?, ?, ?, 0)
            `,
            [
                order.user_id,
                `Order #${orderId} Update`,
                message
            ]
        );

        // ==================================================
        // COMMIT
        // ==================================================

        await connection.commit();

        return res.status(200).json({

            success: true,

            message:
                "Order status updated successfully.",

            order: {
                id:
                    orderId,

                status:
                    newStatus
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Update admin order status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update order status.",
            error:
                error.message
        });

    } finally {

        connection.release();
    }
};


// ======================================================
// GET ORDER STATISTICS
// ======================================================

const getOrderStatistics = async (
    req,
    res
) => {

    try {

        // ==================================================
        // TOTAL ORDERS + SALES
        // ==================================================

        const [overallResult] =
            await pool.query(
                `
                SELECT

                    COUNT(*) AS total_orders,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN status NOT IN (
                                    'CANCELLED',
                                    'REFUNDED'
                                )
                                THEN total_amount
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_sales

                FROM orders
                `
            );

        // ==================================================
        // STATUS COUNTS
        // ==================================================

        const [statusResult] =
            await pool.query(
                `
                SELECT
                    status,
                    COUNT(*) AS count

                FROM orders

                GROUP BY status

                ORDER BY
                    count DESC
                `
            );

        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            statistics: {

                total_orders:
                    Number(
                        overallResult[0]
                            ?.total_orders || 0
                    ),

                total_sales:
                    Number(
                        overallResult[0]
                            ?.total_sales || 0
                    ),

                status_counts:
                    statusResult.map(
                        (item) => ({

                            status:
                                item.status,

                            count:
                                Number(
                                    item.count
                                )
                        })
                    )
            }
        });

    } catch (error) {

        console.error(
            "Get order statistics error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to fetch order statistics.",
            error:
                error.message
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    getAllOrders,
    getAdminOrderById,
    updateOrderStatus,
    getOrderStatistics
};