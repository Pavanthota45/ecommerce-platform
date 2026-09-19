const pool = require("../config/db");


// ======================================================
// GET MY NOTIFICATIONS
// ======================================================

const getMyNotifications = async (req, res) => {

    try {

        const userId = req.user.id;

        const [notifications] = await pool.query(
            `
            SELECT
                id,
                user_id,
                title,
                message,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            notifications
        });

    } catch (error) {

        console.error(
            "Get notifications error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load notifications.",
            error: error.message
        });
    }
};


// ======================================================
// GET UNREAD NOTIFICATION COUNT
// ======================================================

const getUnreadNotificationCount = async (req, res) => {

    try {

        const userId = req.user.id;

        const [result] = await pool.query(
            `
            SELECT COUNT(*) AS unread_count
            FROM notifications
            WHERE user_id = ?
            AND is_read = 0
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            unread_count: Number(
                result[0]?.unread_count || 0
            )
        });

    } catch (error) {

        console.error(
            "Get unread notification count error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to get notification count.",
            error: error.message
        });
    }
};


// ======================================================
// MARK ONE NOTIFICATION AS READ
// ======================================================

const markNotificationAsRead = async (req, res) => {

    try {

        const userId = req.user.id;
        const notificationId = req.params.id;

        const [result] = await pool.query(
            `
            UPDATE notifications
            SET is_read = 1
            WHERE id = ?
            AND user_id = ?
            `,
            [
                notificationId,
                userId
            ]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read."
        });

    } catch (error) {

        console.error(
            "Mark notification as read error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update notification.",
            error: error.message
        });
    }
};


// ======================================================
// MARK ALL NOTIFICATIONS AS READ
// ======================================================

const markAllNotificationsAsRead = async (req, res) => {

    try {

        const userId = req.user.id;

        await pool.query(
            `
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = ?
            AND is_read = 0
            `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."
        });

    } catch (error) {

        console.error(
            "Mark all notifications as read error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update notifications.",
            error: error.message
        });
    }
};


// ======================================================
// DELETE ONE NOTIFICATION
// ======================================================

const deleteNotification = async (req, res) => {

    try {

        const userId = req.user.id;
        const notificationId = req.params.id;

        const [result] = await pool.query(
            `
            DELETE FROM notifications
            WHERE id = ?
            AND user_id = ?
            `,
            [
                notificationId,
                userId
            ]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted."
        });

    } catch (error) {

        console.error(
            "Delete notification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete notification.",
            error: error.message
        });
    }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
};