const db = require("../config/db");

// ======================================================
// GET PAYMENT SETTINGS
// ======================================================

const getPaymentSettings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
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
                ifsc_code
            FROM payment_settings
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.json({
                success: true,
                settings: {
                    cod_enabled: 1,
                    upi_id_enabled: 1,
                    upi_id: "",
                    qr_enabled: 1,
                    qr_merchant_name: "",
                    bank_transfer_enabled: 1,
                    account_name: "",
                    bank_name: "",
                    account_number: "",
                    ifsc_code: ""
                }
            });
        }

        const settings = rows[0];

        return res.json({
            success: true,
            settings: {
                id: settings.id,
                cod_enabled: Boolean(
                    settings.cod_enabled
                ),
                upi_id_enabled: Boolean(
                    settings.upi_id_enabled
                ),
                upi_id: settings.upi_id || "",
                qr_enabled: Boolean(
                    settings.qr_enabled
                ),
                qr_merchant_name:
                    settings.qr_merchant_name || "",
                bank_transfer_enabled: Boolean(
                    settings.bank_transfer_enabled
                ),

                // Database column:
                // account_holder_name
                //
                // Frontend field:
                // account_name
                account_name:
                    settings.account_holder_name || "",

                bank_name:
                    settings.bank_name || "",

                account_number:
                    settings.account_number || "",

                ifsc_code:
                    settings.ifsc_code || ""
            }
        });
    } catch (error) {
        console.error(
            "Get admin payment settings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load payment settings.",
            error: error.message
        });
    }
};


// ======================================================
// UPDATE PAYMENT SETTINGS
// ======================================================

const updatePaymentSettings = async (req, res) => {
    try {
        const {
            cod_enabled,
            upi_id_enabled,
            upi_id,
            qr_enabled,
            qr_merchant_name,
            bank_transfer_enabled,
            account_name,
            bank_name,
            account_number,
            ifsc_code
        } = req.body;

        // ==================================================
        // NORMALIZE VALUES
        // ==================================================

        const codEnabled =
            Boolean(cod_enabled);

        const upiEnabled =
            Boolean(upi_id_enabled);

        const qrEnabled =
            Boolean(qr_enabled);

        const bankTransferEnabled =
            Boolean(bank_transfer_enabled);

        const cleanUpiId =
            String(upi_id || "").trim();

        const cleanMerchantName =
            String(
                qr_merchant_name || ""
            ).trim();

        const cleanAccountName =
            String(
                account_name || ""
            ).trim();

        const cleanBankName =
            String(
                bank_name || ""
            ).trim();

        const cleanAccountNumber =
            String(
                account_number || ""
            ).trim();

        const cleanIfsc =
            String(
                ifsc_code || ""
            )
                .trim()
                .toUpperCase();

        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            !codEnabled &&
            !upiEnabled &&
            !qrEnabled &&
            !bankTransferEnabled
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "At least one payment method must be enabled."
            });
        }

        // ==================================================
        // UPI VALIDATION
        // ==================================================

        if (upiEnabled || qrEnabled) {
            if (!cleanUpiId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "UPI ID is required when UPI or QR payment is enabled."
                });
            }

            if (!cleanUpiId.includes("@")) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid UPI ID, for example pavan@upi."
                });
            }
        }

        // ==================================================
        // QR VALIDATION
        // ==================================================

        if (qrEnabled) {
            if (!cleanMerchantName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "QR merchant name is required when QR payment is enabled."
                });
            }
        }

        // ==================================================
        // BANK VALIDATION
        // ==================================================

        if (bankTransferEnabled) {
            if (!cleanAccountName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Account holder name is required."
                });
            }

            if (!cleanBankName) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Bank name is required."
                });
            }

            if (!cleanAccountNumber) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Account number is required."
                });
            }

            if (!/^\d{6,30}$/.test(
                cleanAccountNumber
            )) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Account number must contain 6 to 30 digits."
                });
            }

            if (!cleanIfsc) {
                return res.status(400).json({
                    success: false,
                    message:
                        "IFSC code is required."
                });
            }

            if (
                !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
                    cleanIfsc
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid IFSC code."
                });
            }
        }

        // ==================================================
        // CHECK EXISTING SETTINGS
        // ==================================================

        const [existingRows] = await db.query(`
            SELECT id
            FROM payment_settings
            LIMIT 1
        `);

        // ==================================================
        // UPDATE EXISTING ROW
        // ==================================================

        if (existingRows.length > 0) {
            const settingsId =
                existingRows[0].id;

            await db.query(
                `
                UPDATE payment_settings
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
                WHERE id = ?
                `,
                [
                    codEnabled ? 1 : 0,
                    upiEnabled ? 1 : 0,
                    cleanUpiId || null,
                    qrEnabled ? 1 : 0,
                    cleanMerchantName || null,
                    bankTransferEnabled ? 1 : 0,
                    cleanAccountName || null,
                    cleanBankName || null,
                    cleanAccountNumber || null,
                    cleanIfsc || null,
                    settingsId
                ]
            );
        }

        // ==================================================
        // INSERT SETTINGS IF NO ROW EXISTS
        // ==================================================

        else {
            await db.query(
                `
                INSERT INTO payment_settings
                (
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
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    codEnabled ? 1 : 0,
                    upiEnabled ? 1 : 0,
                    cleanUpiId || null,
                    qrEnabled ? 1 : 0,
                    cleanMerchantName || null,
                    bankTransferEnabled ? 1 : 0,
                    cleanAccountName || null,
                    cleanBankName || null,
                    cleanAccountNumber || null,
                    cleanIfsc || null
                ]
            );
        }

        // ==================================================
        // GET UPDATED SETTINGS
        // ==================================================

        const [rows] = await db.query(`
            SELECT
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
                ifsc_code
            FROM payment_settings
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.status(500).json({
                success: false,
                message:
                    "Payment settings were saved, but could not be loaded afterward."
            });
        }

        const settings = rows[0];

        return res.json({
            success: true,
            message:
                "Payment settings updated successfully.",
            settings: {
                id: settings.id,
                cod_enabled: Boolean(
                    settings.cod_enabled
                ),
                upi_id_enabled: Boolean(
                    settings.upi_id_enabled
                ),
                upi_id: settings.upi_id || "",
                qr_enabled: Boolean(
                    settings.qr_enabled
                ),
                qr_merchant_name:
                    settings.qr_merchant_name || "",
                bank_transfer_enabled: Boolean(
                    settings.bank_transfer_enabled
                ),
                account_name:
                    settings.account_holder_name || "",
                bank_name:
                    settings.bank_name || "",
                account_number:
                    settings.account_number || "",
                ifsc_code:
                    settings.ifsc_code || ""
            }
        });
    } catch (error) {
        console.error(
            "Update admin payment settings error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update payment settings.",
            error: error.message
        });
    }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    getPaymentSettings,
    updatePaymentSettings
};