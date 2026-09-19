import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

const ORDER_STATUSES = [
    "PLACED",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED"
];

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const formatDate = (date) => {
    if (!date) {
        return "-";
    }

    return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

const formatStatus = (status) => {
    if (!status) {
        return "-";
    }

    return status.replace(/_/g, " ");
};

const getStatusStyle = (status) => {
    switch (status) {
        case "PLACED":
            return {
                background: "#dbeafe",
                color: "#1d4ed8"
            };

        case "CONFIRMED":
            return {
                background: "#e0e7ff",
                color: "#4338ca"
            };

        case "PACKED":
            return {
                background: "#fef3c7",
                color: "#92400e"
            };

        case "SHIPPED":
            return {
                background: "#cffafe",
                color: "#155e75"
            };

        case "OUT_FOR_DELIVERY":
            return {
                background: "#ede9fe",
                color: "#6d28d9"
            };

        case "DELIVERED":
            return {
                background: "#dcfce7",
                color: "#166534"
            };

        case "CANCELLED":
            return {
                background: "#fee2e2",
                color: "#991b1b"
            };

        case "RETURN_REQUESTED":
            return {
                background: "#ffedd5",
                color: "#9a3412"
            };

        case "RETURNED":
            return {
                background: "#fce7f3",
                color: "#9d174d"
            };

        case "REFUNDED":
            return {
                background: "#e0e7ff",
                color: "#3730a3"
            };

        default:
            return {
                background: "#f3f4f6",
                color: "#374151"
            };
    }
};

const getPaymentStyle = (status) => {
    switch (status) {
        case "SUCCESS":
            return {
                background: "#dcfce7",
                color: "#166534"
            };

        case "FAILED":
            return {
                background: "#fee2e2",
                color: "#991b1b"
            };

        case "REFUNDED":
            return {
                background: "#e0e7ff",
                color: "#3730a3"
            };

        case "PENDING":
            return {
                background: "#fef3c7",
                color: "#92400e"
            };

        default:
            return {
                background: "#f3f4f6",
                color: "#374151"
            };
    }
};

function AdminOrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [selectedStatus, setSelectedStatus] = useState("");

    // ======================================================
    // CHECK ADMIN
    // ======================================================

    useEffect(() => {
        const userData = localStorage.getItem("user");

        if (!userData) {
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(userData);

            if (user.role !== "admin") {
                navigate("/");
            }
        } catch (error) {
            console.error("User data error:", error);
            navigate("/login");
        }
    }, [navigate]);

    // ======================================================
    // LOAD ORDER
    // ======================================================

    const loadOrder = async () => {
        try {
            setLoading(true);
            setError("");

            if (!id) {
                setError(
                    "Order ID is missing from the URL."
                );
                setOrder(null);
                return;
            }

            const numericId = Number(id);

            if (
                !Number.isInteger(numericId) ||
                numericId <= 0
            ) {
                setError(
                    "Invalid order ID."
                );
                setOrder(null);
                return;
            }

            console.log(
                "Loading admin order:",
                numericId
            );

            const response = await axios.get(
                `${API_URL}/api/admin/orders/${numericId}`,
                getAuthHeaders()
            );

            console.log(
                "Admin order response:",
                response.data
            );

            if (
                response.data.success &&
                response.data.order
            ) {
                const loadedOrder =
                    response.data.order;

                setOrder(loadedOrder);

                setSelectedStatus(
                    loadedOrder.status || ""
                );
            } else {
                setOrder(null);

                setError(
                    response.data.message ||
                    "Unable to load order."
                );
            }
        } catch (error) {
            console.error(
                "Load admin order details error:",
                error
            );

            setOrder(null);

            setError(
                error.response?.data?.message ||
                "Unable to load order details."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrder();
    }, [id]);

    // ======================================================
    // UPDATE STATUS
    // ======================================================

    const handleUpdateStatus = async () => {
        if (!order) {
            return;
        }

        if (!selectedStatus) {
            setError(
                "Please select an order status."
            );
            return;
        }

        if (
            selectedStatus ===
            order.status
        ) {
            setError(
                "The order already has this status."
            );
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to change Order #${order.id} from "${formatStatus(
                order.status
            )}" to "${formatStatus(
                selectedStatus
            )}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setUpdating(true);
            setError("");
            setSuccessMessage("");

            const response = await axios.put(
                `${API_URL}/api/admin/orders/${order.id}/status`,
                {
                    status: selectedStatus
                },
                getAuthHeaders()
            );

            if (response.data.success) {
                setSuccessMessage(
                    `Order #${order.id} status changed to ${formatStatus(
                        selectedStatus
                    )}.`
                );

                await loadOrder();
            } else {
                setError(
                    response.data.message ||
                    "Unable to update order status."
                );
            }
        } catch (error) {
            console.error(
                "Update order status error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to update order status."
            );
        } finally {
            setUpdating(false);
        }
    };

    // ======================================================
    // CANCEL ORDER
    // ======================================================

    const handleCancelOrder = async () => {
        if (!order) {
            return;
        }

        if (
            [
                "CANCELLED",
                "DELIVERED",
                "RETURNED",
                "REFUNDED"
            ].includes(order.status)
        ) {
            setError(
                "This order cannot be cancelled from its current status."
            );
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to cancel Order #${order.id}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setUpdating(true);
            setError("");
            setSuccessMessage("");

            const response = await axios.put(
                `${API_URL}/api/admin/orders/${order.id}/status`,
                {
                    status: "CANCELLED"
                },
                getAuthHeaders()
            );

            if (response.data.success) {
                setSuccessMessage(
                    `Order #${order.id} has been cancelled.`
                );

                await loadOrder();
            } else {
                setError(
                    response.data.message ||
                    "Unable to cancel order."
                );
            }
        } catch (error) {
            console.error(
                "Cancel order error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to cancel order."
            );
        } finally {
            setUpdating(false);
        }
    };

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.loadingBox}>
                    <div style={styles.spinner}></div>

                    <h2>
                        Loading Order...
                    </h2>

                    <p>
                        Loading details for Order #{id || "-"}
                    </p>
                </div>
            </div>
        );
    }

    // ======================================================
    // ORDER NOT FOUND
    // ======================================================

    if (!order) {
        return (
            <div style={styles.page}>
                <div style={styles.errorCard}>

                    <h2>
                        Order Details Unavailable
                    </h2>

                    <p>
                        {error ||
                            `Order #${id || "-"} could not be found.`}
                    </p>

                    <div style={styles.errorActions}>

                        <button
                            onClick={loadOrder}
                            style={styles.retryButton}
                        >
                            ↻ Try Again
                        </button>

                        <Link
                            to="/admin/orders"
                            style={styles.backButton}
                        >
                            ← Back to Orders
                        </Link>

                    </div>

                </div>
            </div>
        );
    }

    // ======================================================
    // ORDER DATA
    // ======================================================

    const customer = {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone
    };

    const address =
        order.address || {};

    const payment =
        order.payment || {};

    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    const itemsTotal = items.reduce(
        (total, item) =>
            total +
            Number(item.price || 0) *
            Number(item.quantity || 0),
        0
    );

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div style={styles.page}>

            {/* HEADER */}

            <header style={styles.header}>

                <div>

                    <Link
                        to="/admin/orders"
                        style={styles.backLink}
                    >
                        ← Back to Orders
                    </Link>

                    <h1 style={styles.title}>
                        Order #{order.id}
                    </h1>

                    <p style={styles.subtitle}>
                        Placed on{" "}
                        {formatDate(
                            order.created_at
                        )}
                    </p>

                </div>

                <button
                    onClick={loadOrder}
                    style={styles.refreshButton}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>

            </header>

            {/* MESSAGES */}

            {error && (
                <div style={styles.error}>
                    <strong>
                        Error:
                    </strong>{" "}
                    {error}
                </div>
            )}

            {successMessage && (
                <div style={styles.success}>
                    <strong>
                        Success:
                    </strong>{" "}
                    {successMessage}
                </div>
            )}

            {/* TOP GRID */}

            <section style={styles.topGrid}>

                {/* STATUS */}

                <div style={styles.card}>

                    <h2 style={styles.cardTitle}>
                        Order Status
                    </h2>

                    <div style={styles.currentStatus}>

                        <span
                            style={{
                                ...styles.statusBadge,
                                ...getStatusStyle(
                                    order.status
                                )
                            }}
                        >
                            {formatStatus(
                                order.status
                            )}
                        </span>

                    </div>

                    <div style={styles.statusControl}>

                        <label
                            style={styles.label}
                        >
                            Change Status
                        </label>

                        <select
                            value={
                                selectedStatus
                            }
                            onChange={(event) =>
                                setSelectedStatus(
                                    event.target.value
                                )
                            }
                            disabled={updating}
                            style={
                                styles.statusSelect
                            }
                        >
                            {ORDER_STATUSES.map(
                                (status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {formatStatus(
                                            status
                                        )}
                                    </option>
                                )
                            )}
                        </select>

                        <button
                            onClick={
                                handleUpdateStatus
                            }
                            disabled={
                                updating ||
                                selectedStatus ===
                                order.status
                            }
                            style={
                                updating ||
                                selectedStatus ===
                                order.status
                                    ? styles.disabledButton
                                    : styles.updateButton
                            }
                        >
                            {updating
                                ? "Updating..."
                                : "Update Status"}
                        </button>

                    </div>

                    {![
                        "CANCELLED",
                        "DELIVERED",
                        "RETURNED",
                        "REFUNDED"
                    ].includes(order.status) && (
                        <button
                            onClick={
                                handleCancelOrder
                            }
                            disabled={updating}
                            style={
                                styles.cancelButton
                            }
                        >
                            ❌ Cancel Order
                        </button>
                    )}

                </div>

                {/* SUMMARY */}

                <div style={styles.card}>

                    <h2 style={styles.cardTitle}>
                        Order Summary
                    </h2>

                    <div style={styles.summaryRow}>
                        <span>
                            Order ID
                        </span>

                        <strong>
                            #{order.id}
                        </strong>
                    </div>

                    <div style={styles.summaryRow}>
                        <span>
                            Order Date
                        </span>

                        <strong>
                            {formatDate(
                                order.created_at
                            )}
                        </strong>
                    </div>

                    <div style={styles.summaryRow}>
                        <span>
                            Items
                        </span>

                        <strong>
                            {items.length}
                        </strong>
                    </div>

                    <div style={styles.summaryRow}>
                        <span>
                            Product Total
                        </span>

                        <strong>
                            {formatCurrency(
                                itemsTotal
                            )}
                        </strong>
                    </div>

                    <div style={styles.summaryRow}>
                        <span>
                            Subtotal
                        </span>

                        <strong>
                            {formatCurrency(
                                order.subtotal
                            )}
                        </strong>
                    </div>

                    <div style={styles.summaryRow}>
                        <span>
                            Discount
                        </span>

                        <strong
                            style={
                                Number(
                                    order.discount
                                ) > 0
                                    ? styles.discount
                                    : {}
                            }
                        >
                            -
                            {formatCurrency(
                                order.discount
                            )}
                        </strong>
                    </div>

                    <div style={styles.summaryRow}>
                        <span>
                            Delivery Fee
                        </span>

                        <strong>
                            {formatCurrency(
                                order.delivery_fee
                            )}
                        </strong>
                    </div>

                    <div style={styles.totalRow}>
                        <span>
                            Total Amount
                        </span>

                        <strong>
                            {formatCurrency(
                                order.total_amount
                            )}
                        </strong>
                    </div>

                </div>

            </section>

            {/* CUSTOMER + ADDRESS */}

            <section style={styles.twoColumn}>

                <div style={styles.card}>

                    <h2 style={styles.cardTitle}>
                        👤 Customer Information
                    </h2>

                    <div style={styles.infoGroup}>
                        <span style={styles.infoLabel}>
                            Name
                        </span>

                        <strong>
                            {customer.name || "-"}
                        </strong>
                    </div>

                    <div style={styles.infoGroup}>
                        <span style={styles.infoLabel}>
                            Email
                        </span>

                        <span>
                            {customer.email || "-"}
                        </span>
                    </div>

                    <div style={styles.infoGroup}>
                        <span style={styles.infoLabel}>
                            Phone
                        </span>

                        <span>
                            {customer.phone || "-"}
                        </span>
                    </div>

                    <div style={styles.infoGroup}>
                        <span style={styles.infoLabel}>
                            User ID
                        </span>

                        <span>
                            {order.user_id || "-"}
                        </span>
                    </div>

                </div>

                <div style={styles.card}>

                    <h2 style={styles.cardTitle}>
                        📍 Delivery Address
                    </h2>

                    <div style={styles.addressBox}>

                        <strong>
                            {address.full_name || "-"}
                        </strong>

                        <p>
                            {address.address_line1 || ""}
                        </p>

                        {address.address_line2 && (
                            <p>
                                {address.address_line2}
                            </p>
                        )}

                        <p>
                            {address.city || ""}
                            {address.city &&
                                address.state
                                ? ", "
                                : ""}
                            {address.state || ""}
                        </p>

                        <p>
                            {address.postal_code || ""}
                            {address.country
                                ? `, ${address.country}`
                                : ""}
                        </p>

                        <p>
                            <strong>
                                Phone:
                            </strong>{" "}
                            {address.phone || "-"}
                        </p>

                    </div>

                </div>

            </section>

            {/* PAYMENT */}

            <section style={styles.card}>

                <h2 style={styles.cardTitle}>
                    💳 Payment Information
                </h2>

                <div style={styles.paymentGrid}>

                    <div style={styles.paymentItem}>
                        <span style={styles.infoLabel}>
                            Payment Method
                        </span>

                        <strong>
                            {payment.method || "-"}
                        </strong>
                    </div>

                    <div style={styles.paymentItem}>
                        <span style={styles.infoLabel}>
                            Payment Status
                        </span>

                        <span
                            style={{
                                ...styles.paymentBadge,
                                ...getPaymentStyle(
                                    payment.status
                                )
                            }}
                        >
                            {payment.status ||
                                "PENDING"}
                        </span>
                    </div>

                    <div style={styles.paymentItem}>
                        <span style={styles.infoLabel}>
                            Verification
                        </span>

                        <span
                            style={{
                                ...styles.paymentBadge,
                                ...getPaymentStyle(
                                    payment.verification_status
                                )
                            }}
                        >
                            {payment.verification_status ||
                                "PENDING"}
                        </span>
                    </div>

                    <div style={styles.paymentItem}>
                        <span style={styles.infoLabel}>
                            Payment Amount
                        </span>

                        <strong>
                            {formatCurrency(
                                payment.amount
                            )}
                        </strong>
                    </div>

                </div>

                <div style={styles.transactionBox}>

                    <span style={styles.infoLabel}>
                        Transaction ID
                    </span>

                    <strong>
                        {payment.transaction_id ||
                            "Not available"}
                    </strong>

                </div>

                {payment.screenshot && (
                    <div style={styles.screenshotSection}>

                        <h3>
                            Payment Screenshot
                        </h3>

                        <img
                            src={
                                payment.screenshot.startsWith(
                                    "http"
                                )
                                    ? payment.screenshot
                                    : `${API_URL}/${payment.screenshot.replace(
                                        /^\/+/,
                                        ""
                                    )}`
                            }
                            alt="Payment Screenshot"
                            style={
                                styles.screenshot
                            }
                        />

                    </div>
                )}

            </section>

            {/* ITEMS */}

            <section style={styles.card}>

                <div style={styles.itemsHeader}>

                    <h2 style={styles.cardTitle}>
                        🛍️ Order Items
                    </h2>

                    <span style={styles.itemCount}>
                        {items.length} item
                        {items.length === 1
                            ? ""
                            : "s"}
                    </span>

                </div>

                {items.length === 0 ? (

                    <div style={styles.emptyItems}>
                        No products found for this order.
                    </div>

                ) : (

                    <div style={styles.itemsList}>

                        {items.map(
                            (item, index) => {

                                const itemTotal =
                                    Number(
                                        item.price || 0
                                    ) *
                                    Number(
                                        item.quantity || 0
                                    );

                                return (
                                    <div
                                        key={`${item.product_id}-${index}`}
                                        style={
                                            styles.itemRow
                                        }
                                    >

                                        <div
                                            style={
                                                styles.imageContainer
                                            }
                                        >
                                            {item.image_url ? (
                                                <img
                                                    src={
                                                        item.image_url
                                                    }
                                                    alt={
                                                        item.name ||
                                                        "Product"
                                                    }
                                                    style={
                                                        styles.productImage
                                                    }
                                                />
                                            ) : (
                                                <div
                                                    style={
                                                        styles.noImage
                                                    }
                                                >
                                                    📦
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            style={
                                                styles.productInfo
                                            }
                                        >

                                            <h3
                                                style={
                                                    styles.productName
                                                }
                                            >
                                                {item.name ||
                                                    "Product"}
                                            </h3>

                                            {item.brand && (
                                                <p
                                                    style={
                                                        styles.productMeta
                                                    }
                                                >
                                                    Brand:{" "}
                                                    {
                                                        item.brand
                                                    }
                                                </p>
                                            )}

                                            {item.sku && (
                                                <p
                                                    style={
                                                        styles.productMeta
                                                    }
                                                >
                                                    SKU:{" "}
                                                    {
                                                        item.sku
                                                    }
                                                </p>
                                            )}

                                            <p
                                                style={
                                                    styles.productMeta
                                                }
                                            >
                                                Product ID:{" "}
                                                {
                                                    item.product_id
                                                }
                                            </p>

                                        </div>

                                        <div
                                            style={
                                                styles.itemQuantity
                                            }
                                        >

                                            <span
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Quantity
                                            </span>

                                            <strong>
                                                ×{" "}
                                                {
                                                    item.quantity
                                                }
                                            </strong>

                                        </div>

                                        <div
                                            style={
                                                styles.itemPrice
                                            }
                                        >

                                            <span
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Unit Price
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    item.price
                                                )}
                                            </strong>

                                            <span
                                                style={
                                                    styles.itemTotal
                                                }
                                            >
                                                Total:{" "}
                                                {formatCurrency(
                                                    itemTotal
                                                )}
                                            </span>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

            {/* TIMELINE */}

            <section style={styles.card}>

                <h2 style={styles.cardTitle}>
                    📦 Order Progress
                </h2>

                <div style={styles.timeline}>

                    {[
                        "PLACED",
                        "CONFIRMED",
                        "PACKED",
                        "SHIPPED",
                        "OUT_FOR_DELIVERY",
                        "DELIVERED"
                    ].map(
                        (status, index) => {

                            const statuses = [
                                "PLACED",
                                "CONFIRMED",
                                "PACKED",
                                "SHIPPED",
                                "OUT_FOR_DELIVERY",
                                "DELIVERED"
                            ];

                            const currentIndex =
                                statuses.indexOf(
                                    order.status
                                );

                            const completed =
                                currentIndex >=
                                index;

                            const cancelled =
                                order.status ===
                                "CANCELLED";

                            return (
                                <div
                                    key={status}
                                    style={
                                        styles.timelineItem
                                    }
                                >

                                    <div
                                        style={{
                                            ...styles.timelineCircle,
                                            ...(completed
                                                ? styles.timelineCompleted
                                                : {})
                                        }}
                                    >
                                        {completed
                                            ? "✓"
                                            : index + 1}
                                    </div>

                                    <div
                                        style={
                                            styles.timelineText
                                        }
                                    >
                                        <strong>
                                            {formatStatus(
                                                status
                                            )}
                                        </strong>
                                    </div>

                                    {index < 5 && (
                                        <div
                                            style={{
                                                ...styles.timelineLine,
                                                ...(completed &&
                                                currentIndex >
                                                index
                                                    ? styles.timelineLineCompleted
                                                    : {})
                                            }}
                                        ></div>
                                    )}

                                    {cancelled &&
                                        index === 0 && (
                                            <div
                                                style={
                                                    styles.cancelledTimeline
                                                }
                                            >
                                                Order cancelled
                                            </div>
                                        )}

                                </div>
                            );
                        }
                    )}

                </div>

            </section>

            {/* FOOTER */}

            <footer style={styles.footer}>

                <Link
                    to="/admin/orders"
                    style={styles.backLink}
                >
                    ← Back to All Orders
                </Link>

                <span>
                    Admin Order Management
                </span>

            </footer>

        </div>
    );
}

// ======================================================
// STYLES
// ======================================================

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        fontFamily:
            "Arial, Helvetica, sans-serif",
        color: "#1f2937"
    },

    loadingPage: {
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },

    loadingBox: {
        textAlign: "center"
    },

    spinner: {
        width: "42px",
        height: "42px",
        border:
            "4px solid #e5e7eb",
        borderTop:
            "4px solid #2563eb",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation:
            "spin 1s linear infinite"
    },

    header: {
        maxWidth: "1400px",
        margin: "0 auto 25px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px"
    },

    backLink: {
        color: "#2563eb",
        textDecoration: "none",
        fontWeight: "600",
        fontSize: "14px"
    },

    title: {
        margin: "10px 0 5px",
        fontSize: "32px"
    },

    subtitle: {
        margin: "0",
        color: "#6b7280",
        fontSize: "14px"
    },

    refreshButton: {
        border: "none",
        borderRadius: "8px",
        padding: "11px 18px",
        background: "#111827",
        color: "#ffffff",
        fontWeight: "600",
        cursor: "pointer"
    },

    error: {
        maxWidth: "1400px",
        margin: "0 auto 20px",
        padding: "14px 16px",
        background: "#fee2e2",
        border:
            "1px solid #fecaca",
        color: "#991b1b",
        borderRadius: "8px"
    },

    success: {
        maxWidth: "1400px",
        margin: "0 auto 20px",
        padding: "14px 16px",
        background: "#dcfce7",
        border:
            "1px solid #bbf7d0",
        color: "#166534",
        borderRadius: "8px"
    },

    topGrid: {
        maxWidth: "1400px",
        margin: "0 auto 20px",
        display: "grid",
        gridTemplateColumns:
            "minmax(300px, 0.8fr) minmax(400px, 1.2fr)",
        gap: "20px"
    },

    twoColumn: {
        maxWidth: "1400px",
        margin: "0 auto 20px",
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "20px"
    },

    card: {
        maxWidth: "1400px",
        margin: "0 auto 20px",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)"
    },

    cardTitle: {
        margin: "0 0 20px",
        fontSize: "20px"
    },

    currentStatus: {
        marginBottom: "22px"
    },

    statusBadge: {
        display: "inline-block",
        padding: "8px 13px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: "700"
    },

    statusControl: {
        display: "flex",
        flexDirection: "column",
        gap: "9px"
    },

    label: {
        fontSize: "13px",
        fontWeight: "600"
    },

    statusSelect: {
        width: "100%",
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "11px",
        background: "#ffffff",
        color: "#111827",
        fontSize: "14px"
    },

    updateButton: {
        border: "none",
        borderRadius: "8px",
        padding: "11px 16px",
        background: "#2563eb",
        color: "#ffffff",
        fontWeight: "600",
        cursor: "pointer"
    },

    disabledButton: {
        border: "none",
        borderRadius: "8px",
        padding: "11px 16px",
        background: "#d1d5db",
        color: "#6b7280",
        fontWeight: "600",
        cursor: "not-allowed"
    },

    cancelButton: {
        marginTop: "15px",
        width: "100%",
        border:
            "1px solid #ef4444",
        borderRadius: "8px",
        padding: "10px 16px",
        background: "#ffffff",
        color: "#dc2626",
        fontWeight: "600",
        cursor: "pointer"
    },

    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom:
            "1px solid #f3f4f6",
        gap: "20px",
        fontSize: "14px"
    },

    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "18px",
        marginTop: "8px",
        borderTop:
            "2px solid #e5e7eb",
        fontSize: "19px"
    },

    discount: {
        color: "#15803d"
    },

    infoGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        padding: "11px 0",
        borderBottom:
            "1px solid #f3f4f6"
    },

    infoLabel: {
        color: "#6b7280",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.03em"
    },

    addressBox: {
        lineHeight: "1.7",
        background: "#f9fafb",
        borderRadius: "9px",
        padding: "16px"
    },

    paymentGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "20px"
    },

    paymentItem: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },

    paymentBadge: {
        display: "inline-block",
        width: "fit-content",
        padding: "6px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "700"
    },

    transactionBox: {
        marginTop: "22px",
        padding: "15px",
        background: "#f9fafb",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },

    screenshotSection: {
        marginTop: "25px",
        paddingTop: "20px",
        borderTop:
            "1px solid #e5e7eb"
    },

    screenshot: {
        display: "block",
        maxWidth: "420px",
        maxHeight: "600px",
        width: "100%",
        objectFit: "contain",
        borderRadius: "10px",
        border:
            "1px solid #e5e7eb",
        marginTop: "15px"
    },

    itemsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },

    itemCount: {
        color: "#6b7280",
        fontSize: "14px"
    },

    itemsList: {
        borderTop:
            "1px solid #e5e7eb"
    },

    itemRow: {
        display: "grid",
        gridTemplateColumns:
            "80px minmax(250px, 1fr) 100px 180px",
        alignItems: "center",
        gap: "20px",
        padding: "18px 0",
        borderBottom:
            "1px solid #e5e7eb"
    },

    imageContainer: {
        width: "80px",
        height: "80px",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },

    productImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },

    noImage: {
        fontSize: "30px"
    },

    productInfo: {
        minWidth: "0"
    },

    productName: {
        margin: "0 0 7px",
        fontSize: "16px"
    },

    productMeta: {
        margin: "3px 0",
        color: "#6b7280",
        fontSize: "12px"
    },

    itemQuantity: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    itemPrice: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        textAlign: "right"
    },

    itemTotal: {
        color: "#6b7280",
        fontSize: "12px"
    },

    emptyItems: {
        textAlign: "center",
        padding: "40px",
        color: "#6b7280"
    },

    timeline: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        overflowX: "auto",
        padding: "15px 0"
    },

    timelineItem: {
        flex: "1",
        minWidth: "120px",
        textAlign: "center",
        position: "relative"
    },

    timelineCircle: {
        width: "38px",
        height: "38px",
        margin: "0 auto 10px",
        borderRadius: "50%",
        background: "#e5e7eb",
        color: "#6b7280",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        position: "relative",
        zIndex: "2"
    },

    timelineCompleted: {
        background: "#2563eb",
        color: "#ffffff"
    },

    timelineText: {
        fontSize: "11px",
        color: "#374151"
    },

    timelineLine: {
        position: "absolute",
        top: "19px",
        left: "50%",
        width: "100%",
        height: "3px",
        background: "#e5e7eb",
        zIndex: "1"
    },

    timelineLineCompleted: {
        background: "#2563eb"
    },

    cancelledTimeline: {
        marginTop: "6px",
        color: "#dc2626",
        fontSize: "11px",
        fontWeight: "600"
    },

    footer: {
        maxWidth: "1400px",
        margin: "30px auto 0",
        padding: "20px 0",
        borderTop:
            "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#6b7280",
        fontSize: "13px"
    },

    errorCard: {
        maxWidth: "600px",
        margin: "100px auto",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "40px",
        textAlign: "center",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)"
    },

    errorActions: {
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        marginTop: "20px",
        flexWrap: "wrap"
    },

    retryButton: {
        border: "none",
        background: "#2563eb",
        color: "#ffffff",
        padding: "11px 18px",
        borderRadius: "8px",
        fontWeight: "600",
        cursor: "pointer"
    },

    backButton: {
        display: "inline-block",
        background: "#111827",
        color: "#ffffff",
        textDecoration: "none",
        padding: "11px 18px",
        borderRadius: "8px",
        fontWeight: "600"
    }
};

export default AdminOrderDetails;