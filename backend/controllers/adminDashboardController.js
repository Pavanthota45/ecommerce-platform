const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
    try {
        // --------------------------------------------------
        // 1. TOTAL CUSTOMERS
        // --------------------------------------------------

        const [customerResult] = await pool.query(
            `SELECT COUNT(*) AS total_customers
             FROM users
             WHERE role = 'customer'`
        );

        const totalCustomers = Number(
            customerResult[0].total_customers
        );


        // --------------------------------------------------
        // 2. TOTAL CATEGORIES
        // --------------------------------------------------

        const [categoryResult] = await pool.query(
            `SELECT COUNT(*) AS total_categories
             FROM categories`
        );

        const totalCategories = Number(
            categoryResult[0].total_categories
        );


        // --------------------------------------------------
        // 3. TOTAL PRODUCTS
        // --------------------------------------------------

        const [productResult] = await pool.query(
            `SELECT COUNT(*) AS total_products
             FROM products`
        );

        const totalProducts = Number(
            productResult[0].total_products
        );


        // --------------------------------------------------
        // 4. TOTAL ORDERS
        // --------------------------------------------------

        const [orderResult] = await pool.query(
            `SELECT COUNT(*) AS total_orders
             FROM orders`
        );

        const totalOrders = Number(
            orderResult[0].total_orders
        );


        // --------------------------------------------------
        // 5. TOTAL ORDER VALUE
        // Excludes cancelled/refunded orders
        // --------------------------------------------------

        const [revenueResult] = await pool.query(
            `SELECT
                COALESCE(SUM(total_amount), 0) AS total_order_value
             FROM orders
             WHERE status NOT IN ('CANCELLED', 'REFUNDED')`
        );

        const totalOrderValue = Number(
            revenueResult[0].total_order_value
        );


        // --------------------------------------------------
        // 6. TODAY'S ORDERS
        // --------------------------------------------------

        const [todayOrderResult] = await pool.query(
            `SELECT COUNT(*) AS today_orders
             FROM orders
             WHERE DATE(created_at) = CURDATE()`
        );

        const todayOrders = Number(
            todayOrderResult[0].today_orders
        );


        // --------------------------------------------------
        // 7. TODAY'S ORDER VALUE
        // --------------------------------------------------

        const [todayValueResult] = await pool.query(
            `SELECT
                COALESCE(SUM(total_amount), 0) AS today_order_value
             FROM orders
             WHERE DATE(created_at) = CURDATE()
             AND status NOT IN ('CANCELLED', 'REFUNDED')`
        );

        const todayOrderValue = Number(
            todayValueResult[0].today_order_value
        );


        // --------------------------------------------------
        // 8. PENDING ORDERS
        // --------------------------------------------------

        const [pendingResult] = await pool.query(
            `SELECT COUNT(*) AS pending_orders
             FROM orders
             WHERE status IN (
                 'PLACED',
                 'CONFIRMED',
                 'PACKED',
                 'SHIPPED',
                 'OUT_FOR_DELIVERY'
             )`
        );

        const pendingOrders = Number(
            pendingResult[0].pending_orders
        );


        // --------------------------------------------------
        // 9. DELIVERED ORDERS
        // --------------------------------------------------

        const [deliveredResult] = await pool.query(
            `SELECT COUNT(*) AS delivered_orders
             FROM orders
             WHERE status = 'DELIVERED'`
        );

        const deliveredOrders = Number(
            deliveredResult[0].delivered_orders
        );


        // --------------------------------------------------
        // 10. CANCELLED ORDERS
        // --------------------------------------------------

        const [cancelledResult] = await pool.query(
            `SELECT COUNT(*) AS cancelled_orders
             FROM orders
             WHERE status = 'CANCELLED'`
        );

        const cancelledOrders = Number(
            cancelledResult[0].cancelled_orders
        );


        // --------------------------------------------------
        // 11. LOW STOCK PRODUCTS
        // Available stock <= 5 and greater than 0
        // --------------------------------------------------

        const [lowStockResult] = await pool.query(
            `SELECT COUNT(*) AS low_stock_products
             FROM inventory
             WHERE (stock_quantity - reserved_quantity) > 0
             AND (stock_quantity - reserved_quantity) <= 5`
        );

        const lowStockProducts = Number(
            lowStockResult[0].low_stock_products
        );


        // --------------------------------------------------
        // 12. OUT OF STOCK PRODUCTS
        // --------------------------------------------------

        const [outOfStockResult] = await pool.query(
            `SELECT COUNT(*) AS out_of_stock_products
             FROM inventory
             WHERE (stock_quantity - reserved_quantity) <= 0`
        );

        const outOfStockProducts = Number(
            outOfStockResult[0].out_of_stock_products
        );


        // --------------------------------------------------
        // 13. RECENT ORDERS
        // --------------------------------------------------

        const [recentOrders] = await pool.query(
            `SELECT
                o.id,
                o.user_id,
                o.subtotal,
                o.discount,
                o.delivery_fee,
                o.total_amount,
                o.status,
                o.created_at,
                u.name AS customer_name,
                u.email AS customer_email
             FROM orders o
             INNER JOIN users u
                 ON o.user_id = u.id
             ORDER BY o.created_at DESC
             LIMIT 10`
        );


        // --------------------------------------------------
        // 14. ORDER STATUS SUMMARY
        // --------------------------------------------------

        const [statusSummary] = await pool.query(
            `SELECT
                status,
                COUNT(*) AS count
             FROM orders
             GROUP BY status
             ORDER BY count DESC`
        );


        // --------------------------------------------------
        // FINAL RESPONSE
        // --------------------------------------------------

        return res.status(200).json({
            success: true,

            statistics: {
                total_customers: totalCustomers,
                total_categories: totalCategories,
                total_products: totalProducts,
                total_orders: totalOrders,
                total_order_value: totalOrderValue,
                today_orders: todayOrders,
                today_order_value: todayOrderValue,
                pending_orders: pendingOrders,
                delivered_orders: deliveredOrders,
                cancelled_orders: cancelledOrders,
                low_stock_products: lowStockProducts,
                out_of_stock_products: outOfStockProducts
            },

            recent_orders: recentOrders,

            order_status_summary: statusSummary
        });

    } catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard statistics."
        });
    }
};


module.exports = {
    getDashboardStats
};