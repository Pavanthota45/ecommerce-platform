const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");


// ============================================================
// REGISTER USER
// ============================================================

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            role
        } = req.body;


        // ----------------------------------------------------
        // VALIDATE REQUIRED FIELDS
        // ----------------------------------------------------

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }


        // ----------------------------------------------------
        // NORMALIZE EMAIL
        // ----------------------------------------------------

        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // ----------------------------------------------------
        // CHECK EMAIL
        // ----------------------------------------------------

        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );


        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }


        // ----------------------------------------------------
        // HASH PASSWORD
        // ----------------------------------------------------

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // ----------------------------------------------------
        // PUBLIC REGISTRATION ONLY CREATES CUSTOMERS
        // ----------------------------------------------------

        const userRole = "customer";


        // ----------------------------------------------------
        // INSERT USER
        // ----------------------------------------------------

        const [result] = await pool.query(
            `
            INSERT INTO users
            (
                name,
                email,
                password,
                role,
                phone
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                name.trim(),
                normalizedEmail,
                hashedPassword,
                userRole,
                phone ? phone.trim() : null
            ]
        );


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(201).json({
            success: true,
            message: "Registration successful",

            user: {
                id: result.insertId,
                name: name.trim(),
                email: normalizedEmail,
                role: userRole,
                phone: phone ? phone.trim() : null
            }
        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};


// ============================================================
// LOGIN USER
// ============================================================

const login = async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;


        // ----------------------------------------------------
        // VALIDATE
        // ----------------------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }


        // ----------------------------------------------------
        // NORMALIZE EMAIL
        // ----------------------------------------------------

        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // ----------------------------------------------------
        // FIND USER
        // ----------------------------------------------------

        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [normalizedEmail]
        );


        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        const user = users[0];


        // ----------------------------------------------------
        // COMPARE PASSWORD
        // ----------------------------------------------------

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        // ----------------------------------------------------
        // CREATE JWT
        // ----------------------------------------------------

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};


// ============================================================
// GET CURRENT CUSTOMER PROFILE
// ============================================================

const getProfile = async (req, res) => {
    try {

        const userId = req.user.id;


        // ----------------------------------------------------
        // FIND USER
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // RETURN PROFILE
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {

        console.error(
            "Get profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile."
        });
    }
};


// ============================================================
// UPDATE CURRENT CUSTOMER PROFILE
// ============================================================

const updateProfile = async (req, res) => {
    try {

        const userId = req.user.id;

        const {
            name,
            email,
            phone
        } = req.body;


        // ----------------------------------------------------
        // VALIDATE NAME
        // ----------------------------------------------------

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required."
            });
        }


        // ----------------------------------------------------
        // VALIDATE EMAIL
        // ----------------------------------------------------

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }


        const normalizedEmail = email
            .trim()
            .toLowerCase();


        // ----------------------------------------------------
        // CHECK WHETHER EMAIL IS USED BY ANOTHER USER
        // ----------------------------------------------------

        const [existingUsers] = await pool.query(
            `
            SELECT id
            FROM users
            WHERE email = ?
            AND id != ?
            `,
            [
                normalizedEmail,
                userId
            ]
        );


        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already being used by another account."
            });
        }


        // ----------------------------------------------------
        // UPDATE PROFILE
        // ----------------------------------------------------

        await pool.query(
            `
            UPDATE users
            SET
                name = ?,
                email = ?,
                phone = ?
            WHERE id = ?
            `,
            [
                name.trim(),
                normalizedEmail,
                phone ? phone.trim() : null,
                userId
            ]
        );


        // ----------------------------------------------------
        // GET UPDATED USER
        // ----------------------------------------------------

        const [updatedUsers] = await pool.query(
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


        if (updatedUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }


        const updatedUser = updatedUsers[0];


        // ----------------------------------------------------
        // CREATE NEW TOKEN
        //
        // Email may have changed, so generate a new JWT.
        // ----------------------------------------------------

        const token = jwt.sign(
            {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            token,
            user: updatedUser
        });

    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update profile."
        });
    }
};


// ============================================================
// CHANGE PASSWORD
// ============================================================

const changePassword = async (req, res) => {
    try {

        const userId = req.user.id;

        const {
            currentPassword,
            newPassword
        } = req.body;


        // ----------------------------------------------------
        // VALIDATE
        // ----------------------------------------------------

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
        }


        // ----------------------------------------------------
        // PASSWORD LENGTH
        // ----------------------------------------------------

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long."
            });
        }


        // ----------------------------------------------------
        // GET CURRENT PASSWORD
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // VERIFY CURRENT PASSWORD
        // ----------------------------------------------------

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );


        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }


        // ----------------------------------------------------
        // PREVENT SAME PASSWORD
        // ----------------------------------------------------

        const samePassword = await bcrypt.compare(
            newPassword,
            user.password
        );


        if (samePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from your current password."
            });
        }


        // ----------------------------------------------------
        // HASH NEW PASSWORD
        // ----------------------------------------------------

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );


        // ----------------------------------------------------
        // UPDATE PASSWORD
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to change password."
        });
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};