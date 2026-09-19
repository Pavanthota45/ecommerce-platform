const db = require("../config/db");
const fs = require("fs");

const {
    processPaymentScreenshot
} = require("../services/paymentOcrService");


// ============================================================
// DELETE UPLOADED FILE
// ============================================================
const deleteUploadedFile = (file) => {
    if (!file || !file.path) {
        return;
    }

    try {
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    } catch (error) {
        console.error(
            "Unable to remove uploaded file:",
            error
        );
    }
};


// ============================================================
// GET PAYMENT SETTINGS
// ============================================================
const getPaymentSettings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                cod_enabled,
                upi_id_enabled,
                upi_id,
                qr_enabled,
                qr_merchant_name,
                bank_transfer_enabled,
                account_holder_name AS account_name,
                bank_name,
                account_number,
                ifsc_code
            FROM payment_settings
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.json({
                success: true,
                settings: {
                    upi_id: "",
                    qr_code_image: "",
                    bank_name: "",
                    account_name: "",
                    account_number: "",
                    ifsc_code: ""
                }
            });
        }

        res.json({
            success: true,
            settings: rows[0]
        });
    } catch (error) {
        console.error(
            "Get payment settings error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to get payment settings"
        });
    }
};


// ============================================================
// CUSTOMER - SUBMIT PAYMENT SCREENSHOT
//
// FLOW:
//
// Customer uploads screenshot
//          ↓
// Backend receives image
//          ↓
// OCR extracts transaction ID
//          ↓
// Save transaction ID
//          ↓
// Payment remains PENDING
//          ↓
// Admin manually verifies
//
// Customer does NOT enter transaction ID manually.
// ============================================================
const uploadPaymentScreenshot = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const customerId = req.user.id;
        const orderId = req.params.orderId;

        // --------------------------------------------------------
        // SCREENSHOT IS MANDATORY
        // --------------------------------------------------------
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment screenshot is required"
            });
        }

        // --------------------------------------------------------
        // BEGIN DATABASE TRANSACTION
        // --------------------------------------------------------
        await connection.beginTransaction();

        // --------------------------------------------------------
        // GET ORDER + PAYMENT
        // --------------------------------------------------------
        const [orders] = await connection.query(
            `SELECT
                o.id,
                o.user_id,
                o.status,
                o.total_amount,

                p.id AS payment_id,
                p.payment_method,
                p.status AS payment_status,
                p.verification_status,
                p.transaction_id,
                p.payment_screenshot,
                p.amount AS payment_amount

             FROM orders o

             LEFT JOIN payments p
                ON p.order_id = o.id

             WHERE o.id = ?
               AND o.user_id = ?

             FOR UPDATE`,
            [
                orderId,
                customerId
            ]
        );

        // --------------------------------------------------------
        // ORDER NOT FOUND
        // --------------------------------------------------------
        if (orders.length === 0) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        // --------------------------------------------------------
        // PAYMENT RECORD NOT FOUND
        // --------------------------------------------------------
        if (!order.payment_id) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(404).json({
                success: false,
                message:
                    "Payment record not found"
            });
        }

        // --------------------------------------------------------
        // ONLY MANUAL PAYMENT METHODS
        // --------------------------------------------------------
        const allowedMethods = [
            "UPI",
            "QR",
            "BANK_TRANSFER"
        ];

        if (
            !allowedMethods.includes(
                order.payment_method
            )
        ) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message:
                    "Payment screenshot submission is only available for UPI, QR and Bank Transfer payments"
            });
        }

        // --------------------------------------------------------
        // PREVENT SUBMISSION AFTER APPROVAL
        // --------------------------------------------------------
        if (
            order.verification_status ===
                "APPROVED" ||
            order.payment_status ===
                "SUCCESS"
        ) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message:
                    "This payment has already been approved"
            });
        }

        // --------------------------------------------------------
        // PREVENT SUBMISSION FOR CANCELLED / DELIVERED ORDERS
        // --------------------------------------------------------
        if (
            order.status === "CANCELLED" ||
            order.status === "DELIVERED"
        ) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(400).json({
                success: false,
                message:
                    "Payment screenshot cannot be submitted for this order"
            });
        }

        // ========================================================
        // OCR PROCESSING
        // ========================================================
        let ocrResult;

        try {
            console.log(
                `Starting payment OCR for order #${order.id}...`
            );

            ocrResult =
                await processPaymentScreenshot(
                    req.file.path
                );

            console.log(
                "Payment OCR result:",
                ocrResult
            );
        } catch (ocrError) {
            console.error(
                "Payment OCR processing error:",
                ocrError
            );

            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(422).json({
                success: false,
                message:
                    "Unable to read the payment screenshot. Please upload a clearer screenshot."
            });
        }

        // ========================================================
        // GET EXTRACTED TRANSACTION ID
        //
        // Support several possible property names so the
        // controller remains compatible with the OCR service.
        // ========================================================
        let extractedTransactionId = "";

        if (ocrResult) {
            extractedTransactionId =
                ocrResult.transactionId ||
                ocrResult.transaction_id ||
                ocrResult.utr ||
                ocrResult.utrId ||
                ocrResult.utr_id ||
                ocrResult.extractedTransactionId ||
                "";
        }

        extractedTransactionId =
            String(
                extractedTransactionId || ""
            ).trim();

        // ========================================================
        // OCR DID NOT FIND TRANSACTION ID
        // ========================================================
        if (!extractedTransactionId) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(422).json({
                success: false,
                message:
                    "We could not detect a UPI transaction ID / UTR ID in the screenshot. Please upload a clear payment screenshot showing the transaction ID."
            });
        }

        // ========================================================
        // BASIC VALIDATION
        // ========================================================
        if (
            extractedTransactionId.length < 3
        ) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(422).json({
                success: false,
                message:
                    "The transaction ID detected from the screenshot is too short. Please upload a clearer screenshot."
            });
        }

        if (
            extractedTransactionId.length > 100
        ) {
            await connection.rollback();

            deleteUploadedFile(req.file);

            return res.status(422).json({
                success: false,
                message:
                    "The transaction ID detected from the screenshot is invalid. Please upload a clearer screenshot."
            });
        }

        // ========================================================
        // SCREENSHOT PATH
        // ========================================================
        const screenshotPath =
            `uploads/payment-screenshots/${req.file.filename}`;

        // ========================================================
        // UPDATE PAYMENT
        //
        // IMPORTANT:
        //
        // transaction_id is now automatically obtained through OCR.
        //
        // Payment remains PENDING until admin manually verifies it.
        // ========================================================
        await connection.query(
            `UPDATE payments
             SET
                transaction_id = ?,
                payment_screenshot = ?,
                verification_status = 'PENDING',
                status = 'PENDING'
             WHERE id = ?`,
            [
                extractedTransactionId,
                screenshotPath,
                order.payment_id
            ]
        );

        // ========================================================
        // CUSTOMER NOTIFICATION
        // ========================================================
        await connection.query(
            `INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    is_read
                )
             VALUES
                (?, ?, ?, ?)`,
            [
                customerId,

                "Payment Screenshot Submitted",

                `Your payment screenshot for order #${order.id} was submitted successfully. The detected transaction ID is ${extractedTransactionId}. Your payment is waiting for admin verification.`,

                0
            ]
        );

        // ========================================================
        // ADMIN NOTIFICATION
        // ========================================================
        await connection.query(
            `INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    is_read
                )
             SELECT
                id,
                ?,
                ?,
                ?
             FROM users
             WHERE role = 'admin'`,
            [
                "Payment Verification Required",

                `Payment screenshot for order #${order.id} requires verification. OCR detected transaction ID: ${extractedTransactionId}.`,

                0
            ]
        );

        // ========================================================
        // COMMIT
        // ========================================================
        await connection.commit();

        // ========================================================
        // RESPONSE
        // ========================================================
        res.json({
            success: true,

            message:
                "Payment screenshot processed successfully. Transaction ID was detected automatically and the payment is waiting for admin verification.",

            payment: {
                payment_id:
                    order.payment_id,

                order_id:
                    order.id,

                payment_method:
                    order.payment_method,

                transaction_id:
                    extractedTransactionId,

                payment_screenshot:
                    screenshotPath,

                verification_status:
                    "PENDING",

                status:
                    "PENDING"
            },

            ocr: {
                transaction_id:
                    extractedTransactionId,

                detected:
                    true
            }
        });

    } catch (error) {

        // --------------------------------------------------------
        // ROLLBACK
        // --------------------------------------------------------
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError
            );
        }

        console.error(
            "Upload payment screenshot error:",
            error
        );

        deleteUploadedFile(req.file);

        res.status(500).json({
            success: false,
            message:
                "Unable to process payment screenshot"
        });

    } finally {

        connection.release();
    }
};


// ============================================================
// ADMIN - GET PENDING MANUAL PAYMENTS
// ============================================================
const getPendingManualPayments = async (
    req,
    res
) => {
    try {

        const [payments] =
            await db.query(
                `SELECT
                    p.id,
                    p.order_id,
                    p.payment_method,
                    p.transaction_id,
                    p.payment_screenshot,
                    p.amount,
                    p.status,
                    p.verification_status,
                    p.created_at,
                    p.updated_at,

                    o.status AS order_status,
                    o.total_amount AS order_total,

                    u.id AS customer_id,
                    u.name AS customer_name,
                    u.email AS customer_email

                 FROM payments p

                 INNER JOIN orders o
                    ON o.id = p.order_id

                 INNER JOIN users u
                    ON u.id = o.user_id

                 WHERE p.payment_method IN (
                    'UPI',
                    'QR',
                    'BANK_TRANSFER'
                 )

                 AND p.verification_status =
                    'PENDING'

                 ORDER BY
                    p.created_at DESC`
            );

        res.json({
            success: true,
            payments
        });

    } catch (error) {

        console.error(
            "Get pending manual payments error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load pending payments"
        });
    }
};


// ============================================================
// ADMIN - GET ALL MANUAL PAYMENTS
// ============================================================
const getAllManualPayments = async (
    req,
    res
) => {
    try {

        const [payments] =
            await db.query(
                `SELECT
                    p.id,
                    p.order_id,
                    p.payment_method,
                    p.transaction_id,
                    p.payment_screenshot,
                    p.amount,
                    p.status,
                    p.verification_status,
                    p.created_at,
                    p.updated_at,

                    o.status AS order_status,
                    o.total_amount AS order_total,

                    u.id AS customer_id,
                    u.name AS customer_name,
                    u.email AS customer_email

                 FROM payments p

                 INNER JOIN orders o
                    ON o.id = p.order_id

                 INNER JOIN users u
                    ON u.id = o.user_id

                 WHERE p.payment_method IN (
                    'UPI',
                    'QR',
                    'BANK_TRANSFER'
                 )

                 ORDER BY
                    p.created_at DESC`
            );

        res.json({
            success: true,
            payments
        });

    } catch (error) {

        console.error(
            "Get all manual payments error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to load payments"
        });
    }
};


// ============================================================
// ADMIN - APPROVE MANUAL PAYMENT
// ============================================================
const approveManualPayment = async (
    req,
    res
) => {

    const connection =
        await db.getConnection();

    try {

        const paymentId =
            req.params.paymentId;

        const adminId =
            req.user.id;

        await connection.beginTransaction();

        // --------------------------------------------------------
        // GET PAYMENT + ORDER
        // --------------------------------------------------------
        const [payments] =
            await connection.query(
                `SELECT
                    p.id,
                    p.order_id,
                    p.payment_method,
                    p.transaction_id,
                    p.amount,
                    p.status AS payment_status,
                    p.verification_status,

                    o.user_id,
                    o.status AS order_status

                 FROM payments p

                 INNER JOIN orders o
                    ON o.id = p.order_id

                 WHERE p.id = ?

                 FOR UPDATE`,
                [
                    paymentId
                ]
            );

        if (payments.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                success: false,
                message:
                    "Payment not found"
            });
        }

        const payment =
            payments[0];

        // --------------------------------------------------------
        // ONLY MANUAL PAYMENT METHODS
        // --------------------------------------------------------
        const allowedMethods = [
            "UPI",
            "QR",
            "BANK_TRANSFER"
        ];

        if (
            !allowedMethods.includes(
                payment.payment_method
            )
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Only manual payments can be approved from this page"
            });
        }

        // --------------------------------------------------------
        // ALREADY APPROVED
        // --------------------------------------------------------
        if (
            payment.verification_status ===
                "APPROVED" ||
            payment.payment_status ===
                "SUCCESS"
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Payment is already approved"
            });
        }

        // --------------------------------------------------------
        // TRANSACTION ID REQUIRED
        //
        // This should have been obtained through OCR.
        // --------------------------------------------------------
        if (
            !payment.transaction_id ||
            String(
                payment.transaction_id
            ).trim() === ""
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "No transaction ID was detected from the payment screenshot"
            });
        }

        // --------------------------------------------------------
        // CANNOT APPROVE CANCELLED ORDER
        // --------------------------------------------------------
        if (
            payment.order_status ===
            "CANCELLED"
        ) {

            await connection.rollback();

            return res.status(400).json({
                success: false,
                message:
                    "Cannot approve payment for a cancelled order"
            });
        }

        // --------------------------------------------------------
        // APPROVE PAYMENT
        // --------------------------------------------------------
        await connection.query(
            `UPDATE payments
             SET
                verification_status = 'APPROVED',
                status = 'SUCCESS'
             WHERE id = ?`,
            [
                paymentId
            ]
        );

        // --------------------------------------------------------
        // CONFIRM ORDER
        // --------------------------------------------------------
        await connection.query(
            `UPDATE orders
             SET
                status = 'CONFIRMED'
             WHERE id = ?`,
            [
                payment.order_id
            ]
        );

        // --------------------------------------------------------
        // CUSTOMER NOTIFICATION
        // --------------------------------------------------------
        await connection.query(
            `INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    is_read
                )
             VALUES
                (?, ?, ?, ?)`,
            [
                payment.user_id,

                "Payment Approved",

                `Your payment for order #${payment.order_id} has been verified successfully. Your order is now confirmed.`,

                0
            ]
        );

        // --------------------------------------------------------
        // OTHER ADMIN NOTIFICATIONS
        // --------------------------------------------------------
        await connection.query(
            `INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    is_read
                )
             SELECT
                id,
                ?,
                ?,
                ?
             FROM users
             WHERE role = 'admin'
               AND id <> ?`,
            [
                "Payment Approved",

                `Manual payment for order #${payment.order_id} was approved by admin #${adminId}.`,

                0,

                adminId
            ]
        );

        // --------------------------------------------------------
        // COMMIT
        // --------------------------------------------------------
        await connection.commit();

        res.json({
            success: true,

            message:
                "Payment approved successfully",

            payment: {
                id:
                    payment.id,

                order_id:
                    payment.order_id,

                verification_status:
                    "APPROVED",

                status:
                    "SUCCESS"
            },

            order: {
                id:
                    payment.order_id,

                status:
                    "CONFIRMED"
            }
        });

    } catch (error) {

        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Rollback error:",
                rollbackError
            );
        }

        console.error(
            "Approve manual payment error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to approve payment"
        });

    } finally {

        connection.release();
    }
};


// ============================================================
// ADMIN - REJECT MANUAL PAYMENT
// ============================================================
const rejectManualPayment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { paymentId } = req.params;
        const { reason } = req.body;

        await connection.beginTransaction();

        const [payments] = await connection.query(
            `
            SELECT
                p.id,
                p.order_id,
                p.payment_method,
                p.status AS payment_status,
                p.verification_status,
                o.status AS order_status,
                o.user_id,
                o.total_amount
            FROM payments p
            INNER JOIN orders o
                ON o.id = p.order_id
            WHERE p.id = ?
            FOR UPDATE
            `,
            [paymentId]
        );

        if (payments.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const payment = payments[0];

        const paymentMethod = String(
            payment.payment_method || ""
        ).toUpperCase();

        if (
            paymentMethod !== "UPI" &&
            paymentMethod !== "QR" &&
            paymentMethod !== "BANK_TRANSFER"
        ) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Only manual payments can be rejected"
            });
        }

        if (payment.verification_status === "REJECTED") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Payment is already rejected"
            });
        }

        if (payment.verification_status === "APPROVED") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Approved payment cannot be rejected"
            });
        }

        if (payment.payment_status === "SUCCESS") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Successful payment cannot be rejected"
            });
        }

        /*
         * Important:
         * A cancelled order CAN have its pending manual payment rejected.
         *
         * If the order is already CANCELLED, we keep it CANCELLED.
         * We also do NOT release inventory again because cancellation
         * should already have released the reserved inventory.
         */

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

        /*
         * Only update the order to CANCELLED when it is not already
         * cancelled.
         */
        if (payment.order_status !== "CANCELLED") {
            await connection.query(
                `
                UPDATE orders
                SET status = 'CANCELLED'
                WHERE id = ?
                `,
                [payment.order_id]
            );

            /*
             * Release inventory only when the order was not already
             * cancelled.
             */
            const [orderItems] = await connection.query(
                `
                SELECT
                    product_id,
                    quantity
                FROM order_items
                WHERE order_id = ?
                `,
                [payment.order_id]
            );

            for (const item of orderItems) {
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
        }

        /*
         * Customer notification
         */
        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                is_read,
                created_at
            )
            VALUES (?, ?, ?, 0, NOW())
            `,
            [
                payment.user_id,
                "Payment Rejected",
                `Your payment for order #${payment.order_id} was rejected.${reason ? ` Reason: ${reason}` : ""}`
            ]
        );

        /*
         * Admin notification
         */
        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                is_read,
                created_at
            )
            SELECT
                id,
                'Payment Rejected',
                ?,
                0,
                NOW()
            FROM users
            WHERE role = 'admin'
            `,
            [
                `Payment for order #${payment.order_id} was rejected.`
            ]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Payment rejected successfully",
            payment: {
                id: payment.id,
                order_id: payment.order_id,
                payment_status: "FAILED",
                verification_status: "REJECTED",
                order_status: payment.order_status === "CANCELLED"
                    ? "CANCELLED"
                    : "CANCELLED"
            }
        });

    } catch (error) {
        await connection.rollback();

        console.error(
            "Reject manual payment error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to reject payment",
            error: error.message
        });

    } finally {
        connection.release();
    }
};


// ============================================================
// EXPORTS
// ============================================================
module.exports = {
    getPaymentSettings,
    uploadPaymentScreenshot,
    getPendingManualPayments,
    getAllManualPayments,
    approveManualPayment,
    rejectManualPayment
};