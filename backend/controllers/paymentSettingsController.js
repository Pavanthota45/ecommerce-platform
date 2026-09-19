const pool = require("../config/db");


// =====================================================
// GET PAYMENT SETTINGS FOR CUSTOMER
// =====================================================

const getPaymentSettings = async (req, res) => {
    try {

        const [settings] = await pool.query(
            `SELECT
                id,

                cod_enabled,

                upi_id_enabled,
                upi_id,

                qr_enabled,
                qr_merchant_name,

                bank_transfer_enabled,
                account_holder_name,
                bank_name,
                account_number,
                ifsc_code,

                updated_at

             FROM payment_settings
             WHERE id = 1
             LIMIT 1`
        );


        if (settings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment settings not configured."
            });
        }


        const paymentSettings = settings[0];


        return res.status(200).json({
            success: true,
            payment_settings: paymentSettings
        });

    } catch (error) {

        console.error(
            "Get payment settings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to fetch payment settings."
        });
    }
};



// =====================================================
// UPDATE PAYMENT SETTINGS
// ADMIN ONLY
// =====================================================

const updatePaymentSettings = async (req, res) => {
    try {

        const {
            cod_enabled,

            upi_id_enabled,
            upi_id,

            qr_enabled,
            qr_merchant_name,

            bank_transfer_enabled,
            account_holder_name,
            bank_name,
            account_number,
            ifsc_code
        } = req.body;


        // -------------------------------------------------
        // VALIDATE BOOLEAN VALUES
        // -------------------------------------------------

        const booleanFields = [
            cod_enabled,
            upi_id_enabled,
            qr_enabled,
            bank_transfer_enabled
        ];


        for (const value of booleanFields) {

            if (
                value !== undefined &&
                value !== true &&
                value !== false &&
                value !== 0 &&
                value !== 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Payment method enabled values must be boolean."
                });
            }
        }



        // -------------------------------------------------
        // UPI ID VALIDATION
        // -------------------------------------------------

        if (
            upi_id_enabled === true &&
            (!upi_id || !upi_id.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "UPI ID is required when UPI ID payment is enabled."
            });
        }



        // -------------------------------------------------
        // DYNAMIC QR VALIDATION
        // -------------------------------------------------

        if (
            qr_enabled === true &&
            (!upi_id || !upi_id.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "UPI ID is required when Dynamic QR payment is enabled."
            });
        }



        // -------------------------------------------------
        // QR MERCHANT NAME
        // -------------------------------------------------

        if (
            qr_enabled === true &&
            (!qr_merchant_name || !qr_merchant_name.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Merchant name is required when Dynamic QR payment is enabled."
            });
        }



        // -------------------------------------------------
        // BANK TRANSFER VALIDATION
        // -------------------------------------------------

        if (bank_transfer_enabled === true) {

            if (
                !account_holder_name ||
                !account_holder_name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Account holder name is required for bank transfer."
                });
            }


            if (
                !bank_name ||
                !bank_name.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Bank name is required for bank transfer."
                });
            }


            if (
                !account_number ||
                !account_number.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Account number is required for bank transfer."
                });
            }


            if (
                !ifsc_code ||
                !ifsc_code.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "IFSC code is required for bank transfer."
                });
            }
        }



        // -------------------------------------------------
        // UPDATE DATABASE
        // -------------------------------------------------

        await pool.query(
            `UPDATE payment_settings
             SET
                cod_enabled = ?,

                upi_id_enabled = ?,
                upi_id = ?,

                qr_enabled = ?,
                qr_merchant_name = ?,

                bank_transfer_enabled = ?,
                account_holder_name = ?,
                bank_name = ?,
                account_number = ?,
                ifsc_code = ?

             WHERE id = 1`,
            [
                cod_enabled !== undefined
                    ? Boolean(cod_enabled)
                    : true,

                upi_id_enabled !== undefined
                    ? Boolean(upi_id_enabled)
                    : true,

                upi_id
                    ? upi_id.trim()
                    : null,

                qr_enabled !== undefined
                    ? Boolean(qr_enabled)
                    : true,

                qr_merchant_name
                    ? qr_merchant_name.trim()
                    : null,

                bank_transfer_enabled !== undefined
                    ? Boolean(bank_transfer_enabled)
                    : true,

                account_holder_name
                    ? account_holder_name.trim()
                    : null,

                bank_name
                    ? bank_name.trim()
                    : null,

                account_number
                    ? account_number.trim()
                    : null,

                ifsc_code
                    ? ifsc_code.trim().toUpperCase()
                    : null
            ]
        );



        // -------------------------------------------------
        // GET UPDATED SETTINGS
        // -------------------------------------------------

        const [updatedSettings] = await pool.query(
            `SELECT
                id,

                cod_enabled,

                upi_id_enabled,
                upi_id,

                qr_enabled,
                qr_merchant_name,

                bank_transfer_enabled,
                account_holder_name,
                bank_name,
                account_number,
                ifsc_code,

                updated_at

             FROM payment_settings
             WHERE id = 1
             LIMIT 1`
        );



        return res.status(200).json({
            success: true,
            message: "Payment settings updated successfully.",
            payment_settings: updatedSettings[0]
        });

    } catch (error) {

        console.error(
            "Update payment settings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update payment settings."
        });
    }
};



module.exports = {
    getPaymentSettings,
    updatePaymentSettings
};