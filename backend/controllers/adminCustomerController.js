const pool = require("../config/db");

/*
    GET ALL CUSTOMERS

    Returns:
    - customer information
    - number of orders
    - total amount spent
*/
const getAllCustomers = async (req, res) => {
    try {
        const [customers] = await pool.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at,

                COUNT(DISTINCT o.id) AS order_count,

                COALESCE(
                    SUM(
                        CASE
                            WHEN o.status NOT IN ('CANCELLED')
                            THEN o.total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_spent

            FROM users u

            LEFT JOIN orders o
                ON u.id = o.user_id

            WHERE u.role = 'customer'

            GROUP BY
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at

            ORDER BY u.created_at DESC
            `
        );

        return res.status(200).json({
            success: true,
            customers
        });

    } catch (error) {
        console.error(
            "Get all customers error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customers."
        });
    }
};


/*
    GET CUSTOMER BY ID

    Returns:
    - customer information
    - order count
    - total spent
*/
const getCustomerById = async (req, res) => {
    try {
        const customerId = Number(req.params.id);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });
        }

        const [customers] = await pool.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at,

                COUNT(DISTINCT o.id) AS order_count,

                COALESCE(
                    SUM(
                        CASE
                            WHEN o.status NOT IN ('CANCELLED')
                            THEN o.total_amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_spent

            FROM users u

            LEFT JOIN orders o
                ON u.id = o.user_id

            WHERE
                u.id = ?
                AND u.role = 'customer'

            GROUP BY
                u.id,
                u.name,
                u.email,
                u.phone,
                u.created_at
            `,
            [customerId]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        return res.status(200).json({
            success: true,
            customer: customers[0]
        });

    } catch (error) {
        console.error(
            "Get customer error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer."
        });
    }
};


/*
    GET CUSTOMER ORDERS

    Returns all orders belonging to
    one customer.
*/
const getCustomerOrders = async (req, res) => {
    try {
        const customerId = Number(req.params.id);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });
        }

        const [customer] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                phone
            FROM users
            WHERE
                id = ?
                AND role = 'customer'
            `,
            [customerId]
        );

        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        const [orders] = await pool.query(
            `
            SELECT
                o.id,
                o.subtotal,
                o.discount,
                o.delivery_fee,
                o.total_amount,
                o.status,
                o.created_at,

                a.full_name AS delivery_name,
                a.phone AS delivery_phone,
                a.address_line1,
                a.address_line2,
                a.city,
                a.state,
                a.postal_code,
                a.country,

                p.status AS payment_status,
                p.payment_method,
                p.transaction_id

            FROM orders o

            LEFT JOIN addresses a
                ON o.address_id = a.id

            LEFT JOIN payments p
                ON o.id = p.order_id

            WHERE o.user_id = ?

            ORDER BY o.created_at DESC
            `,
            [customerId]
        );

        return res.status(200).json({
            success: true,
            customer: customer[0],
            orders
        });

    } catch (error) {
        console.error(
            "Get customer orders error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer orders."
        });
    }
};


/*
    GET CUSTOMER ADDRESSES

    Returns all addresses belonging
    to one customer.
*/
const getCustomerAddresses = async (req, res) => {
    try {
        const customerId = Number(req.params.id);

        if (!Number.isInteger(customerId) || customerId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID."
            });
        }

        const [customer] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                phone
            FROM users
            WHERE
                id = ?
                AND role = 'customer'
            `,
            [customerId]
        );

        if (customer.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        const [addresses] = await pool.query(
            `
            SELECT
                id,
                full_name,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                is_default,
                created_at
            FROM addresses
            WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
            `,
            [customerId]
        );

        return res.status(200).json({
            success: true,
            customer: customer[0],
            addresses
        });

    } catch (error) {
        console.error(
            "Get customer addresses error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer addresses."
        });
    }
};


module.exports = {
    getAllCustomers,
    getCustomerById,
    getCustomerOrders,
    getCustomerAddresses
};