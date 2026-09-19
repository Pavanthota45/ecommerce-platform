import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function Notifications() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        if (!token || !user || user.role !== "customer") {
            navigate("/login");
            return;
        }

        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications(response.data.notifications || []);
        } catch (err) {
            console.error("Load notifications error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load notifications."
            );
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            setProcessingId(notificationId);

            await axios.put(
                `${API_URL}/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((previousNotifications) =>
                previousNotifications.map((notification) =>
                    notification.id === notificationId
                        ? {
                              ...notification,
                              is_read: 1
                          }
                        : notification
                )
            );
        } catch (err) {
            console.error("Mark notification as read error:", err);

            alert(
                err.response?.data?.message ||
                "Unable to mark notification as read."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const markAllAsRead = async () => {
        try {
            setProcessingId("all");

            await axios.put(
                `${API_URL}/notifications/read-all`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((previousNotifications) =>
                previousNotifications.map((notification) => ({
                    ...notification,
                    is_read: 1
                }))
            );
        } catch (err) {
            console.error(
                "Mark all notifications as read error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Unable to mark all notifications as read."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const deleteNotification = async (notificationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this notification?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(notificationId);

            await axios.delete(
                `${API_URL}/notifications/${notificationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setNotifications((previousNotifications) =>
                previousNotifications.filter(
                    (notification) =>
                        notification.id !== notificationId
                )
            );
        } catch (err) {
            console.error(
                "Delete notification error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Unable to delete notification."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const getNotificationIcon = (title) => {
        const text = String(title || "").toLowerCase();

        if (text.includes("order")) {
            return "📦";
        }

        if (
            text.includes("payment") ||
            text.includes("upi") ||
            text.includes("transaction")
        ) {
            return "💳";
        }

        if (
            text.includes("delivery") ||
            text.includes("shipped")
        ) {
            return "🚚";
        }

        if (
            text.includes("return") ||
            text.includes("refund")
        ) {
            return "↩️";
        }

        if (
            text.includes("wishlist") ||
            text.includes("product")
        ) {
            return "🛍️";
        }

        if (
            text.includes("welcome") ||
            text.includes("account")
        ) {
            return "👋";
        }

        return "🔔";
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "Unknown time";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Unknown time";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const unreadCount = notifications.filter(
        (notification) =>
            Number(notification.is_read) === 0
    ).length;

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                fontFamily:
                    "Arial, Helvetica, sans-serif"
            }}
        >
            {/* HEADER */}
            <header
                style={{
                    background: "#ffffff",
                    borderBottom:
                        "1px solid #e5e7eb",
                    padding: "18px 30px",
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px"
                }}
            >
                <div>
                    <Link
                        to="/home"
                        style={{
                            textDecoration: "none",
                            color: "#111827",
                            fontSize: "24px",
                            fontWeight: "700"
                        }}
                    >
                        E-Commerce Store
                    </Link>
                </div>

                <nav
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap"
                    }}
                >
                    <Link
                        to="/home"
                        style={navLinkStyle}
                    >
                        Home
                    </Link>

                    <Link
                        to="/wishlist"
                        style={navLinkStyle}
                    >
                        Wishlist
                    </Link>

                    <Link
                        to="/cart"
                        style={navLinkStyle}
                    >
                        Cart
                    </Link>

                    <Link
                        to="/orders"
                        style={navLinkStyle}
                    >
                        Orders
                    </Link>

                    <Link
                        to="/profile"
                        style={navLinkStyle}
                    >
                        Profile
                    </Link>
                </nav>
            </header>

            {/* MAIN */}
            <main
                style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    padding: "35px 20px"
                }}
            >
                {/* PAGE HEADER */}
                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        padding: "25px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.06)"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap"
                        }}
                    >
                        <div>
                            <h1
                                style={{
                                    margin: "0 0 8px",
                                    fontSize: "30px",
                                    color: "#111827"
                                }}
                            >
                                🔔 Notifications
                            </h1>

                            <p
                                style={{
                                    margin: 0,
                                    color: "#6b7280",
                                    fontSize: "15px"
                                }}
                            >
                                {unreadCount > 0
                                    ? `You have ${unreadCount} unread notification${
                                          unreadCount === 1
                                              ? ""
                                              : "s"
                                      }.`
                                    : "You are all caught up."}
                            </p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap"
                            }}
                        >
                            {unreadCount > 0 && (
                                <button
                                    onClick={
                                        markAllAsRead
                                    }
                                    disabled={
                                        processingId ===
                                        "all"
                                    }
                                    style={{
                                        ...buttonStyle,
                                        background:
                                            "#2563eb",
                                        opacity:
                                            processingId ===
                                            "all"
                                                ? 0.6
                                                : 1
                                    }}
                                >
                                    {processingId ===
                                    "all"
                                        ? "Updating..."
                                        : "✓ Mark All as Read"}
                                </button>
                            )}

                            <button
                                onClick={
                                    loadNotifications
                                }
                                style={{
                                    ...buttonStyle,
                                    background:
                                        "#374151"
                                }}
                            >
                                ↻ Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div
                        style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            padding: "15px 18px",
                            borderRadius: "10px",
                            marginBottom: "20px",
                            border:
                                "1px solid #fecaca"
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* LOADING */}
                {loading ? (
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "14px",
                            padding: "60px 20px",
                            textAlign: "center",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.06)"
                        }}
                    >
                        <div
                            style={{
                                fontSize: "40px",
                                marginBottom: "15px"
                            }}
                        >
                            🔄
                        </div>

                        <p
                            style={{
                                margin: 0,
                                color: "#6b7280"
                            }}
                        >
                            Loading notifications...
                        </p>
                    </div>
                ) : notifications.length === 0 ? (
                    /* EMPTY STATE */
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "14px",
                            padding: "70px 20px",
                            textAlign: "center",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.06)"
                        }}
                    >
                        <div
                            style={{
                                fontSize: "65px",
                                marginBottom: "20px"
                            }}
                        >
                            🔔
                        </div>

                        <h2
                            style={{
                                margin: "0 0 10px",
                                color: "#111827"
                            }}
                        >
                            No Notifications
                        </h2>

                        <p
                            style={{
                                color: "#6b7280",
                                marginBottom: "25px"
                            }}
                        >
                            You don't have any
                            notifications yet.
                        </p>

                        <Link
                            to="/home"
                            style={{
                                display:
                                    "inline-block",
                                background:
                                    "#2563eb",
                                color: "#ffffff",
                                textDecoration:
                                    "none",
                                padding:
                                    "11px 22px",
                                borderRadius: "8px",
                                fontWeight: "600"
                            }}
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    /* NOTIFICATION LIST */
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        }}
                    >
                        {notifications.map(
                            (notification) => {
                                const isUnread =
                                    Number(
                                        notification.is_read
                                    ) === 0;

                                const isProcessing =
                                    processingId ===
                                    notification.id;

                                return (
                                    <div
                                        key={
                                            notification.id
                                        }
                                        style={{
                                            background:
                                                isUnread
                                                    ? "#eff6ff"
                                                    : "#ffffff",
                                            border:
                                                isUnread
                                                    ? "1px solid #bfdbfe"
                                                    : "1px solid #e5e7eb",
                                            borderRadius:
                                                "14px",
                                            padding:
                                                "20px",
                                            boxShadow:
                                                "0 2px 8px rgba(0,0,0,0.04)",
                                            transition:
                                                "0.2s"
                                        }}
                                    >
                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                gap: "15px",
                                                alignItems:
                                                    "flex-start"
                                            }}
                                        >
                                            {/* ICON */}
                                            <div
                                                style={{
                                                    width:
                                                        "52px",
                                                    height:
                                                        "52px",
                                                    minWidth:
                                                        "52px",
                                                    borderRadius:
                                                        "50%",
                                                    background:
                                                        isUnread
                                                            ? "#dbeafe"
                                                            : "#f3f4f6",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    fontSize:
                                                        "25px"
                                                }}
                                            >
                                                {getNotificationIcon(
                                                    notification.title
                                                )}
                                            </div>

                                            {/* CONTENT */}
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        gap:
                                                            "15px",
                                                        alignItems:
                                                            "flex-start",
                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                display:
                                                                    "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap:
                                                                    "8px",
                                                                flexWrap:
                                                                    "wrap"
                                                            }}
                                                        >
                                                            <h3
                                                                style={{
                                                                    margin:
                                                                        "0",
                                                                    color:
                                                                        "#111827",
                                                                    fontSize:
                                                                        "18px"
                                                                }}
                                                            >
                                                                {
                                                                    notification.title
                                                                }
                                                            </h3>

                                                            {isUnread && (
                                                                <span
                                                                    style={{
                                                                        background:
                                                                            "#2563eb",
                                                                        color:
                                                                            "#ffffff",
                                                                        fontSize:
                                                                            "11px",
                                                                        fontWeight:
                                                                            "700",
                                                                        padding:
                                                                            "4px 8px",
                                                                        borderRadius:
                                                                            "20px"
                                                                    }}
                                                                >
                                                                    NEW
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p
                                                            style={{
                                                                margin:
                                                                    "8px 0",
                                                                color:
                                                                    "#4b5563",
                                                                lineHeight:
                                                                    "1.6",
                                                                whiteSpace:
                                                                    "pre-wrap"
                                                            }}
                                                        >
                                                            {
                                                                notification.message
                                                            }
                                                        </p>

                                                        <div
                                                            style={{
                                                                color:
                                                                    "#9ca3af",
                                                                fontSize:
                                                                    "13px"
                                                            }}
                                                        >
                                                            🕒{" "}
                                                            {formatDate(
                                                                notification.created_at
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ACTIONS */}
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap:
                                                            "10px",
                                                        marginTop:
                                                            "15px",
                                                        flexWrap:
                                                            "wrap"
                                                    }}
                                                >
                                                    {isUnread && (
                                                        <button
                                                            onClick={() =>
                                                                markAsRead(
                                                                    notification.id
                                                                )
                                                            }
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            style={{
                                                                ...smallButtonStyle,
                                                                background:
                                                                    "#2563eb",
                                                                opacity:
                                                                    isProcessing
                                                                        ? 0.6
                                                                        : 1
                                                            }}
                                                        >
                                                            {isProcessing
                                                                ? "Updating..."
                                                                : "✓ Mark as Read"}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            deleteNotification(
                                                                notification.id
                                                            )
                                                        }
                                                        disabled={
                                                            isProcessing
                                                        }
                                                        style={{
                                                            ...smallButtonStyle,
                                                            background:
                                                                "#dc2626",
                                                            opacity:
                                                                isProcessing
                                                                    ? 0.6
                                                                    : 1
                                                        }}
                                                    >
                                                        🗑 Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

const navLinkStyle = {
    textDecoration: "none",
    color: "#374151",
    fontWeight: "600",
    padding: "8px 10px",
    borderRadius: "7px"
};

const buttonStyle = {
    border: "none",
    color: "#ffffff",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px"
};

const smallButtonStyle = {
    border: "none",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px"
};

export default Notifications;