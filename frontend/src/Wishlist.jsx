import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function Wishlist() {
    const navigate = useNavigate();

    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    let user = null;

    try {
        user = storedUser
            ? JSON.parse(storedUser)
            : null;
    } catch (err) {
        user = null;
    }


    // ==========================================
    // LOAD WISHLIST
    // ==========================================

    const loadWishlist = async () => {
        if (!token || !user) {
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/wishlist`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setWishlist(
                response.data.wishlist || []
            );

        } catch (err) {
            console.error(
                "Wishlist loading error:",
                err
            );

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to load wishlist."
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadWishlist();
    }, []);


    // ==========================================
    // REMOVE FROM WISHLIST
    // ==========================================

    const removeFromWishlist = async (productId) => {
        try {
            setMessage("");
            setError("");

            await axios.delete(
                `${API_URL}/wishlist/items/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setWishlist((previousWishlist) =>
                previousWishlist.filter(
                    (item) =>
                        item.product_id !== productId
                )
            );

            setMessage(
                "Product removed from wishlist."
            );

        } catch (err) {
            console.error(
                "Remove wishlist error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to remove product."
            );
        }
    };


    // ==========================================
    // MOVE TO CART
    // ==========================================

    const moveToCart = async (product) => {
        try {
            setMessage("");
            setError("");

            if (
                Number(product.available_stock || 0) <= 0
            ) {
                setError(
                    "This product is currently out of stock."
                );
                return;
            }

            await axios.post(
                `${API_URL}/cart/items`,
                {
                    product_id: product.product_id,
                    quantity: 1
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Remove from wishlist after successful cart addition
            await axios.delete(
                `${API_URL}/wishlist/items/${product.product_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setWishlist((previousWishlist) =>
                previousWishlist.filter(
                    (item) =>
                        item.product_id !==
                        product.product_id
                )
            );

            setMessage(
                "Product moved to cart successfully."
            );

        } catch (err) {
            console.error(
                "Move to cart error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to move product to cart."
            );
        }
    };


    // ==========================================
    // LOGOUT
    // ==========================================

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };


    // ==========================================
    // PRICE HELPER
    // ==========================================

    const getProductPrice = (product) => {
        return product.discount_price !== null &&
            product.discount_price !== undefined
            ? Number(product.discount_price)
            : Number(product.price);
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontFamily: "Arial, sans-serif"
                }}
            >
                <h2>Loading wishlist...</h2>
            </div>
        );
    }


    // ==========================================
    // PAGE
    // ==========================================

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f5f5f5",
                fontFamily: "Arial, sans-serif"
            }}
        >

            {/* ======================================
                HEADER
            ====================================== */}

            <header
                style={{
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #ddd",
                    padding: "15px 30px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    flexWrap: "wrap"
                }}
            >

                <Link
                    to="/"
                    style={{
                        textDecoration: "none",
                        color: "#222",
                        fontSize: "24px",
                        fontWeight: "bold"
                    }}
                >
                    E-Commerce Store
                </Link>


                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap"
                    }}
                >

                    <span>
                        Hi, {user?.name || "Customer"}
                    </span>

                    <Link
                        to="/"
                        style={navButtonStyle}
                    >
                        Home
                    </Link>

                    <Link
                        to="/orders"
                        style={navButtonStyle}
                    >
                        My Orders
                    </Link>

                    <Link
                        to="/addresses"
                        style={navButtonStyle}
                    >
                        Addresses
                    </Link>

                    <Link
                        to="/notifications"
                        style={navButtonStyle}
                    >
                        Notifications
                    </Link>

                    <Link
                        to="/wishlist"
                        style={{
                            ...navButtonStyle,
                            backgroundColor: "#ffe5e5"
                        }}
                    >
                        ❤️ Wishlist
                    </Link>

                    <Link
                        to="/cart"
                        style={navButtonStyle}
                    >
                        🛒 Cart
                    </Link>

                    <button
                        onClick={logout}
                        style={{
                            ...navButtonStyle,
                            border: "none",
                            cursor: "pointer"
                        }}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ======================================
                MAIN CONTENT
            ====================================== */}

            <main
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "30px 20px"
                }}
            >

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "25px",
                        flexWrap: "wrap",
                        gap: "10px"
                    }}
                >

                    <div>
                        <h1
                            style={{
                                margin: "0 0 8px"
                            }}
                        >
                            ❤️ My Wishlist
                        </h1>

                        <p
                            style={{
                                margin: 0,
                                color: "#666"
                            }}
                        >
                            {wishlist.length}{" "}
                            {wishlist.length === 1
                                ? "product"
                                : "products"}{" "}
                            saved
                        </p>
                    </div>

                </div>


                {/* ==================================
                    MESSAGES
                ================================== */}

                {message && (
                    <div
                        style={{
                            backgroundColor: "#e8f5e9",
                            color: "#2e7d32",
                            padding: "12px 15px",
                            borderRadius: "6px",
                            marginBottom: "20px"
                        }}
                    >
                        {message}
                    </div>
                )}


                {error && (
                    <div
                        style={{
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                            padding: "12px 15px",
                            borderRadius: "6px",
                            marginBottom: "20px"
                        }}
                    >
                        {error}
                    </div>
                )}


                {/* ==================================
                    EMPTY WISHLIST
                ================================== */}

                {wishlist.length === 0 ? (
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "10px",
                            padding: "60px 20px",
                            textAlign: "center",
                            boxShadow:
                                "0 2px 8px rgba(0,0,0,0.08)"
                        }}
                    >

                        <div
                            style={{
                                fontSize: "60px",
                                marginBottom: "15px"
                            }}
                        >
                            ❤️
                        </div>

                        <h2>
                            Your wishlist is empty
                        </h2>

                        <p
                            style={{
                                color: "#666",
                                marginBottom: "25px"
                            }}
                        >
                            Save products you love
                            and come back to them later.
                        </p>

                        <Link
                            to="/"
                            style={{
                                display: "inline-block",
                                backgroundColor: "#222",
                                color: "#fff",
                                padding: "12px 22px",
                                borderRadius: "6px",
                                textDecoration: "none"
                            }}
                        >
                            Continue Shopping
                        </Link>

                    </div>
                ) : (

                    /* ==================================
                       WISHLIST PRODUCTS
                    ================================== */

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(250px, 1fr))",
                            gap: "20px"
                        }}
                    >

                        {wishlist.map((product) => {

                            const currentPrice =
                                getProductPrice(product);

                            const hasDiscount =
                                product.discount_price !== null &&
                                product.discount_price !== undefined &&
                                Number(product.discount_price) <
                                Number(product.price);

                            const outOfStock =
                                Number(
                                    product.available_stock || 0
                                ) <= 0;

                            return (
                                <div
                                    key={
                                        product.wishlist_item_id
                                    }
                                    style={{
                                        backgroundColor:
                                            "#ffffff",
                                        borderRadius: "10px",
                                        overflow: "hidden",
                                        boxShadow:
                                            "0 2px 8px rgba(0,0,0,0.08)",
                                        position: "relative"
                                    }}
                                >

                                    {/* Remove button */}

                                    <button
                                        onClick={() =>
                                            removeFromWishlist(
                                                product.product_id
                                            )
                                        }
                                        title="Remove from wishlist"
                                        style={{
                                            position:
                                                "absolute",
                                            top: "10px",
                                            right: "10px",
                                            zIndex: 2,
                                            width: "35px",
                                            height: "35px",
                                            borderRadius:
                                                "50%",
                                            border: "none",
                                            backgroundColor:
                                                "#ffffff",
                                            boxShadow:
                                                "0 2px 6px rgba(0,0,0,0.15)",
                                            cursor: "pointer",
                                            fontSize: "18px"
                                        }}
                                    >
                                        ❤️
                                    </button>


                                    {/* Product Image */}

                                    <Link
                                        to={`/product/${product.product_id}`}
                                        style={{
                                            textDecoration:
                                                "none"
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "230px",
                                                backgroundColor:
                                                    "#f8f8f8",
                                                display: "flex",
                                                justifyContent:
                                                    "center",
                                                alignItems:
                                                    "center"
                                            }}
                                        >

                                            {product.image_url ? (
                                                <img
                                                    src={
                                                        product.image_url
                                                    }
                                                    alt={
                                                        product.name
                                                    }
                                                    style={{
                                                        width:
                                                            "100%",
                                                        height:
                                                            "100%",
                                                        objectFit:
                                                            "contain"
                                                    }}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        color:
                                                            "#999"
                                                    }}
                                                >
                                                    No Image
                                                </span>
                                            )}

                                        </div>
                                    </Link>


                                    {/* Product Information */}

                                    <div
                                        style={{
                                            padding: "18px"
                                        }}
                                    >

                                        <div
                                            style={{
                                                color:
                                                    "#777",
                                                fontSize:
                                                    "13px",
                                                marginBottom:
                                                    "5px"
                                            }}
                                        >
                                            {product.brand ||
                                                "Brand"}
                                        </div>

                                        <Link
                                            to={`/product/${product.product_id}`}
                                            style={{
                                                textDecoration:
                                                    "none",
                                                color: "#222"
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin:
                                                        "0 0 10px",
                                                    fontSize:
                                                        "18px"
                                                }}
                                            >
                                                {product.name}
                                            </h3>
                                        </Link>


                                        {/* Price */}

                                        <div
                                            style={{
                                                marginBottom:
                                                    "10px"
                                            }}
                                        >

                                            <span
                                                style={{
                                                    fontSize:
                                                        "20px",
                                                    fontWeight:
                                                        "bold"
                                                }}
                                            >
                                                ₹
                                                {currentPrice.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </span>

                                            {hasDiscount && (
                                                <span
                                                    style={{
                                                        marginLeft:
                                                            "8px",
                                                        color:
                                                            "#888",
                                                        textDecoration:
                                                            "line-through"
                                                    }}
                                                >
                                                    ₹
                                                    {Number(
                                                        product.price
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            )}

                                        </div>


                                        {/* Stock */}

                                        {outOfStock ? (
                                            <div
                                                style={{
                                                    color:
                                                        "#d32f2f",
                                                    fontSize:
                                                        "14px",
                                                    marginBottom:
                                                        "12px"
                                                }}
                                            >
                                                Out of Stock
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    color:
                                                        "#2e7d32",
                                                    fontSize:
                                                        "14px",
                                                    marginBottom:
                                                        "12px"
                                                }}
                                            >
                                                In Stock
                                            </div>
                                        )}


                                        {/* Buttons */}

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                gap: "8px",
                                                flexDirection:
                                                    "column"
                                            }}
                                        >

                                            <Link
                                                to={`/product/${product.product_id}`}
                                                style={{
                                                    textAlign:
                                                        "center",
                                                    padding:
                                                        "10px",
                                                    borderRadius:
                                                        "6px",
                                                    border:
                                                        "1px solid #222",
                                                    color:
                                                        "#222",
                                                    textDecoration:
                                                        "none"
                                                }}
                                            >
                                                View Product
                                            </Link>


                                            <button
                                                onClick={() =>
                                                    moveToCart(
                                                        product
                                                    )
                                                }
                                                disabled={
                                                    outOfStock
                                                }
                                                style={{
                                                    padding:
                                                        "10px",
                                                    borderRadius:
                                                        "6px",
                                                    border: "none",
                                                    backgroundColor:
                                                        outOfStock
                                                            ? "#ccc"
                                                            : "#222",
                                                    color:
                                                        "#fff",
                                                    cursor:
                                                        outOfStock
                                                            ? "not-allowed"
                                                            : "pointer"
                                                }}
                                            >
                                                🛒 Move to Cart
                                            </button>

                                        </div>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </main>

        </div>
    );
}


// ==========================================
// NAVIGATION BUTTON STYLE
// ==========================================

const navButtonStyle = {
    textDecoration: "none",
    color: "#222",
    backgroundColor: "#f2f2f2",
    padding: "8px 12px",
    borderRadius: "6px",
    display: "inline-block"
};


export default Wishlist;