const pool = require("../config/db");

// ==========================================
// GET ALL ADDRESSES
// ==========================================

const getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        const [addresses] = await pool.query(
            `SELECT
                id,
                user_id,
                full_name,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                is_default
             FROM addresses
             WHERE user_id = ?
             ORDER BY is_default DESC, id DESC`,
            [userId]
        );

        res.json({
            success: true,
            count: addresses.length,
            addresses
        });

    } catch (error) {
        console.error(
            "Get addresses error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch addresses"
        });
    }
};

// ==========================================
// GET SINGLE ADDRESS
// ==========================================

const getAddressById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [addresses] = await pool.query(
            `SELECT
                id,
                user_id,
                full_name,
                phone,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country,
                is_default
             FROM addresses
             WHERE id = ?
             AND user_id = ?`,
            [id, userId]
        );

        if (addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        res.json({
            success: true,
            address: addresses[0]
        });

    } catch (error) {
        console.error(
            "Get address error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch address"
        });
    }
};

// ==========================================
// CREATE ADDRESS
// ==========================================

const createAddress = async (req, res) => {
    const connection =
        await pool.getConnection();

    try {
        const userId = req.user.id;

        const {
            full_name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            is_default
        } = req.body;

        if (
            !full_name ||
            !phone ||
            !address_line1 ||
            !city ||
            !state ||
            !postal_code ||
            !country
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name, phone, address, city, state, postal code and country are required"
            });
        }

        await connection.beginTransaction();

        const [existingAddresses] =
            await connection.query(
                `SELECT id
                 FROM addresses
                 WHERE user_id = ?`,
                [userId]
            );

        let makeDefault =
            is_default === true;

        // First address automatically becomes default
        if (existingAddresses.length === 0) {
            makeDefault = true;
        }

        if (makeDefault) {
            await connection.query(
                `UPDATE addresses
                 SET is_default = FALSE
                 WHERE user_id = ?`,
                [userId]
            );
        }

        const [result] =
            await connection.query(
                `INSERT INTO addresses
                (
                    user_id,
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    postal_code,
                    country,
                    is_default
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    full_name.trim(),
                    phone.trim(),
                    address_line1.trim(),
                    address_line2
                        ? address_line2.trim()
                        : null,
                    city.trim(),
                    state.trim(),
                    postal_code.trim(),
                    country.trim(),
                    makeDefault
                ]
            );

        await connection.commit();

        const [addresses] =
            await pool.query(
                `SELECT
                    id,
                    user_id,
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    postal_code,
                    country,
                    is_default
                 FROM addresses
                 WHERE id = ?`,
                [result.insertId]
            );

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address: addresses[0]
        });

    } catch (error) {
        await connection.rollback();

        console.error(
            "Create address error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to add address"
        });

    } finally {
        connection.release();
    }
};

// ==========================================
// UPDATE ADDRESS
// ==========================================

const updateAddress = async (req, res) => {
    const connection =
        await pool.getConnection();

    try {
        const userId = req.user.id;
        const { id } = req.params;

        const {
            full_name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            is_default
        } = req.body;

        if (
            !full_name ||
            !phone ||
            !address_line1 ||
            !city ||
            !state ||
            !postal_code ||
            !country
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name, phone, address, city, state, postal code and country are required"
            });
        }

        const [existingAddresses] =
            await connection.query(
                `SELECT
                    id,
                    is_default
                 FROM addresses
                 WHERE id = ?
                 AND user_id = ?`,
                [id, userId]
            );

        if (existingAddresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const oldDefault =
            Boolean(
                existingAddresses[0].is_default
            );

        const requestedDefault =
            is_default === true;

        await connection.beginTransaction();

        // If making this address default,
        // remove default from all other addresses.
        if (requestedDefault) {
            await connection.query(
                `UPDATE addresses
                 SET is_default = FALSE
                 WHERE user_id = ?`,
                [userId]
            );
        }

        let finalDefault =
            requestedDefault;

        // Prevent a user from accidentally
        // having no default address when
        // updating the existing default.
        if (
            oldDefault &&
            is_default !== false
        ) {
            finalDefault = true;
        }

        await connection.query(
            `UPDATE addresses
             SET
                full_name = ?,
                phone = ?,
                address_line1 = ?,
                address_line2 = ?,
                city = ?,
                state = ?,
                postal_code = ?,
                country = ?,
                is_default = ?
             WHERE id = ?
             AND user_id = ?`,
            [
                full_name.trim(),
                phone.trim(),
                address_line1.trim(),
                address_line2
                    ? address_line2.trim()
                    : null,
                city.trim(),
                state.trim(),
                postal_code.trim(),
                country.trim(),
                finalDefault,
                id,
                userId
            ]
        );

        await connection.commit();

        const [addresses] =
            await pool.query(
                `SELECT
                    id,
                    user_id,
                    full_name,
                    phone,
                    address_line1,
                    address_line2,
                    city,
                    state,
                    postal_code,
                    country,
                    is_default
                 FROM addresses
                 WHERE id = ?
                 AND user_id = ?`,
                [id, userId]
            );

        res.json({
            success: true,
            message: "Address updated successfully",
            address: addresses[0]
        });

    } catch (error) {
        await connection.rollback();

        console.error(
            "Update address error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update address"
        });

    } finally {
        connection.release();
    }
};

// ==========================================
// SET DEFAULT ADDRESS
// ==========================================

const setDefaultAddress = async (req, res) => {
    const connection =
        await pool.getConnection();

    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [addresses] =
            await connection.query(
                `SELECT id
                 FROM addresses
                 WHERE id = ?
                 AND user_id = ?`,
                [id, userId]
            );

        if (addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        await connection.beginTransaction();

        await connection.query(
            `UPDATE addresses
             SET is_default = FALSE
             WHERE user_id = ?`,
            [userId]
        );

        await connection.query(
            `UPDATE addresses
             SET is_default = TRUE
             WHERE id = ?
             AND user_id = ?`,
            [id, userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message:
                "Default address updated successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error(
            "Set default address error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to set default address"
        });

    } finally {
        connection.release();
    }
};

// ==========================================
// DELETE ADDRESS
// ==========================================

const deleteAddress = async (req, res) => {
    const connection =
        await pool.getConnection();

    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [addresses] =
            await connection.query(
                `SELECT
                    id,
                    is_default
                 FROM addresses
                 WHERE id = ?
                 AND user_id = ?`,
                [id, userId]
            );

        if (addresses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const wasDefault =
            Boolean(
                addresses[0].is_default
            );

        await connection.beginTransaction();

        await connection.query(
            `DELETE FROM addresses
             WHERE id = ?
             AND user_id = ?`,
            [id, userId]
        );

        // If default address was deleted,
        // make the newest remaining address default.
        if (wasDefault) {
            const [remainingAddresses] =
                await connection.query(
                    `SELECT id
                     FROM addresses
                     WHERE user_id = ?
                     ORDER BY id DESC
                     LIMIT 1`,
                    [userId]
                );

            if (
                remainingAddresses.length > 0
            ) {
                await connection.query(
                    `UPDATE addresses
                     SET is_default = TRUE
                     WHERE id = ?
                     AND user_id = ?`,
                    [
                        remainingAddresses[0].id,
                        userId
                    ]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message:
                "Address deleted successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error(
            "Delete address error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete address"
        });

    } finally {
        connection.release();
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress
};