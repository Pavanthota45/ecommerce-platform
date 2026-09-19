const pool = require("../config/db");

// ======================================================
// GET ADMIN ANALYTICS
// ======================================================

const getAdminAnalytics = async (req, res) => {
    try {

        // ==================================================
        // SUMMARY
        // ==================================================

        const [summaryResult] = await pool.query(`
            SELECT

                (
                    SELECT COUNT(*)
                    FROM orders
                ) AS total_orders,

                (
                    SELECT COALESCE(
                        SUM(total_amount),
                        0
                    )
                    FROM orders
                    WHERE status NOT IN (
                        'CANCELLED',
                        'REFUNDED'
                    )
                ) AS total_sales,

                (
                    SELECT COUNT(*)
                    FROM users
                    WHERE role = 'customer'
                ) AS total_customers,

                (
                    SELECT COUNT(*)
                    FROM products
                ) AS total_products,

                (
                    SELECT COUNT(*)
                    FROM orders
                    WHERE DATE(created_at) = CURDATE()
                ) AS orders_today,

                (
                    SELECT COALESCE(
                        SUM(total_amount),
                        0
                    )
                    FROM orders
                    WHERE DATE(created_at) = CURDATE()
                    AND status NOT IN (
                        'CANCELLED',
                        'REFUNDED'
                    )
                ) AS sales_today,

                (
                    SELECT COUNT(*)
                    FROM orders
                    WHERE YEAR(created_at) = YEAR(CURDATE())
                    AND MONTH(created_at) = MONTH(CURDATE())
                ) AS orders_this_month,

                (
                    SELECT COALESCE(
                        SUM(total_amount),
                        0
                    )
                    FROM orders
                    WHERE YEAR(created_at) = YEAR(CURDATE())
                    AND MONTH(created_at) = MONTH(CURDATE())
                    AND status NOT IN (
                        'CANCELLED',
                        'REFUNDED'
                    )
                ) AS sales_this_month
        `);

        // ==================================================
        // ORDERS BY STATUS
        // ==================================================

        const [ordersByStatus] = await pool.query(`
            SELECT
                status,
                COUNT(*) AS count

            FROM orders

            GROUP BY status

            ORDER BY count DESC
        `);

        // ==================================================
        // DAILY SALES
        // LAST 7 DAYS
        // ==================================================

        const [dailySales] = await pool.query(`
            SELECT

                DATE(created_at) AS date,

                COUNT(*) AS orders,

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
                ) AS sales

            FROM orders

            WHERE created_at >= DATE_SUB(
                CURDATE(),
                INTERVAL 6 DAY
            )

            GROUP BY
                DATE(created_at)

            ORDER BY
                date ASC
        `);

        // ==================================================
        // MONTHLY SALES
        // LAST 12 MONTHS
        // ==================================================

        const [monthlySales] = await pool.query(`
            SELECT

                DATE_FORMAT(
                    created_at,
                    '%Y-%m'
                ) AS month,

                COUNT(*) AS orders,

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
                ) AS sales

            FROM orders

            WHERE created_at >= DATE_SUB(
                CURDATE(),
                INTERVAL 11 MONTH
            )

            GROUP BY
                DATE_FORMAT(
                    created_at,
                    '%Y-%m'
                )

            ORDER BY
                month ASC
        `);

        // ==================================================
        // TOP PRODUCTS
        // ==================================================

        const [topProducts] = await pool.query(`
            SELECT

                oi.product_id,

                p.name,

                p.brand,

                p.sku,

                SUM(
                    oi.quantity
                ) AS quantity_sold,

                COALESCE(
                    SUM(
                        oi.quantity * oi.price
                    ),
                    0
                ) AS revenue

            FROM order_items oi

            INNER JOIN orders o
                ON oi.order_id = o.id

            LEFT JOIN products p
                ON oi.product_id = p.id

            WHERE o.status NOT IN (
                'CANCELLED',
                'REFUNDED'
            )

            GROUP BY
                oi.product_id,
                p.name,
                p.brand,
                p.sku

            ORDER BY
                quantity_sold DESC

            LIMIT 10
        `);

        // ==================================================
        // TOP CATEGORIES
        // ==================================================

        const [topCategories] = await pool.query(`
            SELECT

                c.id AS category_id,

                c.name AS category_name,

                SUM(
                    oi.quantity
                ) AS quantity_sold,

                COALESCE(
                    SUM(
                        oi.quantity * oi.price
                    ),
                    0
                ) AS revenue

            FROM order_items oi

            INNER JOIN orders o
                ON oi.order_id = o.id

            INNER JOIN products p
                ON oi.product_id = p.id

            LEFT JOIN categories c
                ON p.category_id = c.id

            WHERE o.status NOT IN (
                'CANCELLED',
                'REFUNDED'
            )

            GROUP BY
                c.id,
                c.name

            ORDER BY
                quantity_sold DESC

            LIMIT 10
        `);

        // ==================================================
        // LOW STOCK
        //
        // IMPORTANT:
        // inventory uses stock_quantity,
        // NOT quantity.
        // ==================================================

        const [lowStock] = await pool.query(`
            SELECT

                i.product_id,

                p.name,

                p.brand,

                p.sku,

                i.stock_quantity,

                i.reserved_quantity,

                GREATEST(
                    i.stock_quantity -
                    i.reserved_quantity,
                    0
                ) AS available_quantity

            FROM inventory i

            LEFT JOIN products p
                ON i.product_id = p.id

            WHERE GREATEST(
                i.stock_quantity -
                i.reserved_quantity,
                0
            ) <= 5

            ORDER BY
                available_quantity ASC
        `);

        // ==================================================
        // RECENT ORDERS
        // ==================================================

        const [recentOrders] = await pool.query(`
            SELECT

                o.id,

                o.user_id,

                u.name AS customer_name,

                u.email AS customer_email,

                o.total_amount,

                o.status,

                o.created_at

            FROM orders o

            LEFT JOIN users u
                ON o.user_id = u.id

            ORDER BY
                o.created_at DESC

            LIMIT 10
        `);

        // ==================================================
        // RESPONSE
        // ==================================================

        return res.status(200).json({

            success: true,

            // ==================================================
            // SUMMARY
            // ==================================================

            summary: {

                total_orders:
                    Number(
                        summaryResult[0]
                            ?.total_orders || 0
                    ),

                total_sales:
                    Number(
                        summaryResult[0]
                            ?.total_sales || 0
                    ),

                total_customers:
                    Number(
                        summaryResult[0]
                            ?.total_customers || 0
                    ),

                total_products:
                    Number(
                        summaryResult[0]
                            ?.total_products || 0
                    ),

                orders_today:
                    Number(
                        summaryResult[0]
                            ?.orders_today || 0
                    ),

                sales_today:
                    Number(
                        summaryResult[0]
                            ?.sales_today || 0
                    ),

                orders_this_month:
                    Number(
                        summaryResult[0]
                            ?.orders_this_month || 0
                    ),

                sales_this_month:
                    Number(
                        summaryResult[0]
                            ?.sales_this_month || 0
                    )
            },

            // ==================================================
            // ORDERS BY STATUS
            // ==================================================

            orders_by_status:
                ordersByStatus.map(
                    (item) => ({

                        status:
                            item.status,

                        count:
                            Number(
                                item.count
                            )
                    })
                ),

            // ==================================================
            // DAILY SALES
            // ==================================================

            daily_sales:
                dailySales.map(
                    (item) => ({

                        date:
                            item.date,

                        orders:
                            Number(
                                item.orders
                            ),

                        sales:
                            Number(
                                item.sales
                            )
                    })
                ),

            // ==================================================
            // MONTHLY SALES
            // ==================================================

            monthly_sales:
                monthlySales.map(
                    (item) => ({

                        month:
                            item.month,

                        orders:
                            Number(
                                item.orders
                            ),

                        sales:
                            Number(
                                item.sales
                            )
                    })
                ),

            // ==================================================
            // TOP PRODUCTS
            // ==================================================

            top_products:
                topProducts.map(
                    (item) => ({

                        product_id:
                            item.product_id,

                        name:
                            item.name,

                        brand:
                            item.brand,

                        sku:
                            item.sku,

                        quantity_sold:
                            Number(
                                item.quantity_sold
                            ),

                        revenue:
                            Number(
                                item.revenue
                            )
                    })
                ),

            // ==================================================
            // TOP CATEGORIES
            // ==================================================

            top_categories:
                topCategories.map(
                    (item) => ({

                        category_id:
                            item.category_id,

                        category_name:
                            item.category_name,

                        quantity_sold:
                            Number(
                                item.quantity_sold
                            ),

                        revenue:
                            Number(
                                item.revenue
                            )
                    })
                ),

            // ==================================================
            // LOW STOCK
            // ==================================================

            low_stock:
                lowStock.map(
                    (item) => ({

                        product_id:
                            item.product_id,

                        name:
                            item.name,

                        brand:
                            item.brand,

                        sku:
                            item.sku,

                        stock_quantity:
                            Number(
                                item.stock_quantity || 0
                            ),

                        reserved_quantity:
                            Number(
                                item.reserved_quantity || 0
                            ),

                        available_quantity:
                            Number(
                                item.available_quantity || 0
                            )
                    })
                ),

            // ==================================================
            // RECENT ORDERS
            // ==================================================

            recent_orders:
                recentOrders.map(
                    (item) => ({

                        id:
                            item.id,

                        user_id:
                            item.user_id,

                        customer_name:
                            item.customer_name,

                        customer_email:
                            item.customer_email,

                        total_amount:
                            Number(
                                item.total_amount
                            ),

                        status:
                            item.status,

                        created_at:
                            item.created_at
                    })
                )
        });

    } catch (error) {

        console.error(
            "Get admin analytics error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch admin analytics.",

            error:
                error.message
        });
    }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getAdminAnalytics
};