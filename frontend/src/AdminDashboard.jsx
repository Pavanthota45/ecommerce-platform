import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function AdminDashboard() {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [adminName, setAdminName] = useState("Admin");

    // ======================================================
    // NOTIFICATIONS
    // ======================================================

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationLoading, setNotificationLoading] = useState(false);

    // ======================================================
    // LOAD DASHBOARD
    // ======================================================

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (!token) {
                navigate("/login");
                return;
            }

            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);

                    if (user?.role !== "admin") {
                        navigate("/");
                        return;
                    }

                    setAdminName(user.name || "Admin");
                } catch (parseError) {
                    console.error(
                        "User data parsing error:",
                        parseError
                    );
                }
            }

            const response = await axios.get(
                `${API_URL}/api/admin/analytics`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                setData(response.data);
            } else {
                setError(
                    response.data.message ||
                        "Unable to load dashboard."
                );
            }
        } catch (error) {
            console.error(
                "Dashboard loading error:",
                error
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                    "Unable to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // LOAD NOTIFICATIONS
    // ======================================================

    const loadNotifications = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            setNotificationLoading(true);

            const response = await axios.get(
                `${API_URL}/api/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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
        } finally {
            setNotificationLoading(false);
        }
    };

    // ======================================================
    // LOAD UNREAD COUNT
    // ======================================================

    const loadUnreadCount = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            const response = await axios.get(
                `${API_URL}/api/notifications/unread-count`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
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

    // ======================================================
    // MARK ONE NOTIFICATION AS READ
    // ======================================================

    const markNotificationAsRead = async (
        notificationId
    ) => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            await axios.put(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? {
                              ...notification,
                              is_read: 1,
                          }
                        : notification
                )
            );

            setUnreadCount((current) =>
                Math.max(current - 1, 0)
            );
        } catch (error) {
            console.error(
                "Mark notification as read error:",
                error
            );
        }
    };

    // ======================================================
    // MARK ALL NOTIFICATIONS AS READ
    // ======================================================

    const markAllNotificationsAsRead = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            await axios.put(
                `${API_URL}/api/notifications/read-all`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    is_read: 1,
                }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error(
                "Mark all notifications as read error:",
                error
            );
        }
    };

    // ======================================================
    // TOGGLE NOTIFICATION DROPDOWN
    // ======================================================

    const toggleNotifications = async () => {
        const nextState = !showNotifications;

        setShowNotifications(nextState);

        if (nextState) {
            await loadNotifications();
            await loadUnreadCount();
        }
    };

    // ======================================================
    // LOAD ON PAGE OPEN
    // ======================================================

    useEffect(() => {
        loadDashboard();
        loadNotifications();
        loadUnreadCount();
    }, []);

    // ======================================================
    // REFRESH NOTIFICATION COUNT
    // ======================================================

    useEffect(() => {
        const interval = setInterval(() => {
            loadUnreadCount();

            if (showNotifications) {
                loadNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [showNotifications]);

    // ======================================================
    // LOGOUT
    // ======================================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    // ======================================================
    // CURRENCY FORMAT
    // ======================================================

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2,
            }
        )}`;
    };

    // ======================================================
    // STATUS FORMAT
    // ======================================================

    const formatStatus = (status) => {
        if (!status) {
            return "-";
        }

        return status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (letter) => letter.toUpperCase()
            );
    };

    // ======================================================
    // DATE FORMAT
    // ======================================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // ======================================================
    // NOTIFICATION DATE FORMAT
    // ======================================================

    const formatNotificationDate = (date) => {
        if (!date) {
            return "";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#f4f7fb",
                    fontFamily:
                        "Arial, sans-serif",
                }}
            >
                <div
                    style={{
                        background: "#ffffff",
                        padding: "35px",
                        borderRadius: "14px",
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,0.08)",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            color: "#111827",
                        }}
                    >
                        Loading admin dashboard...
                    </h2>
                </div>
            </div>
        );
    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "30px",
                    background: "#f4f7fb",
                    fontFamily:
                        "Arial, sans-serif",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "600px",
                        padding: "30px",
                        borderRadius: "14px",
                        border:
                            "1px solid #fecaca",
                        background: "#fef2f2",
                        textAlign: "center",
                    }}
                >
                    <h2
                        style={{
                            color: "#991b1b",
                        }}
                    >
                        Dashboard Error
                    </h2>

                    <p
                        style={{
                            color: "#7f1d1d",
                            lineHeight: "1.6",
                        }}
                    >
                        {error}
                    </p>

                    <button
                        onClick={loadDashboard}
                        style={{
                            padding: "11px 20px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            background: "#2563eb",
                            color: "#ffffff",
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const summary = data.summary || {};

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f4f7fb",
                fontFamily:
                    "Arial, Helvetica, sans-serif",
                color: "#111827",
            }}
        >
            {/* ==================================================
                NAVBAR
            ================================================== */}

            <header
                style={{
                    background: "#ffffff",
                    borderBottom:
                        "1px solid #e5e7eb",
                    padding: "16px 30px",
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "24px",
                            color: "#111827",
                        }}
                    >
                        Admin Panel
                    </h1>

                    <p
                        style={{
                            margin: "5px 0 0",
                            color: "#6b7280",
                        }}
                    >
                        Welcome, {adminName}
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        position: "relative",
                    }}
                >
                    {/* ==================================================
                        NOTIFICATION BELL
                    ================================================== */}

                    <button
                        onClick={toggleNotifications}
                        style={{
                            position: "relative",
                            width: "46px",
                            height: "46px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            background: "#ffffff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            boxShadow:
                                "0 2px 6px rgba(0,0,0,0.05)",
                        }}
                        title="Notifications"
                    >
                        🔔

                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: "absolute",
                                    top: "-5px",
                                    right: "-5px",
                                    minWidth: "20px",
                                    height: "20px",
                                    padding: "0 5px",
                                    borderRadius: "999px",
                                    background: "#dc2626",
                                    color: "#ffffff",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border:
                                        "2px solid #ffffff",
                                }}
                            >
                                {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* ==================================================
                        NOTIFICATION DROPDOWN
                    ================================================== */}

                    {showNotifications && (
                        <div
                            style={{
                                position: "absolute",
                                top: "56px",
                                right: "90px",
                                width: "390px",
                                maxWidth:
                                    "calc(100vw - 40px)",
                                background: "#ffffff",
                                border:
                                    "1px solid #e5e7eb",
                                borderRadius: "12px",
                                boxShadow:
                                    "0 12px 35px rgba(0,0,0,0.15)",
                                overflow: "hidden",
                                zIndex: 1000,
                            }}
                        >
                            <div
                                style={{
                                    padding:
                                        "15px 16px",
                                    borderBottom:
                                        "1px solid #e5e7eb",
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <div>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize:
                                                "17px",
                                            color:
                                                "#111827",
                                        }}
                                    >
                                        Notifications
                                    </h3>

                                    {unreadCount >
                                        0 && (
                                        <small
                                            style={{
                                                color:
                                                    "#6b7280",
                                            }}
                                        >
                                            {
                                                unreadCount
                                            }{" "}
                                            unread
                                        </small>
                                    )}
                                </div>

                                {unreadCount >
                                    0 && (
                                    <button
                                        onClick={
                                            markAllNotificationsAsRead
                                        }
                                        style={{
                                            border:
                                                "none",
                                            background:
                                                "transparent",
                                            color:
                                                "#2563eb",
                                            cursor:
                                                "pointer",
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                "600",
                                        }}
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div
                                style={{
                                    maxHeight:
                                        "430px",
                                    overflowY:
                                        "auto",
                                }}
                            >
                                {notificationLoading ? (
                                    <div
                                        style={{
                                            padding:
                                                "30px 20px",
                                            textAlign:
                                                "center",
                                            color:
                                                "#6b7280",
                                        }}
                                    >
                                        Loading notifications...
                                    </div>
                                ) : notifications.length ===
                                  0 ? (
                                    <div
                                        style={{
                                            padding:
                                                "35px 20px",
                                            textAlign:
                                                "center",
                                            color:
                                                "#6b7280",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize:
                                                    "30px",
                                                marginBottom:
                                                    "10px",
                                            }}
                                        >
                                            🔔
                                        </div>

                                        <div
                                            style={{
                                                fontWeight:
                                                    "600",
                                                color:
                                                    "#374151",
                                            }}
                                        >
                                            No notifications
                                        </div>

                                        <div
                                            style={{
                                                fontSize:
                                                    "12px",
                                                marginTop:
                                                    "5px",
                                            }}
                                        >
                                            You're all
                                            caught up.
                                        </div>
                                    </div>
                                ) : (
                                    notifications.map(
                                        (
                                            notification
                                        ) => (
                                            <div
                                                key={
                                                    notification.id
                                                }
                                                onClick={() => {
                                                    if (
                                                        Number(
                                                            notification.is_read
                                                        ) ===
                                                        0
                                                    ) {
                                                        markNotificationAsRead(
                                                            notification.id
                                                        );
                                                    }
                                                }}
                                                style={{
                                                    padding:
                                                        "14px 16px",
                                                    borderBottom:
                                                        "1px solid #f0f0f0",
                                                    background:
                                                        Number(
                                                            notification.is_read
                                                        ) ===
                                                        0
                                                            ? "#eff6ff"
                                                            : "#ffffff",
                                                    cursor:
                                                        Number(
                                                            notification.is_read
                                                        ) ===
                                                        0
                                                            ? "pointer"
                                                            : "default",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        gap:
                                                            "10px",
                                                    }}
                                                >
                                                    <strong
                                                        style={{
                                                            fontSize:
                                                                "14px",
                                                            color:
                                                                "#111827",
                                                        }}
                                                    >
                                                        {
                                                            notification.title
                                                        }
                                                    </strong>

                                                    {Number(
                                                        notification.is_read
                                                    ) ===
                                                        0 && (
                                                        <span
                                                            style={{
                                                                width:
                                                                    "8px",
                                                                height:
                                                                    "8px",
                                                                minWidth:
                                                                    "8px",
                                                                borderRadius:
                                                                    "50%",
                                                                background:
                                                                    "#2563eb",
                                                                marginTop:
                                                                    "5px",
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                <p
                                                    style={{
                                                        margin:
                                                            "6px 0",
                                                        color:
                                                            "#4b5563",
                                                        fontSize:
                                                            "13px",
                                                        lineHeight:
                                                            "1.5",
                                                    }}
                                                >
                                                    {
                                                        notification.message
                                                    }
                                                </p>

                                                <small
                                                    style={{
                                                        color:
                                                            "#9ca3af",
                                                        fontSize:
                                                            "11px",
                                                    }}
                                                >
                                                    {formatNotificationDate(
                                                        notification.created_at
                                                    )}
                                                </small>
                                            </div>
                                        )
                                    )
                                )}
                            </div>

                            <div
                                style={{
                                    borderTop:
                                        "1px solid #e5e7eb",
                                    padding: "10px 16px",
                                    textAlign:
                                        "center",
                                }}
                            >
                                <Link
                                    to="/notifications"
                                    onClick={() =>
                                        setShowNotifications(
                                            false
                                        )
                                    }
                                    style={{
                                        color:
                                            "#2563eb",
                                        textDecoration:
                                            "none",
                                        fontWeight:
                                            "600",
                                        fontSize:
                                            "13px",
                                    }}
                                >
                                    View All Notifications →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ==================================================
                        LOGOUT
                    ================================================== */}

                    <button
                        onClick={handleLogout}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "10px 18px",
                            backgroundColor:
                                "#dc2626",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            boxShadow:
                                "0 2px 6px rgba(0, 0, 0, 0.15)",
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* ==================================================
                MAIN CONTENT
            ================================================== */}

            <main
                style={{
                    padding: "30px",
                    maxWidth: "1500px",
                    margin: "0 auto",
                }}
            >
                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        gap: "20px",
                        flexWrap: "wrap",
                        marginBottom: "30px",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "30px",
                                color: "#111827",
                            }}
                        >
                            Dashboard
                        </h2>

                        <p
                            style={{
                                color: "#6b7280",
                                marginTop: "8px",
                            }}
                        >
                            Overview of your
                            e-commerce store.
                        </p>
                    </div>

                    <Link
                        to="/admin/analytics"
                        style={{
                            padding: "12px 20px",
                            borderRadius: "8px",
                            background: "#2563eb",
                            color: "#ffffff",
                            textDecoration: "none",
                            fontWeight: "600",
                            boxShadow:
                                "0 2px 6px rgba(37,99,235,0.2)",
                        }}
                    >
                        View Full Analytics
                    </Link>
                </div>

                {/* ==================================================
                    SUMMARY CARDS
                ================================================== */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(210px, 1fr))",
                        gap: "20px",
                        marginBottom: "30px",
                    }}
                >
                    <SummaryCard
                        title="Total Sales"
                        value={formatCurrency(
                            summary.total_sales
                        )}
                    />

                    <SummaryCard
                        title="Total Orders"
                        value={
                            summary.total_orders ||
                            0
                        }
                    />

                    <SummaryCard
                        title="Customers"
                        value={
                            summary.total_customers ||
                            0
                        }
                    />

                    <SummaryCard
                        title="Active Products"
                        value={
                            summary.total_products ||
                            0
                        }
                    />

                    <SummaryCard
                        title="Today's Sales"
                        value={formatCurrency(
                            summary.sales_today
                        )}
                        subtitle={`${summary.orders_today || 0} orders today`}
                    />

                    <SummaryCard
                        title="This Month"
                        value={formatCurrency(
                            summary.sales_this_month
                        )}
                        subtitle={`${summary.orders_this_month || 0} orders this month`}
                    />
                </div>

                {/* ==================================================
                    QUICK ACTIONS
                ================================================== */}

                <section
                    style={{
                        background: "#ffffff",
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "25px",
                        marginBottom: "30px",
                        boxShadow:
                            "0 3px 12px rgba(0,0,0,0.04)",
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                            color: "#111827",
                        }}
                    >
                        Management
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(190px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <AdminLink
                            to="/admin/categories"
                            text="📁 Categories"
                        />

                        <AdminLink
                            to="/admin/products"
                            text="🛍️ Products"
                        />

                        <AdminLink
                            to="/admin/orders"
                            text="📦 Orders"
                        />

                        <AdminLink
                            to="/admin/inventory"
                            text="📊 Inventory"
                        />

                        <AdminLink
                            to="/admin/customers"
                            text="👥 Customers"
                        />

                        <AdminLink
                            to="/admin/coupons"
                            text="🏷️ Coupons"
                        />

                        <AdminLink
                            to="/admin/reviews"
                            text="⭐ Reviews"
                        />

                        <AdminLink
                            to="/admin/analytics"
                            text="📈 Sales Analytics"
                        />

                        <AdminLink
                            to="/admin/payment-settings"
                            text="💳 Payment Settings"
                        />

                        <AdminLink
                            to="/admin/payment-verification"
                            text="🔐 Payment Verification"
                        />
                    </div>
                </section>

                {/* ==================================================
                    PAYMENT SETTINGS INFORMATION
                ================================================== */}

                <section
                    style={{
                        background: "#ffffff",
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "25px",
                        marginBottom: "30px",
                        boxShadow:
                            "0 3px 12px rgba(0,0,0,0.04)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                            }}
                        >
                            <h2
                                style={{
                                    margin:
                                        "0 0 8px",
                                    color: "#111827",
                                }}
                            >
                                💳 Payment Configuration
                            </h2>

                            <p
                                style={{
                                    margin: 0,
                                    color: "#6b7280",
                                    lineHeight: "1.6",
                                }}
                            >
                                Configure COD, UPI ID,
                                dynamic QR payments
                                and bank transfer
                                details that customers
                                will see during
                                checkout.
                            </p>
                        </div>

                        <Link
                            to="/admin/payment-settings"
                            style={{
                                padding:
                                    "12px 20px",
                                borderRadius:
                                    "8px",
                                background:
                                    "#2563eb",
                                color:
                                    "#ffffff",
                                textDecoration:
                                    "none",
                                fontWeight:
                                    "600",
                                whiteSpace:
                                    "nowrap",
                                boxShadow:
                                    "0 2px 6px rgba(37,99,235,0.2)",
                            }}
                        >
                            Open Payment Settings
                        </Link>
                    </div>
                </section>

                {/* ==================================================
                    PAYMENT VERIFICATION INFORMATION
                ================================================== */}

                <section
                    style={{
                        background: "#ffffff",
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "25px",
                        marginBottom: "30px",
                        boxShadow:
                            "0 3px 12px rgba(0,0,0,0.04)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            gap: "20px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                            }}
                        >
                            <h2
                                style={{
                                    margin:
                                        "0 0 8px",
                                    color: "#111827",
                                }}
                            >
                                🔐 Manual Payment Verification
                            </h2>

                            <p
                                style={{
                                    margin: 0,
                                    color: "#6b7280",
                                    lineHeight: "1.6",
                                }}
                            >
                                Review customer UPI,
                                QR and bank-transfer
                                payments. Verify the
                                payment screenshot and
                                extracted transaction or
                                UTR ID before approving
                                the payment.
                            </p>
                        </div>

                        <Link
                            to="/admin/payment-verification"
                            style={{
                                padding:
                                    "12px 20px",
                                borderRadius:
                                    "8px",
                                background:
                                    "#111827",
                                color:
                                    "#ffffff",
                                textDecoration:
                                    "none",
                                fontWeight:
                                    "600",
                                whiteSpace:
                                    "nowrap",
                            }}
                        >
                            Open Payment Verification
                        </Link>
                    </div>
                </section>

                {/* ==================================================
                    ORDERS BY STATUS
                ================================================== */}

                <section
                    style={{
                        background: "#ffffff",
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "25px",
                        marginBottom: "30px",
                        overflowX: "auto",
                        boxShadow:
                            "0 3px 12px rgba(0,0,0,0.04)",
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                        }}
                    >
                        Order Status
                    </h2>

                    {data.orders_by_status
                        ?.length === 0 ? (
                        <p
                            style={{
                                color: "#6b7280",
                            }}
                        >
                            No orders available.
                        </p>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                gap: "15px",
                                flexWrap: "wrap",
                            }}
                        >
                            {data.orders_by_status.map(
                                (item) => (
                                    <div
                                        key={
                                            item.status
                                        }
                                        style={{
                                            padding:
                                                "16px 20px",
                                            border:
                                                "1px solid #e5e7eb",
                                            borderRadius:
                                                "10px",
                                            minWidth:
                                                "150px",
                                            background:
                                                "#f9fafb",
                                        }}
                                    >
                                        <div
                                            style={{
                                                color:
                                                    "#6b7280",
                                                fontSize:
                                                    "13px",
                                            }}
                                        >
                                            {formatStatus(
                                                item.status
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                fontSize:
                                                    "25px",
                                                fontWeight:
                                                    "700",
                                                marginTop:
                                                    "5px",
                                                color:
                                                    "#111827",
                                            }}
                                        >
                                            {
                                                item.count
                                            }
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>

                {/* ==================================================
                    LOW STOCK
                ================================================== */}

                <section
                    style={{
                        background: "#ffffff",
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "25px",
                        marginBottom: "30px",
                        overflowX: "auto",
                        boxShadow:
                            "0 3px 12px rgba(0,0,0,0.04)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                            gap: "15px",
                            flexWrap: "wrap",
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                            }}
                        >
                            Low Stock
                        </h2>

                        <Link
                            to="/admin/inventory"
                            style={{
                                textDecoration:
                                    "none",
                                fontWeight:
                                    "600",
                                color:
                                    "#2563eb",
                            }}
                        >
                            Manage Inventory →
                        </Link>
                    </div>

                    {data.low_stock
                        ?.length === 0 ? (
                        <p
                            style={{
                                color: "#6b7280",
                            }}
                        >
                            No low-stock products.
                        </p>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse:
                                    "collapse",
                                minWidth:
                                    "650px",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Product
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        SKU
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Stock
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Reserved
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Available
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.low_stock.map(
                                    (product) => {
                                        const available =
                                            product.available_quantity ??
                                            product.available_stock ??
                                            Math.max(
                                                Number(
                                                    product.stock_quantity ||
                                                        0
                                                ) -
                                                    Number(
                                                        product.reserved_quantity ||
                                                            0
                                                    ),
                                                0
                                            );

                                        return (
                                            <tr
                                                key={
                                                    product.product_id ||
                                                    product.id
                                                }
                                            >
                                                <td
                                                    style={
                                                        tableCell
                                                    }
                                                >
                                                    {
                                                        product.name
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        tableCell
                                                    }
                                                >
                                                    {
                                                        product.sku
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        tableCell
                                                    }
                                                >
                                                    {
                                                        product.stock_quantity
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        tableCell
                                                    }
                                                >
                                                    {
                                                        product.reserved_quantity
                                                    }
                                                </td>

                                                <td
                                                    style={{
                                                        ...tableCell,
                                                        fontWeight:
                                                            "700",
                                                        color:
                                                            Number(
                                                                available
                                                            ) <=
                                                            2
                                                                ? "#dc2626"
                                                                : "#d97706",
                                                    }}
                                                >
                                                    {
                                                        available
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>
                        </table>
                    )}
                </section>

                {/* ==================================================
                    RECENT ORDERS
                ================================================== */}

                <section
                    style={{
                        background: "#ffffff",
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "14px",
                        padding: "25px",
                        overflowX: "auto",
                        boxShadow:
                            "0 3px 12px rgba(0,0,0,0.04)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                            gap: "15px",
                            flexWrap: "wrap",
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                            }}
                        >
                            Recent Orders
                        </h2>

                        <Link
                            to="/admin/orders"
                            style={{
                                textDecoration:
                                    "none",
                                fontWeight:
                                    "600",
                                color:
                                    "#2563eb",
                            }}
                        >
                            View All Orders →
                        </Link>
                    </div>

                    {data.recent_orders
                        ?.length === 0 ? (
                        <p
                            style={{
                                color: "#6b7280",
                            }}
                        >
                            No orders available.
                        </p>
                    ) : (
                        <table
                            style={{
                                width: "100%",
                                borderCollapse:
                                    "collapse",
                                minWidth:
                                    "850px",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Order
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Customer
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Amount
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Status
                                    </th>

                                    <th
                                        style={
                                            tableHeader
                                        }
                                    >
                                        Date
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.recent_orders.map(
                                    (order) => (
                                        <tr
                                            key={
                                                order.id
                                            }
                                        >
                                            <td
                                                style={
                                                    tableCell
                                                }
                                            >
                                                <Link
                                                    to={`/admin/orders/${order.id}`}
                                                    style={{
                                                        textDecoration:
                                                            "none",
                                                        fontWeight:
                                                            "600",
                                                        color:
                                                            "#2563eb",
                                                    }}
                                                >
                                                    #{order.id}
                                                </Link>
                                            </td>

                                            <td
                                                style={
                                                    tableCell
                                                }
                                            >
                                                {
                                                    order.customer_name
                                                }
                                            </td>

                                            <td
                                                style={
                                                    tableCell
                                                }
                                            >
                                                {formatCurrency(
                                                    order.total_amount
                                                )}
                                            </td>

                                            <td
                                                style={
                                                    tableCell
                                                }
                                            >
                                                <span
                                                    style={{
                                                        display:
                                                            "inline-block",
                                                        padding:
                                                            "5px 9px",
                                                        borderRadius:
                                                            "6px",
                                                        background:
                                                            "#eff6ff",
                                                        color:
                                                            "#1d4ed8",
                                                        fontWeight:
                                                            "600",
                                                        fontSize:
                                                            "12px",
                                                    }}
                                                >
                                                    {formatStatus(
                                                        order.status
                                                    )}
                                                </span>
                                            </td>

                                            <td
                                                style={
                                                    tableCell
                                                }
                                            >
                                                {formatDate(
                                                    order.created_at
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </div>
    );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
    title,
    value,
    subtitle,
}) {
    return (
        <div
            style={{
                background: "#ffffff",
                border:
                    "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "22px",
                boxShadow:
                    "0 2px 8px rgba(0,0,0,0.04)",
            }}
        >
            <p
                style={{
                    margin: 0,
                    color: "#6b7280",
                    fontSize: "14px",
                }}
            >
                {title}
            </p>

            <h2
                style={{
                    margin: "10px 0 5px",
                    fontSize: "27px",
                    color: "#111827",
                }}
            >
                {value}
            </h2>

            {subtitle && (
                <small
                    style={{
                        color: "#6b7280",
                    }}
                >
                    {subtitle}
                </small>
            )}
        </div>
    );
}

// ======================================================
// ADMIN LINK
// ======================================================

function AdminLink({
    to,
    text,
}) {
    return (
        <Link
            to={to}
            style={{
                padding: "17px 16px",
                border:
                    "1px solid #dbe3ef",
                borderRadius: "10px",
                textDecoration: "none",
                color: "#111827",
                fontWeight: "700",
                textAlign: "center",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "22px",
                transition:
                    "all 0.2s ease",
                boxShadow:
                    "0 2px 6px rgba(0,0,0,0.04)",
            }}
        >
            {text}
        </Link>
    );
}

// ======================================================
// TABLE STYLES
// ======================================================

const tableHeader = {
    textAlign: "left",
    padding: "13px",
    borderBottom:
        "2px solid #e5e7eb",
    fontSize: "14px",
    color: "#374151",
    background: "#f9fafb",
};

const tableCell = {
    padding: "13px",
    borderBottom:
        "1px solid #eeeeee",
    fontSize: "14px",
    color: "#374151",
};

// ======================================================
// EXPORT
// ======================================================

export default AdminDashboard;