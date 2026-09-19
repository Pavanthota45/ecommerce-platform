import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

function NotificationBell() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const dropdownRef = useRef(null);

    // ==================================================
    // GET AUTH TOKEN
    // ==================================================

    const getToken = () => {
        return localStorage.getItem("token");
    };

    // ==================================================
    // LOAD NOTIFICATIONS
    // ==================================================

    const loadNotifications = async () => {
        try {
            const token = getToken();

            if (!token) {
                return;
            }

            const response = await axios.get(
                `${API_URL}/api/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setNotifications(
                    response.data.notifications || []
                );
            }
        } catch (error) {
            console.error(
                "Notification loading error:",
                error
            );
        }
    };

    // ==================================================
    // LOAD UNREAD COUNT
    // ==================================================

    const loadUnreadCount = async () => {
        try {
            const token = getToken();

            if (!token) {
                return;
            }

            const response = await axios.get(
                `${API_URL}/api/notifications/unread-count`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setUnreadCount(
                    Number(
                        response.data.unread_count || 0
                    )
                );
            }
        } catch (error) {
            console.error(
                "Unread notification count error:",
                error
            );
        }
    };

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {
        loadUnreadCount();
        loadNotifications();

        const interval = setInterval(() => {
            loadUnreadCount();
            loadNotifications();
        }, 30000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    // ==================================================
    // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    // ==================================================

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(
                    event.target
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    // ==================================================
    // TOGGLE DROPDOWN
    // ==================================================

    const handleBellClick = async () => {
        const newState = !open;

        setOpen(newState);

        if (newState) {
            setLoading(true);

            await loadNotifications();

            setLoading(false);
        }
    };

    // ==================================================
    // MARK ONE NOTIFICATION AS READ
    // ==================================================

    const markAsRead = async (notificationId) => {
        try {
            const token = getToken();

            if (!token) {
                return;
            }

            await axios.put(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === notificationId
                        ? {
                            ...notification,
                            is_read: 1
                        }
                        : notification
                )
            );

            setUnreadCount((previous) =>
                Math.max(0, previous - 1)
            );
        } catch (error) {
            console.error(
                "Mark notification read error:",
                error
            );
        }
    };

    // ==================================================
    // MARK ALL AS READ
    // ==================================================

    const markAllAsRead = async () => {
        try {
            const token = getToken();

            if (!token) {
                return;
            }

            await axios.put(
                `${API_URL}/api/notifications/read-all`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    is_read: 1
                }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error(
                "Mark all notifications read error:",
                error
            );
        }
    };

    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatNotificationDate = (date) => {
        if (!date) {
            return "";
        }

        const notificationDate =
            new Date(date);

        if (
            Number.isNaN(
                notificationDate.getTime()
            )
        ) {
            return "";
        }

        const now = new Date();

        const difference =
            now.getTime() -
            notificationDate.getTime();

        const seconds =
            Math.floor(difference / 1000);

        if (seconds < 60) {
            return "Just now";
        }

        const minutes =
            Math.floor(seconds / 60);

        if (minutes < 60) {
            return `${minutes} min ago`;
        }

        const hours =
            Math.floor(minutes / 60);

        if (hours < 24) {
            return `${hours} hr ago`;
        }

        const days =
            Math.floor(hours / 24);

        if (days < 7) {
            return `${days} day${
                days === 1 ? "" : "s"
            } ago`;
        }

        return notificationDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    // ==================================================
    // HANDLE NOTIFICATION CLICK
    // ==================================================

    const handleNotificationClick = async (
        notification
    ) => {
        if (
            Number(notification.is_read) === 0
        ) {
            await markAsRead(notification.id);
        }
    };

    // ==================================================
    // VIEW ALL
    // ==================================================

    const viewAllNotifications = () => {
        setOpen(false);
        navigate("/notifications");
    };

    return (
        <div
            ref={dropdownRef}
            style={styles.wrapper}
        >
            {/* ==========================================
                BELL BUTTON
            ========================================== */}

            <button
                type="button"
                onClick={handleBellClick}
                style={styles.bellButton}
                aria-label="Notifications"
            >
                <span style={styles.bellIcon}>
                    🔔
                </span>

                {unreadCount > 0 && (
                    <span style={styles.badge}>
                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                    </span>
                )}
            </button>

            {/* ==========================================
                DROPDOWN
            ========================================== */}

            {open && (
                <div style={styles.dropdown}>
                    {/* HEADER */}

                    <div style={styles.dropdownHeader}>
                        <div>
                            <h3
                                style={
                                    styles.dropdownTitle
                                }
                            >
                                Notifications
                            </h3>

                            <span
                                style={
                                    styles.dropdownSubtitle
                                }
                            >
                                {unreadCount > 0
                                    ? `${unreadCount} unread`
                                    : "All caught up"}
                            </span>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={
                                    markAllAsRead
                                }
                                style={
                                    styles.markAllButton
                                }
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* BODY */}

                    <div style={styles.notificationList}>
                        {loading ? (
                            <div
                                style={
                                    styles.emptyMessage
                                }
                            >
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div
                                style={
                                    styles.emptyMessage
                                }
                            >
                                <div
                                    style={
                                        styles.emptyIcon
                                    }
                                >
                                    🔔
                                </div>

                                <strong>
                                    No notifications
                                </strong>

                                <p
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    You're all caught up.
                                </p>
                            </div>
                        ) : (
                            notifications
                                .slice(0, 6)
                                .map(
                                    (
                                        notification
                                    ) => {
                                        const isUnread =
                                            Number(
                                                notification.is_read
                                            ) === 0;

                                        return (
                                            <button
                                                type="button"
                                                key={
                                                    notification.id
                                                }
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        notification
                                                    )
                                                }
                                                style={{
                                                    ...styles.notificationItem,
                                                    ...(isUnread
                                                        ? styles.unreadItem
                                                        : {})
                                                }}
                                            >
                                                <div
                                                    style={
                                                        styles.notificationIcon
                                                    }
                                                >
                                                    {isUnread
                                                        ? "🔵"
                                                        : "🔔"}
                                                </div>

                                                <div
                                                    style={
                                                        styles.notificationContent
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.notificationTitleRow
                                                        }
                                                    >
                                                        <strong
                                                            style={
                                                                styles.notificationTitle
                                                            }
                                                        >
                                                            {
                                                                notification.title
                                                            }
                                                        </strong>

                                                        {isUnread && (
                                                            <span
                                                                style={
                                                                    styles.unreadDot
                                                                }
                                                            />
                                                        )}
                                                    </div>

                                                    <p
                                                        style={
                                                            styles.notificationMessage
                                                        }
                                                    >
                                                        {
                                                            notification.message
                                                        }
                                                    </p>

                                                    <span
                                                        style={
                                                            styles.notificationTime
                                                        }
                                                    >
                                                        {formatNotificationDate(
                                                            notification.created_at
                                                        )}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    }
                                )
                        )}
                    </div>

                    {/* FOOTER */}

                    <div style={styles.dropdownFooter}>
                        <button
                            type="button"
                            onClick={
                                viewAllNotifications
                            }
                            style={
                                styles.viewAllButton
                            }
                        >
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ======================================================
// STYLES
// ======================================================

const styles = {
    wrapper: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center"
    },

    bellButton: {
        position: "relative",
        width: "42px",
        height: "42px",
        border: "1px solid #e5e7eb",
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },

    bellIcon: {
        fontSize: "20px",
        lineHeight: 1
    },

    badge: {
        position: "absolute",
        top: "-5px",
        right: "-5px",
        minWidth: "19px",
        height: "19px",
        padding: "0 5px",
        borderRadius: "999px",
        backgroundColor: "#dc2626",
        color: "#ffffff",
        fontSize: "10px",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        border: "2px solid #ffffff"
    },

    dropdown: {
        position: "absolute",
        top: "52px",
        right: 0,
        width: "380px",
        maxWidth: "calc(100vw - 30px)",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        boxShadow:
            "0 12px 35px rgba(0,0,0,0.15)",
        overflow: "hidden",
        zIndex: 1000
    },

    dropdownHeader: {
        padding: "16px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px"
    },

    dropdownTitle: {
        margin: 0,
        fontSize: "17px",
        color: "#111827"
    },

    dropdownSubtitle: {
        display: "block",
        marginTop: "3px",
        color: "#6b7280",
        fontSize: "12px"
    },

    markAllButton: {
        border: "none",
        backgroundColor: "transparent",
        color: "#2563eb",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap"
    },

    notificationList: {
        maxHeight: "430px",
        overflowY: "auto"
    },

    notificationItem: {
        width: "100%",
        border: "none",
        borderBottom: "1px solid #f0f0f0",
        backgroundColor: "#ffffff",
        padding: "14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
        textAlign: "left",
        cursor: "pointer",
        boxSizing: "border-box"
    },

    unreadItem: {
        backgroundColor: "#f8fafc"
    },

    notificationIcon: {
        width: "27px",
        minWidth: "27px",
        height: "27px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px"
    },

    notificationContent: {
        flex: 1,
        minWidth: 0
    },

    notificationTitleRow: {
        display: "flex",
        alignItems: "center",
        gap: "7px"
    },

    notificationTitle: {
        color: "#111827",
        fontSize: "13px"
    },

    unreadDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        backgroundColor: "#2563eb",
        display: "inline-block",
        flexShrink: 0
    },

    notificationMessage: {
        margin: "5px 0",
        color: "#4b5563",
        fontSize: "12px",
        lineHeight: "1.45"
    },

    notificationTime: {
        color: "#9ca3af",
        fontSize: "11px"
    },

    emptyMessage: {
        padding: "40px 20px",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "13px"
    },

    emptyIcon: {
        fontSize: "30px",
        marginBottom: "8px"
    },

    emptyText: {
        margin: "5px 0 0",
        color: "#9ca3af"
    },

    dropdownFooter: {
        padding: "12px",
        borderTop: "1px solid #e5e7eb"
    },

    viewAllButton: {
        width: "100%",
        border: "1px solid #d1d5db",
        backgroundColor: "#ffffff",
        padding: "9px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600",
        color: "#111827"
    }
};

export default NotificationBell;