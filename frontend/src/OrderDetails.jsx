import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    let user = null;

    try {
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        user = null;
    }

    useEffect(() => {
        const fetchOrder = async () => {
            if (!token) {
                navigate("/login");
                return;
            }

            if (!id) {
                setError("Order ID is missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `${API_URL}/orders/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    setOrder(response.data.order);
                } else {
                    setError(
                        response.data.message || "Unable to fetch order."
                    );
                }
            } catch (err) {
                console.error("Fetch order error:", err);

                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/login");
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    "Unable to fetch order."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, token, navigate]);

    const cancelOrder = async () => {
        if (!order) return;

        const confirmed = window.confirm(
            "Are you sure you want to cancel this order?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);

            const response = await axios.put(
                `${API_URL}/orders/${order.id}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setOrder((previousOrder) => ({
                    ...previousOrder,
                    status: "CANCELLED"
                }));

                alert("Order cancelled successfully.");
            } else {
                alert(
                    response.data.message ||
                    "Unable to cancel order."
                );
            }
        } catch (err) {
            console.error("Cancel order error:", err);

            alert(
                err.response?.data?.message ||
                "Unable to cancel order."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const requestReturn = async () => {
        if (!order) return;

        const confirmed = window.confirm(
            "Do you want to request a return for this order?"
        );

        if (!confirmed) return;

        try {
            setActionLoading(true);

            const response = await axios.put(
                `${API_URL}/orders/${order.id}/return`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setOrder((previousOrder) => ({
                    ...previousOrder,
                    status: "RETURN_REQUESTED"
                }));

                alert("Return request submitted successfully.");
            } else {
                alert(
                    response.data.message ||
                    "Unable to request return."
                );
            }
        } catch (err) {
            console.error("Return request error:", err);

            alert(
                err.response?.data?.message ||
                "Unable to request return."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount || 0).toFixed(2)}`;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "PLACED":
                return "status placed";

            case "CONFIRMED":
                return "status confirmed";

            case "PACKED":
                return "status packed";

            case "SHIPPED":
                return "status shipped";

            case "OUT_FOR_DELIVERY":
                return "status out-for-delivery";

            case "DELIVERED":
                return "status delivered";

            case "CANCELLED":
                return "status cancelled";

            case "RETURN_REQUESTED":
                return "status return-requested";

            case "RETURNED":
                return "status returned";

            case "REFUNDED":
                return "status refunded";

            default:
                return "status";
        }
    };

    const getPaymentStatusClass = (status) => {
        switch (status) {
            case "SUCCESS":
                return "payment-success";

            case "PENDING":
                return "payment-pending";

            case "FAILED":
                return "payment-failed";

            case "REFUNDED":
                return "payment-refunded";

            default:
                return "payment-pending";
        }
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <div style={styles.centerCard}>
                    <div style={styles.spinner}></div>
                    <h2>Loading Order...</h2>
                    <p>Please wait while we fetch your order details.</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div style={styles.page}>
                <div style={styles.centerCard}>
                    <div style={styles.errorIcon}>!</div>

                    <h2>Order Not Found</h2>

                    <p>
                        {error || "Unable to fetch order."}
                    </p>

                    <Link
                        to="/orders"
                        style={styles.primaryButton}
                    >
                        ← Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    const canCancel = [
        "PLACED",
        "CONFIRMED",
        "PACKED"
    ].includes(order.status);

    const canReturn = order.status === "DELIVERED";

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div style={styles.headerInner}>
                    <Link
                        to="/"
                        style={styles.logo}
                    >
                        Pavan Stores
                    </Link>

                    <nav style={styles.nav}>
                        <Link to="/" style={styles.navLink}>
                            Home
                        </Link>

                        <Link
                            to="/orders"
                            style={styles.navLink}
                        >
                            Orders
                        </Link>

                        <Link
                            to="/cart"
                            style={styles.navLink}
                        >
                            Cart
                        </Link>

                        <Link
                            to="/profile"
                            style={styles.navLink}
                        >
                            Profile
                        </Link>
                    </nav>
                </div>
            </header>

            <main style={styles.container}>
                <div style={styles.topBar}>
                    <Link
                        to="/orders"
                        style={styles.backLink}
                    >
                        ← Back to Orders
                    </Link>

                    <h1 style={styles.title}>
                        Order #{order.id}
                    </h1>
                </div>

                <div style={styles.grid}>
                    <section style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>
                                Order Information
                            </h2>

                            <span className={getStatusClass(order.status)}>
                                {String(order.status || "").replaceAll(
                                    "_",
                                    " "
                                )}
                            </span>
                        </div>

                        <div style={styles.infoGrid}>
                            <div>
                                <span style={styles.label}>
                                    Order ID
                                </span>

                                <strong>
                                    #{order.id}
                                </strong>
                            </div>

                            <div>
                                <span style={styles.label}>
                                    Order Date
                                </span>

                                <strong>
                                    {formatDate(order.created_at)}
                                </strong>
                            </div>

                            <div>
                                <span style={styles.label}>
                                    Customer
                                </span>

                                <strong>
                                    {user?.name ||
                                        order.customer_name ||
                                        "-"}
                                </strong>
                            </div>

                            <div>
                                <span style={styles.label}>
                                    Total Amount
                                </span>

                                <strong style={styles.total}>
                                    {formatCurrency(
                                        order.total_amount
                                    )}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section style={styles.card}>
                        <h2 style={styles.cardTitle}>
                            Payment Information
                        </h2>

                        <div style={styles.paymentBox}>
                            <div style={styles.paymentRow}>
                                <span>Payment Method</span>

                                <strong>
                                    {order.payment_method ||
                                        "Not available"}
                                </strong>
                            </div>

                            <div style={styles.paymentRow}>
                                <span>Payment Status</span>

                                <strong
                                    className={getPaymentStatusClass(
                                        order.payment_status
                                    )}
                                >
                                    {order.payment_status ||
                                        "PENDING"}
                                </strong>
                            </div>

                            {order.verification_status && (
                                <div style={styles.paymentRow}>
                                    <span>
                                        Verification Status
                                    </span>

                                    <strong>
                                        {
                                            order.verification_status
                                        }
                                    </strong>
                                </div>
                            )}

                            {order.transaction_id && (
                                <div style={styles.transactionBox}>
                                    <span>
                                        Transaction / UTR ID
                                    </span>

                                    <strong>
                                        {order.transaction_id}
                                    </strong>
                                </div>
                            )}
                        </div>
                    </section>

                    <section style={styles.card}>
                        <h2 style={styles.cardTitle}>
                            Delivery Address
                        </h2>

                        <div style={styles.address}>
                            <strong>
                                {order.full_name ||
                                    order.address_name ||
                                    "Delivery Address"}
                            </strong>

                            <p>
                                {order.address_line1 ||
                                    order.address ||
                                    ""}
                            </p>

                            {order.address_line2 && (
                                <p>
                                    {order.address_line2}
                                </p>
                            )}

                            <p>
                                {order.city || ""}
                                {order.state
                                    ? `, ${order.state}`
                                    : ""}
                                {order.pincode
                                    ? ` - ${order.pincode}`
                                    : ""}
                            </p>

                            {order.phone && (
                                <p>
                                    Phone: {order.phone}
                                </p>
                            )}
                        </div>
                    </section>

                    <section style={styles.card}>
                        <h2 style={styles.cardTitle}>
                            Order Items
                        </h2>

                        <div>
                            {order.items?.length > 0 ? (
                                order.items.map((item, index) => (
                                    <div
                                        key={
                                            item.id ||
                                            item.product_id ||
                                            index
                                        }
                                        style={styles.item}
                                    >
                                        <div
                                            style={
                                                styles.itemImage
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
                                                        styles.image
                                                    }
                                                />
                                            ) : (
                                                <span>
                                                    No Image
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            style={
                                                styles.itemInfo
                                            }
                                        >
                                            <h3>
                                                {item.name ||
                                                    "Product"}
                                            </h3>

                                            {item.brand && (
                                                <p>
                                                    Brand:{" "}
                                                    {
                                                        item.brand
                                                    }
                                                </p>
                                            )}

                                            {item.sku && (
                                                <p>
                                                    SKU:{" "}
                                                    {item.sku}
                                                </p>
                                            )}

                                            <p>
                                                Quantity:{" "}
                                                {item.quantity}
                                            </p>
                                        </div>

                                        <div
                                            style={
                                                styles.itemPrice
                                            }
                                        >
                                            <strong>
                                                {formatCurrency(
                                                    Number(
                                                        item.price
                                                    ) *
                                                        Number(
                                                            item.quantity
                                                        )
                                                )}
                                            </strong>

                                            <span>
                                                {formatCurrency(
                                                    item.price
                                                )}{" "}
                                                ×{" "}
                                                {
                                                    item.quantity
                                                }
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>
                                    No items found for this
                                    order.
                                </p>
                            )}
                        </div>
                    </section>

                    <section style={styles.card}>
                        <h2 style={styles.cardTitle}>
                            Order Summary
                        </h2>

                        <div style={styles.summary}>
                            <div>
                                <span>Subtotal</span>
                                <strong>
                                    {formatCurrency(
                                        order.subtotal
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Discount</span>
                                <strong>
                                    -{" "}
                                    {formatCurrency(
                                        order.discount
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Delivery Fee</span>
                                <strong>
                                    {formatCurrency(
                                        order.delivery_fee
                                    )}
                                </strong>
                            </div>

                            <div style={styles.grandTotal}>
                                <span>Total</span>
                                <strong>
                                    {formatCurrency(
                                        order.total_amount
                                    )}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section style={styles.card}>
                        <h2 style={styles.cardTitle}>
                            Order Timeline
                        </h2>

                        <div style={styles.timeline}>
                            <div style={styles.timelineItem}>
                                <div
                                    style={
                                        styles.timelineDot
                                    }
                                ></div>

                                <div>
                                    <strong>
                                        Order Placed
                                    </strong>

                                    <p>
                                        {formatDate(
                                            order.created_at
                                        )}
                                    </p>
                                </div>
                            </div>

                            {order.status !== "PLACED" && (
                                <div
                                    style={
                                        styles.timelineItem
                                    }
                                >
                                    <div
                                        style={
                                            styles.timelineDot
                                        }
                                    ></div>

                                    <div>
                                        <strong>
                                            Current Status
                                        </strong>

                                        <p>
                                            {String(
                                                order.status ||
                                                    ""
                                            ).replaceAll(
                                                "_",
                                                " "
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div style={styles.actions}>
                    {canCancel && (
                        <button
                            onClick={cancelOrder}
                            disabled={actionLoading}
                            style={styles.cancelButton}
                        >
                            {actionLoading
                                ? "Processing..."
                                : "Cancel Order"}
                        </button>
                    )}

                    {canReturn && (
                        <button
                            onClick={requestReturn}
                            disabled={actionLoading}
                            style={styles.returnButton}
                        >
                            {actionLoading
                                ? "Processing..."
                                : "Request Return"}
                        </button>
                    )}

                    <Link
                        to="/orders"
                        style={styles.primaryButton}
                    >
                        ← Back to Orders
                    </Link>
                </div>
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#1f2937",
        fontFamily:
            "Arial, Helvetica, sans-serif"
    },

    header: {
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 10
    },

    headerInner: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px"
    },

    logo: {
        fontSize: "22px",
        fontWeight: "800",
        color: "#2563eb",
        textDecoration: "none"
    },

    nav: {
        display: "flex",
        gap: "18px",
        flexWrap: "wrap"
    },

    navLink: {
        color: "#374151",
        textDecoration: "none",
        fontWeight: "600"
    },

    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 20px 50px"
    },

    topBar: {
        marginBottom: "25px"
    },

    backLink: {
        color: "#2563eb",
        textDecoration: "none",
        fontWeight: "700"
    },

    title: {
        margin: "14px 0 0",
        fontSize: "30px"
    },

    grid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "20px"
    },

    card: {
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "22px",
        boxShadow:
            "0 4px 15px rgba(0, 0, 0, 0.05)"
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px"
    },

    cardTitle: {
        margin: "0 0 18px",
        fontSize: "20px",
        color: "#111827"
    },

    infoGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "20px"
    },

    label: {
        display: "block",
        color: "#6b7280",
        fontSize: "13px",
        marginBottom: "6px"
    },

    total: {
        color: "#059669",
        fontSize: "18px"
    },

    paymentBox: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },

    paymentRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        paddingBottom: "12px",
        borderBottom:
            "1px solid #f0f0f0"
    },

    transactionBox: {
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "10px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    address: {
        lineHeight: "1.7",
        color: "#4b5563"
    },

    item: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
        padding: "15px 0",
        borderBottom:
            "1px solid #e5e7eb"
    },

    itemImage: {
        width: "75px",
        height: "75px",
        borderRadius: "10px",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        color: "#6b7280",
        fontSize: "12px"
    },

    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },

    itemInfo: {
        flex: 1
    },

   

    itemPrice: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "5px"
    },

    summary: {
        display: "flex",
        flexDirection: "column",
        gap: "13px"
    },

    summaryRow: {
        display: "flex",
        justifyContent: "space-between"
    },

    grandTotal: {
        marginTop: "8px",
        paddingTop: "15px",
        borderTop:
            "2px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "20px"
    },

    timeline: {
        display: "flex",
        flexDirection: "column",
        gap: "20px"
    },

    timelineItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px"
    },

    timelineDot: {
        width: "13px",
        height: "13px",
        borderRadius: "50%",
        background: "#2563eb",
        marginTop: "4px",
        flexShrink: 0
    },

    actions: {
        marginTop: "25px",
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        flexWrap: "wrap"
    },

    primaryButton: {
        display: "inline-block",
        padding: "12px 18px",
        background: "#2563eb",
        color: "#ffffff",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "700",
        border: "none",
        cursor: "pointer"
    },

    cancelButton: {
        padding: "12px 18px",
        background: "#dc2626",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "700",
        cursor: "pointer"
    },

    returnButton: {
        padding: "12px 18px",
        background: "#d97706",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "700",
        cursor: "pointer"
    },

    centerCard: {
        maxWidth: "500px",
        margin: "100px auto",
        background: "#ffffff",
        padding: "40px",
        borderRadius: "15px",
        textAlign: "center",
        boxShadow:
            "0 5px 25px rgba(0, 0, 0, 0.08)"
    },

    errorIcon: {
        width: "50px",
        height: "50px",
        margin: "0 auto 15px",
        borderRadius: "50%",
        background: "#fee2e2",
        color: "#dc2626",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "28px",
        fontWeight: "800"
    },

    spinner: {
        width: "35px",
        height: "35px",
        border: "4px solid #e5e7eb",
        borderTop:
            "4px solid #2563eb",
        borderRadius: "50%",
        margin: "0 auto 20px",
        animation:
            "spin 1s linear infinite"
    }
};

export default OrderDetails;