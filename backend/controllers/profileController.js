const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ==========================================
// GET MY PROFILE
// ==========================================

const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                role,
                created_at
            FROM users
            WHERE id = ?
            `,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error(
            "Get profile error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load profile.",
            error: error.message
        });
    }
};

// ==========================================
// UPDATE MY PROFILE
// ==========================================

const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            name,
            phone
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required."
            });
        }

        await pool.query(
            `
            UPDATE users
            SET
                name = ?,
                phone = ?
            WHERE id = ?
            `,
            [
                name.trim(),
                phone ? phone.trim() : null,
                userId
            ]
        );

        const [users] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                role,
                created_at
            FROM users
            WHERE id = ?
            `,
            [userId]
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: users[0]
        });

    } catch (error) {
        console.error(
            "Update profile error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update profile.",
            error: error.message
        });
    }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            currentPassword,
            newPassword
        } = req.body;

        if (
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must contain at least 6 characters."
            });
        }

        const [users] = await pool.query(
            `
            SELECT
                id,
                password
            FROM users
            WHERE id = ?
            `,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const user = users[0];

        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                user.password
            );

        if (!passwordMatches) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password is incorrect."
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );

        await pool.query(
            `
            UPDATE users
            SET password = ?
            WHERE id = ?
            `,
            [
                hashedPassword,
                userId
            ]
        );

        res.status(200).json({
            success: true,
            message:
                "Password changed successfully."
        });

    } catch (error) {
        console.error(
            "Change password error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to change password.",
            error: error.message
        });
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getMyProfile,
    updateMyProfile,
    changePassword
};