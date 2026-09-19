const pool = require("../config/db");


// ============================================================
// GET PENDING MANUAL PAYMENTS
// ============================================================

const getPendingPayments = async (req, res) => {
    try {
        const [payments] = await pool.query(
            `
            SELECT
                p.id AS payment_id,
                p.order_id,
                p.payment_method,
                p.transaction_id,
                p.payment_screenshot,
                p.amount,
                p.status AS payment_status,
                p.verification_status,

                o.user_id,
                o.subtotal,
                o.discount,
                o.delivery_fee,
                o.total_amount AS order_total,
                o.status AS order_status,
                o.created_at AS order_created_at,

                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone

            FROM payments p

            INNER JOIN orders o
                ON p.order_id = o.id

            INNER JOIN users u
                ON o.user_id = u.id

            WHERE p.payment_method IN (
                'UPI',
                'QR',
                'BANK_TRANSFER'
            )

            AND p.verification_status = 'PENDING'

            ORDER BY
                p.id DESC
            `
        );


        return res.status(200).json({
            success: true,
            payments
        });

    } catch (error) {

        console.error(
            "Get pending payments error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load pending payments."
        });
    }
};


// ============================================================
// GET ONE PAYMENT
// ============================================================

const getPaymentById = async (req, res) => {
    try {

        const paymentId =
            Number(req.params.id);


        if (
            !Number.isInteger(paymentId) ||
            paymentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment ID."
            });
        }


        const [payments] = await pool.query(
            `
            SELECT
                p.id AS payment_id,
                p.order_id,
                p.payment_method,
                p.transaction_id,
                p.payment_screenshot,
                p.amount,
                p.status AS payment_status,
                p.verification_status,

                o.user_id,
                o.subtotal,
                o.discount,
                o.delivery_fee,
                o.total_amount AS order_total,
                o.status AS order_status,
                o.created_at AS order_created_at,

                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone

            FROM payments p

            INNER JOIN orders o
                ON p.order_id = o.id

            INNER JOIN users u
                ON o.user_id = u.id

            WHERE p.id = ?

            LIMIT 1
            `,
            [paymentId]
        );


        if (payments.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });
        }


        return res.status(200).json({
            success: true,
            payment: payments[0]
        });

    } catch (error) {

        console.error(
            "Get payment details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load payment details."
        });
    }
};


// ============================================================
// APPROVE PAYMENT
// ============================================================

const approvePayment = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const paymentId =
            Number(req.params.id);


        if (
            !Number.isInteger(paymentId) ||
            paymentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment ID."
            });
        }


        await connection.beginTransaction();


        // ----------------------------------------------------
        // LOCK PAYMENT
        // ----------------------------------------------------

        const [payments] =
            await connection.query(
                `
                SELECT
                    p.id,
                    p.order_id,
                    p.payment_method,
                    p.transaction_id,
                    p.status,
                    p.verification_status,

                    o.user_id,
                    o.status AS order_status

                FROM payments p

                INNER JOIN orders o
                    ON p.order_id = o.id

                WHERE p.id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [paymentId]
            );


        if (payments.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });
        }


        const payment =
            payments[0];


        // ----------------------------------------------------
        // CHECK PAYMENT METHOD
        // ----------------------------------------------------

        const manualMethods = [
            "UPI",
            "QR",
            "BANK_TRANSFER"
        ];


        if (
            !manualMethods.includes(
                payment.payment_method
            )
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Only manual online payments can be verified here."
            });
        }


        // ----------------------------------------------------
        // CHECK CURRENT VERIFICATION STATUS
        // ----------------------------------------------------

        if (
            payment.verification_status ===
            "APPROVED"
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "This payment has already been approved."
            });
        }


        // ----------------------------------------------------
        // REQUIRE TRANSACTION ID
        // ----------------------------------------------------

        if (
            !payment.transaction_id ||
            payment.transaction_id.trim() === ""
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Transaction ID / UTR ID is missing."
            });
        }


        // ----------------------------------------------------
        // UPDATE PAYMENT
        // ----------------------------------------------------

        await connection.query(
            `
            UPDATE payments

            SET
                status = 'SUCCESS',
                verification_status = 'APPROVED'

            WHERE id = ?
            `,
            [paymentId]
        );


        // ----------------------------------------------------
        // UPDATE ORDER
        // ----------------------------------------------------

        if (
            [
                "PLACED",
                "CONFIRMED"
            ].includes(
                payment.order_status
            )
        ) {

            await connection.query(
                `
                UPDATE orders

                SET
                    status = 'CONFIRMED'

                WHERE id = ?
                `,
                [payment.order_id]
            );
        }


        // ----------------------------------------------------
        // CUSTOMER NOTIFICATION
        // ----------------------------------------------------

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message
            )

            VALUES (?, ?, ?)
            `,
            [
                payment.user_id,
                "Payment Approved",
                `Your payment for order #${payment.order_id} has been verified and approved.`
            ]
        );


        // ----------------------------------------------------
        // COMMIT
        // ----------------------------------------------------

        await connection.commit();


        return res.status(200).json({
            success: true,
            message:
                "Payment approved successfully.",
            payment_id:
                paymentId,
            order_id:
                payment.order_id,
            payment_status:
                "SUCCESS",
            verification_status:
                "APPROVED",
            order_status:
                "CONFIRMED"
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Approve payment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to approve payment."
        });

    } finally {

        connection.release();
    }
};


// ============================================================
// REJECT PAYMENT
// ============================================================

const rejectPayment = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        const paymentId =
            Number(req.params.id);


        if (
            !Number.isInteger(paymentId) ||
            paymentId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment ID."
            });
        }


        const adminReason =
            typeof req.body.reason === "string"
                ? req.body.reason.trim()
                : "";


        await connection.beginTransaction();


        // ----------------------------------------------------
        // LOCK PAYMENT
        // ----------------------------------------------------

        const [payments] =
            await connection.query(
                `
                SELECT
                    p.id,
                    p.order_id,
                    p.payment_method,
                    p.transaction_id,
                    p.status,
                    p.verification_status,

                    o.user_id,
                    o.status AS order_status

                FROM payments p

                INNER JOIN orders o
                    ON p.order_id = o.id

                WHERE p.id = ?

                LIMIT 1

                FOR UPDATE
                `,
                [paymentId]
            );


        if (payments.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });
        }


        const payment =
            payments[0];


        // ----------------------------------------------------
        // CHECK PAYMENT METHOD
        // ----------------------------------------------------

        const manualMethods = [
            "UPI",
            "QR",
            "BANK_TRANSFER"
        ];


        if (
            !manualMethods.includes(
                payment.payment_method
            )
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Only manual online payments can be verified here."
            });
        }


        // ----------------------------------------------------
        // CHECK ALREADY APPROVED
        // ----------------------------------------------------

        if (
            payment.verification_status ===
            "APPROVED"
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "An approved payment cannot be rejected."
            });
        }


        // ----------------------------------------------------
        // UPDATE PAYMENT
        // ----------------------------------------------------

        await connection.query(
            `
            UPDATE payments

            SET
                status = 'FAILED',
                verification_status = 'REJECTED'

            WHERE id = ?
            `,
            [paymentId]
        );


        // ----------------------------------------------------
        // BUILD CUSTOMER MESSAGE
        // ----------------------------------------------------

        let notificationMessage =
            `Your payment for order #${payment.order_id} was rejected.`;

        if (adminReason) {
            notificationMessage +=
                ` Reason: ${adminReason}`;
        }


        // ----------------------------------------------------
        // CUSTOMER NOTIFICATION
        // ----------------------------------------------------

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message
            )

            VALUES (?, ?, ?)
            `,
            [
                payment.user_id,
                "Payment Rejected",
                notificationMessage
            ]
        );


        // ----------------------------------------------------
        // COMMIT
        // ----------------------------------------------------

        await connection.commit();


        return res.status(200).json({
            success: true,
            message:
                "Payment rejected successfully.",
            payment_id:
                paymentId,
            order_id:
                payment.order_id,
            payment_status:
                "FAILED",
            verification_status:
                "REJECTED",
            reason:
                adminReason || null
        });

    } catch (error) {

        await connection.rollback();

        console.error(
            "Reject payment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reject payment."
        });

    } finally {

        connection.release();
    }
};


module.exports = {
    getPendingPayments,
    getPaymentById,
    approvePayment,
    rejectPayment
};