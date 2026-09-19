import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Cart() {
    const navigate = useNavigate();

    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        if (!token || !user || user.role !== "customer") {
            navigate("/login");
            return;
        }

        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/cart",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setCart(response.data.cart);
            } else {
                setError(
                    response.data.message ||
                    "Unable to load cart."
                );
            }

        } catch (err) {
            console.error(
                "Cart loading error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load cart."
            );

        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (
        productId,
        newQuantity
    ) => {
        if (newQuantity < 1) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await axios.put(
                `http://localhost:5000/api/cart/items/${productId}`,
                {
                    quantity: newQuantity
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessage(
                    "Cart updated successfully."
                );

                loadCart();
            } else {
                setError(
                    response.data.message ||
                    "Unable to update cart."
                );
            }

        } catch (err) {
            console.error(
                "Update cart error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update cart."
            );
        }
    };

    const removeItem = async (productId) => {
        try {
            setError("");
            setMessage("");

            const response = await axios.delete(
                `http://localhost:5000/api/cart/items/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessage(
                    "Product removed from cart."
                );

                loadCart();
            } else {
                setError(
                    response.data.message ||
                    "Unable to remove product."
                );
            }

        } catch (err) {
            console.error(
                "Remove cart item error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to remove product."
            );
        }
    };

    const clearCart = async () => {
        const confirmed =
            window.confirm(
                "Are you sure you want to clear your cart?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await axios.delete(
                "http://localhost:5000/api/cart",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setMessage(
                    "Cart cleared successfully."
                );

                loadCart();
            } else {
                setError(
                    response.data.message ||
                    "Unable to clear cart."
                );
            }

        } catch (err) {
            console.error(
                "Clear cart error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to clear cart."
            );
        }
    };

    const getPrice = (item) => {
        return Number(
            item.discount_price ??
            item.price ??
            0
        );
    };

    const getOriginalPrice = (item) => {
        return Number(
            item.price ?? 0
        );
    };

    const calculateItemTotal = (item) => {
        return (
            getPrice(item) *
            Number(item.quantity || 0)
        );
    };

    const subtotal = Number(
        cart?.subtotal || 0
    );

    const deliveryFee =
        subtotal >= 1000
            ? 0
            : subtotal > 0
                ? 50
                : 0;

    const total =
        subtotal + deliveryFee;

    if (loading) {
        return (
            <div style={styles.center}>
                <h2>Loading cart...</h2>
            </div>
        );
    }

    if (error && !cart) {
        return (
            <div style={styles.page}>
                <div style={styles.errorBox}>
                    <h2>Unable to load cart</h2>

                    <p>{error}</p>

                    <button
                        onClick={loadCart}
                        style={styles.primaryButton}
                    >
                        Try Again
                    </button>

                    <Link
                        to="/"
                        style={styles.linkButton}
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const items = cart?.items || [];

    return (
        <div style={styles.page}>

            <header style={styles.header}>

                <div>
                    <Link
                        to="/"
                        style={styles.logo}
                    >
                        E-Commerce Store
                    </Link>

                    <div style={styles.subtitle}>
                        Shopping Cart
                    </div>
                </div>

                <div style={styles.headerActions}>

                    <Link
                        to="/"
                        style={styles.headerButton}
                    >
                        Home
                    </Link>

                    <Link
                        to="/addresses"
                        style={styles.headerButton}
                    >
                        Addresses
                    </Link>

                    <button
                        onClick={() => {
                            localStorage.removeItem(
                                "token"
                            );

                            localStorage.removeItem(
                                "user"
                            );

                            navigate("/login");
                        }}
                        style={styles.logoutButton}
                    >
                        Logout
                    </button>

                </div>

            </header>

            <main style={styles.container}>

                <div style={styles.titleRow}>

                    <div>
                        <h1 style={styles.title}>
                            Your Cart
                        </h1>

                        <p style={styles.description}>
                            Review your products before checkout.
                        </p>
                    </div>

                    {items.length > 0 && (
                        <button
                            onClick={clearCart}
                            style={styles.clearButton}
                        >
                            Clear Cart
                        </button>
                    )}

                </div>

                {message && (
                    <div style={styles.successBox}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {items.length === 0 ? (

                    <div style={styles.emptyCart}>

                        <div style={styles.emptyIcon}>
                            🛒
                        </div>

                        <h2>
                            Your cart is empty
                        </h2>

                        <p>
                            Add some products to your cart
                            before proceeding to checkout.
                        </p>

                        <Link
                            to="/"
                            style={styles.shopButton}
                        >
                            Continue Shopping
                        </Link>

                    </div>

                ) : (

                    <div style={styles.layout}>

                        <section style={styles.itemsSection}>

                            <div style={styles.itemsHeader}>

                                <h2>
                                    Cart Items
                                </h2>

                                <span>
                                    {items.length}{" "}
                                    {items.length === 1
                                        ? "item"
                                        : "items"}
                                </span>

                            </div>

                            {items.map((item) => (

                                <div
                                    key={item.product_id}
                                    style={styles.item}
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
                                                    item.name
                                                }
                                                style={
                                                    styles.image
                                                }
                                            />

                                        ) : (

                                            <div
                                                style={
                                                    styles.noImage
                                                }
                                            >
                                                No Image
                                            </div>

                                        )}

                                    </div>

                                    <div
                                        style={
                                            styles.itemDetails
                                        }
                                    >

                                        <h3>
                                            {item.name}
                                        </h3>

                                        {item.brand && (
                                            <p>
                                                Brand:{" "}
                                                {item.brand}
                                            </p>
                                        )}

                                        {item.category_name && (
                                            <p>
                                                Category:{" "}
                                                {
                                                    item.category_name
                                                }
                                            </p>
                                        )}

                                        {item.sku && (
                                            <p>
                                                SKU:{" "}
                                                {item.sku}
                                            </p>
                                        )}

                                        <div
                                            style={
                                                styles.priceRow
                                            }
                                        >

                                            <strong>
                                                ₹
                                                {getPrice(
                                                    item
                                                ).toFixed(2)}
                                            </strong>

                                            {getOriginalPrice(
                                                item
                                            ) >
                                                getPrice(
                                                    item
                                                ) && (
                                                    <span
                                                        style={
                                                            styles.originalPrice
                                                        }
                                                    >
                                                        ₹
                                                        {getOriginalPrice(
                                                            item
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                )}

                                        </div>

                                        <div
                                            style={
                                                styles.controls
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.quantityControls
                                                }
                                            >

                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.product_id,
                                                            Number(
                                                                item.quantity
                                                            ) - 1
                                                        )
                                                    }
                                                    style={
                                                        styles.quantityButton
                                                    }
                                                >
                                                    −
                                                </button>

                                                <span
                                                    style={
                                                        styles.quantity
                                                    }
                                                >
                                                    {
                                                        item.quantity
                                                    }
                                                </span>

                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.product_id,
                                                            Number(
                                                                item.quantity
                                                            ) + 1
                                                        )
                                                    }
                                                    style={
                                                        styles.quantityButton
                                                    }
                                                >
                                                    +
                                                </button>

                                            </div>

                                            <button
                                                onClick={() =>
                                                    removeItem(
                                                        item.product_id
                                                    )
                                                }
                                                style={
                                                    styles.removeButton
                                                }
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    </div>

                                    <div
                                        style={
                                            styles.itemTotal
                                        }
                                    >
                                        <span>
                                            Item Total
                                        </span>

                                        <strong>
                                            ₹
                                            {calculateItemTotal(
                                                item
                                            ).toFixed(2)}
                                        </strong>
                                    </div>

                                </div>

                            ))}

                        </section>

                        <aside style={styles.summary}>

                            <h2>
                                Order Summary
                            </h2>

                            <div
                                style={
                                    styles.summaryRow
                                }
                            >
                                <span>
                                    Subtotal
                                </span>

                                <span>
                                    ₹
                                    {subtotal.toFixed(
                                        2
                                    )}
                                </span>
                            </div>

                            <div
                                style={
                                    styles.summaryRow
                                }
                            >
                                <span>
                                    Delivery
                                </span>

                                <span>
                                    {deliveryFee === 0
                                        ? "FREE"
                                        : `₹${deliveryFee.toFixed(
                                            2
                                        )}`}
                                </span>
                            </div>

                            {subtotal > 0 &&
                                subtotal < 1000 && (
                                    <p
                                        style={
                                            styles.deliveryNote
                                        }
                                    >
                                        Add ₹
                                        {(
                                            1000 -
                                            subtotal
                                        ).toFixed(
                                            2
                                        )}{" "}
                                        more to get free
                                        delivery.
                                    </p>
                                )}

                            <div
                                style={
                                    styles.divider
                                }
                            />

                            <div
                                style={
                                    styles.totalRow
                                }
                            >
                                <strong>
                                    Total
                                </strong>

                                <strong>
                                    ₹
                                    {total.toFixed(
                                        2
                                    )}
                                </strong>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(
                                        "/checkout"
                                    )
                                }
                                style={
                                    styles.checkoutButton
                                }
                            >
                                Proceed to Checkout
                            </button>

                            <Link
                                to="/"
                                style={
                                    styles.continueButton
                                }
                            >
                                ← Continue Shopping
                            </Link>

                        </aside>

                    </div>

                )}

            </main>

        </div>
    );
}

const styles = {

    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#222"
    },

    center: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fb"
    },

    header: {
        background: "#ffffff",
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e5e7eb",
        gap: "20px",
        flexWrap: "wrap"
    },

    logo: {
        fontSize: "24px",
        fontWeight: "700",
        textDecoration: "none",
        color: "#111827"
    },

    subtitle: {
        marginTop: "4px",
        color: "#6b7280",
        fontSize: "14px"
    },

    headerActions: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap"
    },

    headerButton: {
        textDecoration: "none",
        padding: "9px 14px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        color: "#374151",
        background: "#ffffff"
    },

    logoutButton: {
        padding: "9px 14px",
        border: "none",
        borderRadius: "8px",
        background: "#dc2626",
        color: "#ffffff",
        cursor: "pointer"
    },

    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px"
    },

    titleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "25px",
        flexWrap: "wrap"
    },

    title: {
        margin: "0 0 8px",
        fontSize: "34px"
    },

    description: {
        margin: 0,
        color: "#6b7280"
    },

    clearButton: {
        padding: "10px 16px",
        border: "1px solid #dc2626",
        borderRadius: "8px",
        background: "#ffffff",
        color: "#dc2626",
        cursor: "pointer"
    },

    successBox: {
        background: "#dcfce7",
        color: "#166534",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px"
    },

    errorMessage: {
        background: "#fee2e2",
        color: "#991b1b",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px"
    },

    errorBox: {
        maxWidth: "600px",
        margin: "100px auto",
        background: "#ffffff",
        padding: "40px",
        borderRadius: "12px",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
    },

    primaryButton: {
        padding: "11px 20px",
        border: "none",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        cursor: "pointer",
        marginRight: "10px"
    },

    linkButton: {
        display: "inline-block",
        marginTop: "20px",
        textDecoration: "none",
        color: "#2563eb"
    },

    emptyCart: {
        background: "#ffffff",
        borderRadius: "12px",
        padding: "70px 30px",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
    },

    emptyIcon: {
        fontSize: "60px",
        marginBottom: "15px"
    },

    shopButton: {
        display: "inline-block",
        marginTop: "20px",
        padding: "12px 22px",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        textDecoration: "none"
    },

    layout: {
        display: "grid",
        gridTemplateColumns:
            "minmax(0, 1fr) 350px",
        gap: "25px",
        alignItems: "start"
    },

    itemsSection: {
        background: "#ffffff",
        borderRadius: "12px",
        padding: "25px",
        boxShadow:
            "0 4px 20px rgba(0,0,0,0.05)"
    },

    itemsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #eee",
        paddingBottom: "18px",
        marginBottom: "20px"
    },

    item: {
        display: "grid",
        gridTemplateColumns:
            "130px minmax(0, 1fr) 120px",
        gap: "20px",
        padding: "20px 0",
        borderBottom:
            "1px solid #eeeeee"
    },

    imageContainer: {
        width: "130px",
        height: "130px",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#f3f4f6"
    },

    image: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },

    noImage: {
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#6b7280",
        fontSize: "13px"
    },

    itemDetails: {
        minWidth: 0
    },

    priceRow: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
        marginTop: "12px"
    },

    originalPrice: {
        textDecoration: "line-through",
        color: "#9ca3af"
    },

    controls: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginTop: "18px",
        flexWrap: "wrap"
    },

    quantityControls: {
        display: "flex",
        alignItems: "center",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        overflow: "hidden"
    },

    quantityButton: {
        width: "34px",
        height: "34px",
        border: "none",
        background: "#f9fafb",
        cursor: "pointer",
        fontSize: "18px"
    },

    quantity: {
        minWidth: "38px",
        textAlign: "center",
        fontWeight: "600"
    },

    removeButton: {
        border: "none",
        background: "transparent",
        color: "#dc2626",
        cursor: "pointer"
    },

    itemTotal: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "8px"
    },

    summary: {
        background: "#ffffff",
        borderRadius: "12px",
        padding: "25px",
        boxShadow:
            "0 4px 20px rgba(0,0,0,0.05)",
        position: "sticky",
        top: "20px"
    },

    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "15px",
        color: "#4b5563"
    },

    deliveryNote: {
        fontSize: "13px",
        color: "#6b7280",
        lineHeight: "1.5"
    },

    divider: {
        borderTop: "1px solid #e5e7eb",
        margin: "20px 0"
    },

    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "20px",
        marginBottom: "20px"
    },

    checkoutButton: {
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer"
    },

    continueButton: {
        display: "block",
        textAlign: "center",
        marginTop: "15px",
        textDecoration: "none",
        color: "#2563eb"
    }
};

export default Cart;