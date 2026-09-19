import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function OrderSuccess() {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadOrder = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${API_URL}/orders/${orderId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setOrder(response.data.order);
        } catch (error) {
            console.error("Load order error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load order details."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "20px"
                }}
            >
                Loading order confirmation...
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: "15px",
                    padding: "20px",
                    background: "#f5f7fb"
                }}
            >
                <h2>Unable to load order</h2>

                <p
                    style={{
                        color: "#dc2626"
                    }}
                >
                    {error}
                </p>

                <button
                    onClick={() => navigate("/orders")}
                    style={buttonStyle}
                >
                    View My Orders
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb"
            }}
        >
            {/* HEADER */}

            <header
                style={{
                    background: "#111827",
                    color: "white",
                    padding: "15px 30px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px"
                }}
            >
                <h2
                    style={{
                        margin: 0
                    }}
                >
                    E-Commerce Store
                </h2>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        onClick={() => navigate("/")}
                        style={headerButtonStyle}
                    >
                        Home
                    </button>

                    <button
                        onClick={() => navigate("/orders")}
                        style={headerButtonStyle}
                    >
                        My Orders
                    </button>

                    <button
                        onClick={() => navigate("/profile")}
                        style={headerButtonStyle}
                    >
                        Profile
                    </button>
                </div>
            </header>

            {/* MAIN */}

            <main
                style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    padding: "40px 20px"
                }}
            >
                {/* SUCCESS MESSAGE */}

                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "35px",
                        textAlign: "center",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.06)",
                        marginBottom: "25px"
                    }}
                >
                    <div
                        style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",
                            background: "#dcfce7",
                            color: "#16a34a",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "40px",
                            margin: "0 auto 20px"
                        }}
                    >
                        ✓
                    </div>

                    <h1
                        style={{
                            marginBottom: "10px"
                        }}
                    >
                        Order Placed Successfully!
                    </h1>

                    <p
                        style={{
                            color: "#6b7280",
                            fontSize: "16px"
                        }}
                    >
                        Thank you for your purchase.
                        Your order has been successfully
                        placed.
                    </p>

                    <div
                        style={{
                            display: "inline-block",
                            background: "#f3f4f6",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            marginTop: "10px"
                        }}
                    >
                        <strong>
                            Order #{orderId}
                        </strong>
                    </div>
                </div>

                {/* ORDER DETAILS */}

                {order && (
                    <div
                        style={{
                            background: "white",
                            borderRadius: "12px",
                            padding: "25px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.06)",
                            marginBottom: "25px"
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0
                            }}
                        >
                            Order Summary
                        </h2>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "15px",
                                marginBottom: "25px"
                            }}
                        >
                            <InfoBox
                                label="Order ID"
                                value={`#${order.id}`}
                            />

                            <InfoBox
                                label="Status"
                                value={order.status}
                            />

                            <InfoBox
                                label="Payment Method"
                                value={
                                    order.payment_method ||
                                    "N/A"
                                }
                            />

                            <InfoBox
                                label="Payment Status"
                                value={
                                    order.payment_status ||
                                    "PENDING"
                                }
                            />
                        </div>

                        {/* ITEMS */}

                        <h3>
                            Items
                        </h3>

                        {order.items &&
                            order.items.length > 0 && (
                                <div>
                                    {order.items.map(
                                        (item) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems:
                                                        "center",
                                                    gap: "15px",
                                                    padding:
                                                        "15px 0",
                                                    borderBottom:
                                                        "1px solid #e5e7eb"
                                                }}
                                            >
                                                <div>
                                                    <strong>
                                                        {
                                                            item.product_name
                                                        }
                                                    </strong>

                                                    <div
                                                        style={{
                                                            color:
                                                                "#6b7280",
                                                            marginTop:
                                                                "5px"
                                                        }}
                                                    >
                                                        Quantity:{" "}
                                                        {
                                                            item.quantity
                                                        }
                                                    </div>
                                                </div>

                                                <strong>
                                                    ₹
                                                    {Number(
                                                        item.price *
                                                        item.quantity
                                                    ).toFixed(2)}
                                                </strong>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                        {/* TOTALS */}

                        <div
                            style={{
                                marginTop: "25px",
                                marginLeft: "auto",
                                maxWidth: "350px"
                            }}
                        >
                            <SummaryRow
                                label="Subtotal"
                                value={
                                    order.subtotal
                                }
                            />

                            <SummaryRow
                                label="Discount"
                                value={
                                    order.discount
                                }
                            />

                            <SummaryRow
                                label="Delivery Fee"
                                value={
                                    order.delivery_fee
                                }
                            />

                            <div
                                style={{
                                    borderTop:
                                        "2px solid #111827",
                                    marginTop: "10px",
                                    paddingTop: "12px",
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    fontSize: "20px"
                                }}
                            >
                                <strong>
                                    Total
                                </strong>

                                <strong>
                                    ₹
                                    {Number(
                                        order.total_amount
                                    ).toFixed(2)}
                                </strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTION BUTTONS */}

                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "25px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.06)",
                        display: "flex",
                        justifyContent: "center",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        onClick={() =>
                            navigate(
                                `/orders/${orderId}`
                            )
                        }
                        style={buttonStyle}
                    >
                        View Order Details
                    </button>

                    <button
                        onClick={() =>
                            navigate("/orders")
                        }
                        style={secondaryButtonStyle}
                    >
                        My Orders
                    </button>

                    <button
                        onClick={() =>
                            navigate("/")
                        }
                        style={secondaryButtonStyle}
                    >
                        Continue Shopping
                    </button>
                </div>
            </main>
        </div>
    );
}

// ==========================================
// INFO BOX
// ==========================================

function InfoBox({
    label,
    value
}) {
    return (
        <div
            style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "15px"
            }}
        >
            <div
                style={{
                    color: "#6b7280",
                    fontSize: "13px",
                    marginBottom: "5px"
                }}
            >
                {label}
            </div>

            <strong
                style={{
                    textTransform: "capitalize"
                }}
            >
                {value}
            </strong>
        </div>
    );
}

// ==========================================
// SUMMARY ROW
// ==========================================

function SummaryRow({
    label,
    value
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0"
            }}
        >
            <span>
                {label}
            </span>

            <span>
                ₹{Number(value || 0).toFixed(2)}
            </span>
        </div>
    );
}

// ==========================================
// STYLES
// ==========================================

const headerButtonStyle = {
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    background: "#374151",
    color: "white",
    cursor: "pointer",
    fontSize: "14px"
};

const buttonStyle = {
    padding: "11px 20px",
    border: "none",
    borderRadius: "7px",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontSize: "15px"
};

const secondaryButtonStyle = {
    padding: "11px 20px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "white",
    color: "#111827",
    cursor: "pointer",
    fontSize: "15px"
};

export default OrderSuccess;