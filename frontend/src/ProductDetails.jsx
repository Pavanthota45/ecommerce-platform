import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    let user = null;

    try {
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch {
        user = null;
    }

    const isCustomer =
        Boolean(user) &&
        user.role === "customer" &&
        Boolean(token);

    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState("");

    const [quantity, setQuantity] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");

    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [wishlistMessage, setWishlistMessage] = useState("");

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    const [ratingCounts, setRatingCounts] = useState({
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
    });

    const [myReview, setMyReview] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");

    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");
    const [reviewError, setReviewError] = useState("");

    const [editingReview, setEditingReview] = useState(false);

    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        loadProduct();
        loadReviews();
    }, [id]);

    useEffect(() => {
        if (product) {
            loadRelatedProducts();
        }
    }, [product]);

    useEffect(() => {
        if (isCustomer) {
            loadWishlistStatus();
            loadMyReview();
        } else {
            setMyReview(null);
        }
    }, [id, isCustomer]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/api/products/${id}`
            );

            if (!response.data.success) {
                setError("Product could not be loaded.");
                return;
            }

            const productData = response.data.product;

            setProduct(productData);

            const productImages =
                productData.images ||
                productData.product_images ||
                [];

            if (productImages.length > 0) {
                const formattedImages = productImages
                    .map((image) => {
                        if (typeof image === "string") {
                            return image;
                        }

                        return (
                            image.image_url ||
                            image.url ||
                            ""
                        );
                    })
                    .filter(Boolean);

                setImages(formattedImages);

                if (formattedImages.length > 0) {
                    setSelectedImage(formattedImages[0]);
                }
            } else if (productData.image_url) {
                setImages([productData.image_url]);
                setSelectedImage(productData.image_url);
            } else {
                setImages([]);
                setSelectedImage("");
            }
        } catch (err) {
            console.error(
                "Load product error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load product."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/reviews/product/${id}`
            );

            if (!response.data.success) {
                return;
            }

            setReviews(
                response.data.reviews || []
            );

            setAverageRating(
                Number(
                    response.data.average_rating || 0
                )
            );

            setTotalReviews(
                Number(
                    response.data.total_reviews || 0
                )
            );

            setRatingCounts({
                5: Number(
                    response.data.rating_counts?.[5] ||
                    response.data.five_star ||
                    0
                ),
                4: Number(
                    response.data.rating_counts?.[4] ||
                    response.data.four_star ||
                    0
                ),
                3: Number(
                    response.data.rating_counts?.[3] ||
                    response.data.three_star ||
                    0
                ),
                2: Number(
                    response.data.rating_counts?.[2] ||
                    response.data.two_star ||
                    0
                ),
                1: Number(
                    response.data.rating_counts?.[1] ||
                    response.data.one_star ||
                    0
                )
            });
        } catch (err) {
            console.error(
                "Load reviews error:",
                err
            );
        }
    };

    const loadMyReview = async () => {
        if (!isCustomer) {
            return;
        }

        try {
            const response = await axios.get(
                `${API_URL}/api/reviews/product/${id}/my`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const review =
                    response.data.review || null;

                setMyReview(review);

                if (review) {
                    setReviewRating(
                        Number(review.rating)
                    );

                    setReviewComment(
                        review.comment || ""
                    );
                } else {
                    setReviewRating(5);
                    setReviewComment("");
                }
            }
        } catch (err) {
            console.error(
                "Load my review error:",
                err
            );
        }
    };

    const loadWishlistStatus = async () => {
        if (!isCustomer) {
            return;
        }

        try {
            const response = await axios.get(
                `${API_URL}/api/wishlist/check/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setIsWishlisted(
                    Boolean(
                        response.data.isWishlisted
                    )
                );
            }
        } catch (err) {
            console.error(
                "Wishlist check error:",
                err
            );
        }
    };

    const loadRelatedProducts = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/products`
            );

            if (!response.data.success) {
                return;
            }

            const allProducts =
                response.data.products || [];

            const currentCategoryId =
                product?.category_id;

            const filtered = allProducts
                .filter(
                    (item) =>
                        String(item.id) !==
                        String(id)
                )
                .filter((item) => {
                    if (!currentCategoryId) {
                        return true;
                    }

                    return (
                        String(item.category_id) ===
                        String(currentCategoryId)
                    );
                })
                .slice(0, 4);

            setRelatedProducts(filtered);
        } catch (err) {
            console.error(
                "Load related products error:",
                err
            );
        }
    };

    const getCurrentPrice = () => {
        if (!product) {
            return 0;
        }

        if (
            product.discount_price !== null &&
            product.discount_price !== undefined &&
            Number(product.discount_price) > 0
        ) {
            return Number(
                product.discount_price
            );
        }

        return Number(product.price || 0);
    };

    const getOriginalPrice = () => {
        if (!product) {
            return 0;
        }

        return Number(product.price || 0);
    };

    const getDiscountPercentage = () => {
        const original =
            getOriginalPrice();

        const current =
            getCurrentPrice();

        if (
            original <= 0 ||
            current >= original
        ) {
            return 0;
        }

        return Math.round(
            ((original - current) / original) *
            100
        );
    };

    const getAvailableStock = () => {
        if (!product) {
            return 0;
        }

        if (
            product.available_stock !==
                undefined &&
            product.available_stock !== null
        ) {
            return Number(
                product.available_stock
            );
        }

        if (
            product.stock_quantity !==
            undefined
        ) {
            const reserved =
                Number(
                    product.reserved_quantity ||
                    0
                );

            return Math.max(
                0,
                Number(
                    product.stock_quantity
                ) - reserved
            );
        }

        if (
            product.inventory &&
            product.inventory.stock_quantity !==
                undefined
        ) {
            const reserved =
                Number(
                    product.inventory
                        .reserved_quantity ||
                    0
                );

            return Math.max(
                0,
                Number(
                    product.inventory
                        .stock_quantity
                ) - reserved
            );
        }

        return 0;
    };

    const availableStock =
        getAvailableStock();

    const increaseQuantity = () => {
        if (
            quantity < availableStock
        ) {
            setQuantity(
                quantity + 1
            );
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(
                quantity - 1
            );
        }
    };

    const addToCart = async () => {
        if (!isCustomer) {
            navigate("/login");
            return;
        }

        if (availableStock <= 0) {
            setCartError(
                "This product is currently out of stock."
            );
            return;
        }

        try {
            setCartMessage("");
            setCartError("");

            await axios.post(
                `${API_URL}/api/cart/items`,
                {
                    product_id: product.id,
                    quantity: quantity
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setCartMessage(
                "Product added to cart successfully."
            );
        } catch (err) {
            console.error(
                "Add to cart error:",
                err
            );

            setCartError(
                err.response?.data?.message ||
                "Failed to add product to cart."
            );
        }
    };

    const buyNow = async () => {
        if (!isCustomer) {
            navigate("/login");
            return;
        }

        if (availableStock <= 0) {
            setCartError(
                "This product is currently out of stock."
            );
            return;
        }

        try {
            setCartMessage("");
            setCartError("");

            await axios.post(
                `${API_URL}/api/cart/items`,
                {
                    product_id: product.id,
                    quantity: quantity
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            navigate("/checkout");
        } catch (err) {
            console.error(
                "Buy now error:",
                err
            );

            setCartError(
                err.response?.data?.message ||
                "Unable to continue to checkout."
            );
        }
    };

    const toggleWishlist = async () => {
        if (!isCustomer) {
            navigate("/login");
            return;
        }

        try {
            setWishlistLoading(true);
            setWishlistMessage("");

            if (isWishlisted) {
                await axios.delete(
                    `${API_URL}/api/wishlist/items/${id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setIsWishlisted(false);

                setWishlistMessage(
                    "Removed from wishlist."
                );
            } else {
                await axios.post(
                    `${API_URL}/api/wishlist/items`,
                    {
                        product_id: product.id
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setIsWishlisted(true);

                setWishlistMessage(
                    "Added to wishlist."
                );
            }
        } catch (err) {
            console.error(
                "Wishlist error:",
                err
            );

            setWishlistMessage(
                err.response?.data?.message ||
                "Wishlist operation failed."
            );
        } finally {
            setWishlistLoading(false);
        }
    };

    const startEditReview = () => {
        if (!myReview) {
            return;
        }

        setReviewRating(
            Number(myReview.rating)
        );

        setReviewComment(
            myReview.comment || ""
        );

        setEditingReview(true);
        setReviewMessage("");
        setReviewError("");
    };

    const cancelEditReview = () => {
        setEditingReview(false);

        if (myReview) {
            setReviewRating(
                Number(myReview.rating)
            );

            setReviewComment(
                myReview.comment || ""
            );
        }
    };

    const submitReview = async (event) => {
        event.preventDefault();

        if (!isCustomer) {
            navigate("/login");
            return;
        }

        if (!reviewComment.trim()) {
            setReviewError(
                "Please write a review."
            );
            return;
        }

        if (
            reviewComment.trim().length >
            1000
        ) {
            setReviewError(
                "Review cannot exceed 1000 characters."
            );
            return;
        }

        try {
            setReviewLoading(true);
            setReviewMessage("");
            setReviewError("");

            if (editingReview && myReview) {
                await axios.put(
                    `${API_URL}/api/reviews/${myReview.id}`,
                    {
                        rating: reviewRating,
                        comment:
                            reviewComment.trim()
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setReviewMessage(
                    "Review updated successfully."
                );
            } else {
                await axios.post(
                    `${API_URL}/api/reviews/product/${product.id}`,
                    {
                        rating: reviewRating,
                        comment:
                            reviewComment.trim()
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setReviewMessage(
                    "Review submitted successfully."
                );
            }

            setEditingReview(false);

            await loadReviews();
            await loadMyReview();
        } catch (err) {
            console.error(
                "Submit review error:",
                err
            );

            setReviewError(
                err.response?.data?.message ||
                "Failed to save review."
            );
        } finally {
            setReviewLoading(false);
        }
    };

    const deleteReview = async () => {
        if (!isCustomer || !myReview) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete your review?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setReviewLoading(true);
            setReviewError("");
            setReviewMessage("");

            await axios.delete(
                `${API_URL}/api/reviews/${myReview.id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setMyReview(null);
            setReviewRating(5);
            setReviewComment("");
            setEditingReview(false);

            setReviewMessage(
                "Review deleted successfully."
            );

            await loadReviews();
        } catch (err) {
            console.error(
                "Delete review error:",
                err
            );

            setReviewError(
                err.response?.data?.message ||
                "Failed to delete review."
            );
        } finally {
            setReviewLoading(false);
        }
    };

    const formatPrice = (price) => {
        return Number(price || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        );
    };

    const renderStars = (rating) => {
        const rounded = Math.max(
            0,
            Math.min(
                5,
                Math.round(
                    Number(rating || 0)
                )
            )
        );

        return (
            <span
                style={{
                    color: "#f59e0b",
                    letterSpacing: "2px"
                }}
            >
                {"★".repeat(rounded)}

                <span
                    style={{
                        color: "#d1d5db"
                    }}
                >
                    {"★".repeat(
                        5 - rounded
                    )}
                </span>
            </span>
        );
    };

    const getRatingPercentage = (count) => {
        if (totalReviews <= 0) {
            return 0;
        }

        return Math.round(
            (count / totalReviews) *
                100
        );
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px"
                }}
            >
                Loading product...
            </div>
        );
    }

    if (error || !product) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "20px",
                    padding: "20px"
                }}
            >
                <h2>
                    Unable to load product
                </h2>

                <p
                    style={{
                        color: "#dc2626"
                    }}
                >
                    {error ||
                        "Product not found."}
                </p>

                <Link
                    to="/"
                    style={{
                        padding:
                            "10px 20px",
                        background:
                            "#111827",
                        color: "white",
                        textDecoration:
                            "none",
                        borderRadius: "6px"
                    }}
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    const currentPrice =
        getCurrentPrice();

    const originalPrice =
        getOriginalPrice();

    const discountPercentage =
        getDiscountPercentage();

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                color: "#111827",
                fontFamily:
                    "Arial, Helvetica, sans-serif"
            }}
        >
            <header
                style={{
                    background: "#111827",
                    color: "white",
                    padding: "16px 5%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        "space-between",
                    gap: "20px",
                    flexWrap: "wrap"
                }}
            >
                <Link
                    to="/"
                    style={{
                        color: "white",
                        textDecoration:
                            "none",
                        fontSize: "24px",
                        fontWeight: "700"
                    }}
                >
                    ShopZone
                </Link>

                <nav
                    style={{
                        display: "flex",
                        alignItems:
                            "center",
                        gap: "15px",
                        flexWrap: "wrap"
                    }}
                >
                    <Link
                        to="/"
                        style={{
                            color: "white",
                            textDecoration:
                                "none"
                        }}
                    >
                        Home
                    </Link>

                    {isCustomer && (
                        <>
                            <Link
                                to="/wishlist"
                                style={{
                                    color:
                                        "white",
                                    textDecoration:
                                        "none"
                                }}
                            >
                                ❤️ Wishlist
                            </Link>

                            <Link
                                to="/cart"
                                style={{
                                    color:
                                        "white",
                                    textDecoration:
                                        "none"
                                }}
                            >
                                🛒 Cart
                            </Link>

                            <Link
                                to="/orders"
                                style={{
                                    color:
                                        "white",
                                    textDecoration:
                                        "none"
                                }}
                            >
                                My Orders
                            </Link>

                            <Link
                                to="/profile"
                                style={{
                                    color:
                                        "white",
                                    textDecoration:
                                        "none"
                                }}
                            >
                                Profile
                            </Link>
                        </>
                    )}

                    {!isCustomer && (
                        <>
                            <Link
                                to="/login"
                                style={{
                                    color:
                                        "white",
                                    textDecoration:
                                        "none"
                                }}
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                style={{
                                    color:
                                        "white",
                                    textDecoration:
                                        "none"
                                }}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            <main
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "35px 20px"
                }}
            >
                <div
                    style={{
                        marginBottom:
                            "25px",
                        color: "#6b7280",
                        fontSize: "14px"
                    }}
                >
                    <Link
                        to="/"
                        style={{
                            color: "#2563eb",
                            textDecoration:
                                "none"
                        }}
                    >
                        Home
                    </Link>

                    {" / "}

                    {product.category_name ||
                        product.category ||
                        "Products"}

                    {" / "}

                    {product.name}
                </div>

                <section
                    style={{
                        background: "white",
                        borderRadius: "14px",
                        padding: "30px",
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(0, 1fr) minmax(0, 1fr)",
                        gap: "45px",
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,0.06)"
                    }}
                >
                    <div>
                        <div
                            style={{
                                height: "480px",
                                background:
                                    "#f9fafb",
                                borderRadius:
                                    "12px",
                                display: "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                overflow:
                                    "hidden",
                                border:
                                    "1px solid #e5e7eb"
                            }}
                        >
                            {selectedImage ? (
                                <img
                                    src={
                                        selectedImage
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
                                <div
                                    style={{
                                        color:
                                            "#9ca3af",
                                        fontSize:
                                            "18px"
                                    }}
                                >
                                    No image available
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div
                                style={{
                                    display:
                                        "flex",
                                    gap: "12px",
                                    marginTop:
                                        "15px",
                                    overflowX:
                                        "auto"
                                }}
                            >
                                {images.map(
                                    (
                                        image,
                                        index
                                    ) => (
                                        <button
                                            key={
                                                index
                                            }
                                            onClick={() =>
                                                setSelectedImage(
                                                    image
                                                )
                                            }
                                            style={{
                                                width:
                                                    "80px",
                                                height:
                                                    "80px",
                                                padding:
                                                    "4px",
                                                background:
                                                    "white",
                                                border:
                                                    selectedImage ===
                                                    image
                                                        ? "2px solid #2563eb"
                                                        : "1px solid #d1d5db",
                                                borderRadius:
                                                    "8px",
                                                cursor:
                                                    "pointer",
                                                flexShrink:
                                                    0
                                            }}
                                        >
                                            <img
                                                src={
                                                    image
                                                }
                                                alt={`Product ${index + 1}`}
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "100%",
                                                    objectFit:
                                                        "contain"
                                                }}
                                            />
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        {product.brand && (
                            <p
                                style={{
                                    color:
                                        "#6b7280",
                                    fontSize:
                                        "15px",
                                    marginTop: 0
                                }}
                            >
                                {product.brand}
                            </p>
                        )}

                        <h1
                            style={{
                                fontSize:
                                    "34px",
                                lineHeight:
                                    1.2,
                                margin:
                                    "5px 0 15px"
                            }}
                        >
                            {product.name}
                        </h1>

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "10px",
                                marginBottom:
                                    "20px",
                                flexWrap:
                                    "wrap"
                            }}
                        >
                            {renderStars(
                                averageRating
                            )}

                            <span
                                style={{
                                    color:
                                        "#4b5563"
                                }}
                            >
                                {averageRating.toFixed(
                                    1
                                )} / 5
                            </span>

                            <span
                                style={{
                                    color:
                                        "#6b7280"
                                }}
                            >
                                ({totalReviews}{" "}
                                reviews)
                            </span>
                        </div>

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "12px",
                                flexWrap:
                                    "wrap",
                                marginBottom:
                                    "15px"
                            }}
                        >
                            <span
                                style={{
                                    fontSize:
                                        "32px",
                                    fontWeight:
                                        "700"
                                }}
                            >
                                ₹
                                {formatPrice(
                                    currentPrice
                                )}
                            </span>

                            {discountPercentage >
                                0 && (
                                <>
                                    <span
                                        style={{
                                            color:
                                                "#6b7280",
                                            textDecoration:
                                                "line-through",
                                            fontSize:
                                                "18px"
                                        }}
                                    >
                                        ₹
                                        {formatPrice(
                                            originalPrice
                                        )}
                                    </span>

                                    <span
                                        style={{
                                            background:
                                                "#dcfce7",
                                            color:
                                                "#166534",
                                            padding:
                                                "5px 10px",
                                            borderRadius:
                                                "6px",
                                            fontWeight:
                                                "600"
                                        }}
                                    >
                                        {
                                            discountPercentage
                                        }
                                        % OFF
                                    </span>
                                </>
                            )}
                        </div>

                        {discountPercentage >
                            0 && (
                            <p
                                style={{
                                    color:
                                        "#15803d",
                                    fontWeight:
                                        "600"
                                }}
                            >
                                You save ₹
                                {formatPrice(
                                    originalPrice -
                                        currentPrice
                                )}
                            </p>
                        )}

                        <div
                            style={{
                                borderTop:
                                    "1px solid #e5e7eb",
                                borderBottom:
                                    "1px solid #e5e7eb",
                                padding:
                                    "20px 0",
                                margin:
                                    "20px 0"
                            }}
                        >
                            <h3
                                style={{
                                    marginTop: 0
                                }}
                            >
                                Description
                            </h3>

                            <p
                                style={{
                                    color:
                                        "#4b5563",
                                    lineHeight:
                                        "1.7",
                                    whiteSpace:
                                        "pre-wrap"
                                }}
                            >
                                {product.description ||
                                    "No description available for this product."}
                            </p>
                        </div>

                        <div
                            style={{
                                marginBottom:
                                    "20px"
                            }}
                        >
                            {availableStock >
                            0 ? (
                                <div>
                                    <span
                                        style={{
                                            color:
                                                "#15803d",
                                            fontWeight:
                                                "700"
                                        }}
                                    >
                                        ✓ In Stock
                                    </span>

                                    <span
                                        style={{
                                            color:
                                                "#6b7280",
                                            marginLeft:
                                                "10px"
                                        }}
                                    >
                                        {
                                            availableStock
                                        }{" "}
                                        available
                                    </span>
                                </div>
                            ) : (
                                <span
                                    style={{
                                        color:
                                            "#dc2626",
                                        fontWeight:
                                            "700"
                                    }}
                                >
                                    ✕ Out of Stock
                                </span>
                            )}
                        </div>

                        {availableStock > 0 && (
                            <div
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap: "12px",
                                    marginBottom:
                                        "20px"
                                }}
                            >
                                <strong>
                                    Quantity:
                                </strong>

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        alignItems:
                                            "center",
                                        border:
                                            "1px solid #d1d5db",
                                        borderRadius:
                                            "8px",
                                        overflow:
                                            "hidden"
                                    }}
                                >
                                    <button
                                        onClick={
                                            decreaseQuantity
                                        }
                                        style={{
                                            width:
                                                "42px",
                                            height:
                                                "40px",
                                            border:
                                                "none",
                                            background:
                                                "#f3f4f6",
                                            cursor:
                                                "pointer",
                                            fontSize:
                                                "20px"
                                        }}
                                    >
                                        −
                                    </button>

                                    <span
                                        style={{
                                            width:
                                                "45px",
                                            textAlign:
                                                "center",
                                            fontWeight:
                                                "600"
                                        }}
                                    >
                                        {quantity}
                                    </span>

                                    <button
                                        onClick={
                                            increaseQuantity
                                        }
                                        style={{
                                            width:
                                                "42px",
                                            height:
                                                "40px",
                                            border:
                                                "none",
                                            background:
                                                "#f3f4f6",
                                            cursor:
                                                "pointer",
                                            fontSize:
                                                "20px"
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                background:
                                    "#f9fafb",
                                borderRadius:
                                    "10px",
                                padding:
                                    "15px",
                                marginBottom:
                                    "20px"
                            }}
                        >
                            <p
                                style={{
                                    margin:
                                        "0 0 8px",
                                    fontWeight:
                                        "600"
                                }}
                            >
                                🚚 Delivery
                            </p>

                            <p
                                style={{
                                    margin: 0,
                                    color:
                                        "#6b7280",
                                    fontSize:
                                        "14px"
                                }}
                            >
                                Free delivery on
                                orders above ₹1,000.
                                Standard delivery
                                available at checkout.
                            </p>
                        </div>

                        {cartMessage && (
                            <div
                                style={{
                                    background:
                                        "#dcfce7",
                                    color:
                                        "#166534",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "8px",
                                    marginBottom:
                                        "12px"
                                }}
                            >
                                {cartMessage}
                            </div>
                        )}

                        {cartError && (
                            <div
                                style={{
                                    background:
                                        "#fee2e2",
                                    color:
                                        "#991b1b",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "8px",
                                    marginBottom:
                                        "12px"
                                }}
                            >
                                {cartError}
                            </div>
                        )}

                        {wishlistMessage && (
                            <div
                                style={{
                                    background:
                                        "#f3f4f6",
                                    padding:
                                        "10px",
                                    borderRadius:
                                        "8px",
                                    marginBottom:
                                        "12px",
                                    color:
                                        "#374151"
                                }}
                            >
                                {
                                    wishlistMessage
                                }
                            </div>
                        )}

                        <div
                            style={{
                                display:
                                    "flex",
                                gap: "12px",
                                flexWrap:
                                    "wrap"
                            }}
                        >
                            <button
                                onClick={
                                    addToCart
                                }
                                disabled={
                                    availableStock <=
                                    0
                                }
                                style={{
                                    flex: 1,
                                    minWidth:
                                        "170px",
                                    padding:
                                        "14px 20px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "8px",
                                    background:
                                        availableStock >
                                        0
                                            ? "#f59e0b"
                                            : "#9ca3af",
                                    color:
                                        "white",
                                    fontWeight:
                                        "700",
                                    cursor:
                                        availableStock >
                                        0
                                            ? "pointer"
                                            : "not-allowed",
                                    fontSize:
                                        "16px"
                                }}
                            >
                                🛒 Add to Cart
                            </button>

                            <button
                                onClick={
                                    buyNow
                                }
                                disabled={
                                    availableStock <=
                                    0
                                }
                                style={{
                                    flex: 1,
                                    minWidth:
                                        "170px",
                                    padding:
                                        "14px 20px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "8px",
                                    background:
                                        availableStock >
                                        0
                                            ? "#111827"
                                            : "#9ca3af",
                                    color:
                                        "white",
                                    fontWeight:
                                        "700",
                                    cursor:
                                        availableStock >
                                        0
                                            ? "pointer"
                                            : "not-allowed",
                                    fontSize:
                                        "16px"
                                }}
                            >
                                ⚡ Buy Now
                            </button>

                            <button
                                onClick={
                                    toggleWishlist
                                }
                                disabled={
                                    wishlistLoading
                                }
                                style={{
                                    width:
                                        "55px",
                                    border:
                                        "1px solid #d1d5db",
                                    borderRadius:
                                        "8px",
                                    background:
                                        "white",
                                    cursor:
                                        wishlistLoading
                                            ? "not-allowed"
                                            : "pointer",
                                    fontSize:
                                        "22px"
                                }}
                            >
                                {isWishlisted
                                    ? "❤️"
                                    : "🤍"}
                            </button>
                        </div>

                        <div
                            style={{
                                marginTop:
                                    "20px"
                            }}
                        >
                            <Link
                                to="/wishlist"
                                style={{
                                    color:
                                        "#2563eb",
                                    textDecoration:
                                        "none"
                                }}
                            >
                                View My Wishlist →
                            </Link>
                        </div>
                    </div>
                </section>

                <section
                    style={{
                        background: "white",
                        borderRadius: "14px",
                        padding: "30px",
                        marginTop: "30px",
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,0.06)"
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0
                        }}
                    >
                        Customer Reviews
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "minmax(220px, 0.8fr) minmax(300px, 1.5fr)",
                            gap: "35px",
                            alignItems:
                                "center"
                        }}
                    >
                        <div
                            style={{
                                textAlign:
                                    "center",
                                padding:
                                    "20px"
                            }}
                        >
                            <div
                                style={{
                                    fontSize:
                                        "48px",
                                    fontWeight:
                                        "700"
                                }}
                            >
                                {averageRating.toFixed(
                                    1
                                )}
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        "24px",
                                    margin:
                                        "8px 0"
                                }}
                            >
                                {renderStars(
                                    averageRating
                                )}
                            </div>

                            <div
                                style={{
                                    color:
                                        "#6b7280"
                                }}
                            >
                                {totalReviews}{" "}
                                reviews
                            </div>
                        </div>

                        <div>
                            {[5, 4, 3, 2, 1].map(
                                (star) => {
                                    const count =
                                        ratingCounts[
                                            star
                                        ];

                                    const percentage =
                                        getRatingPercentage(
                                            count
                                        );

                                    return (
                                        <div
                                            key={
                                                star
                                            }
                                            style={{
                                                display:
                                                    "flex",
                                                alignItems:
                                                    "center",
                                                gap:
                                                    "10px",
                                                marginBottom:
                                                    "10px"
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width:
                                                        "50px"
                                                }}
                                            >
                                                {star} ★
                                            </span>

                                            <div
                                                style={{
                                                    flex:
                                                        1,
                                                    height:
                                                        "10px",
                                                    background:
                                                        "#e5e7eb",
                                                    borderRadius:
                                                        "10px",
                                                    overflow:
                                                        "hidden"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width:
                                                            `${percentage}%`,
                                                        height:
                                                            "100%",
                                                        background:
                                                            "#f59e0b"
                                                    }}
                                                />
                                            </div>

                                            <span
                                                style={{
                                                    width:
                                                        "45px",
                                                    color:
                                                        "#6b7280",
                                                    fontSize:
                                                        "14px"
                                                }}
                                            >
                                                {
                                                    count
                                                }
                                            </span>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {isCustomer && (
                        <div
                            style={{
                                marginTop:
                                    "30px",
                                padding:
                                    "22px",
                                background:
                                    "#f9fafb",
                                borderRadius:
                                    "10px"
                            }}
                        >
                            <h3
                                style={{
                                    marginTop:
                                        0
                                }}
                            >
                                {myReview &&
                                !editingReview
                                    ? "Your Review"
                                    : editingReview
                                    ? "Edit Your Review"
                                    : "Write a Review"}
                            </h3>

                            {myReview &&
                            !editingReview ? (
                                <div>
                                    <div
                                        style={{
                                            marginBottom:
                                                "10px"
                                        }}
                                    >
                                        {renderStars(
                                            myReview.rating
                                        )}
                                    </div>

                                    <p
                                        style={{
                                            lineHeight:
                                                "1.6",
                                            color:
                                                "#374151"
                                        }}
                                    >
                                        {
                                            myReview.comment
                                        }
                                    </p>

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            gap:
                                                "10px",
                                            flexWrap:
                                                "wrap"
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={
                                                startEditReview
                                            }
                                            style={{
                                                padding:
                                                    "10px 18px",
                                                border:
                                                    "none",
                                                borderRadius:
                                                    "7px",
                                                background:
                                                    "#2563eb",
                                                color:
                                                    "white",
                                                cursor:
                                                    "pointer",
                                                fontWeight:
                                                    "600"
                                            }}
                                        >
                                            ✏️ Edit Review
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                deleteReview
                                            }
                                            disabled={
                                                reviewLoading
                                            }
                                            style={{
                                                padding:
                                                    "10px 18px",
                                                border:
                                                    "none",
                                                borderRadius:
                                                    "7px",
                                                background:
                                                    "#dc2626",
                                                color:
                                                    "white",
                                                cursor:
                                                    "pointer",
                                                fontWeight:
                                                    "600"
                                            }}
                                        >
                                            🗑️ Delete Review
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={
                                        submitReview
                                    }
                                >
                                    <div
                                        style={{
                                            marginBottom:
                                                "15px"
                                        }}
                                    >
                                        <label
                                            style={{
                                                display:
                                                    "block",
                                                fontWeight:
                                                    "600"
                                            }}
                                        >
                                            Rating
                                        </label>

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                gap:
                                                    "5px",
                                                marginTop:
                                                    "8px"
                                            }}
                                        >
                                            {[
                                                1,
                                                2,
                                                3,
                                                4,
                                                5
                                            ].map(
                                                (
                                                    star
                                                ) => (
                                                    <button
                                                        type="button"
                                                        key={
                                                            star
                                                        }
                                                        onClick={() =>
                                                            setReviewRating(
                                                                star
                                                            )
                                                        }
                                                        style={{
                                                            border:
                                                                "none",
                                                            background:
                                                                "transparent",
                                                            cursor:
                                                                "pointer",
                                                            fontSize:
                                                                "30px",
                                                            color:
                                                                star <=
                                                                reviewRating
                                                                    ? "#f59e0b"
                                                                    : "#d1d5db"
                                                        }}
                                                    >
                                                        ★
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <textarea
                                        value={
                                            reviewComment
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setReviewComment(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Write your review..."
                                        maxLength={
                                            1000
                                        }
                                        rows="5"
                                        style={{
                                            width:
                                                "100%",
                                            boxSizing:
                                                "border-box",
                                            padding:
                                                "12px",
                                            border:
                                                "1px solid #d1d5db",
                                            borderRadius:
                                                "8px",
                                            resize:
                                                "vertical",
                                            fontFamily:
                                                "inherit"
                                        }}
                                    />

                                    <div
                                        style={{
                                            textAlign:
                                                "right",
                                            color:
                                                "#6b7280",
                                            fontSize:
                                                "13px",
                                            marginTop:
                                                "5px"
                                        }}
                                    >
                                        {
                                            reviewComment.length
                                        }
                                        /1000
                                    </div>

                                    {reviewMessage && (
                                        <p
                                            style={{
                                                color:
                                                    "#15803d"
                                            }}
                                        >
                                            {
                                                reviewMessage
                                            }
                                        </p>
                                    )}

                                    {reviewError && (
                                        <p
                                            style={{
                                                color:
                                                    "#dc2626"
                                            }}
                                        >
                                            {
                                                reviewError
                                            }
                                        </p>
                                    )}

                                    <div
                                        style={{
                                            display:
                                                "flex",
                                            gap:
                                                "10px",
                                            marginTop:
                                                "12px"
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            disabled={
                                                reviewLoading
                                            }
                                            style={{
                                                padding:
                                                    "11px 20px",
                                                border:
                                                    "none",
                                                borderRadius:
                                                    "7px",
                                                background:
                                                    "#111827",
                                                color:
                                                    "white",
                                                cursor:
                                                    "pointer",
                                                fontWeight:
                                                    "600"
                                            }}
                                        >
                                            {reviewLoading
                                                ? "Saving..."
                                                : editingReview
                                                ? "Update Review"
                                                : "Submit Review"}
                                        </button>

                                        {editingReview && (
                                            <button
                                                type="button"
                                                onClick={
                                                    cancelEditReview
                                                }
                                                style={{
                                                    padding:
                                                        "11px 20px",
                                                    border:
                                                        "1px solid #d1d5db",
                                                    borderRadius:
                                                        "7px",
                                                    background:
                                                        "white",
                                                    cursor:
                                                        "pointer",
                                                    fontWeight:
                                                        "600"
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {!isCustomer && (
                        <div
                            style={{
                                marginTop:
                                    "25px",
                                padding:
                                    "15px",
                                background:
                                    "#f9fafb",
                                borderRadius:
                                    "8px",
                                color:
                                    "#6b7280"
                            }}
                        >
                            Please{" "}
                            <Link
                                to="/login"
                                style={{
                                    color:
                                        "#2563eb",
                                    fontWeight:
                                        "600"
                                }}
                            >
                                login
                            </Link>{" "}
                            to write a review.
                        </div>
                    )}

                    <div
                        style={{
                            marginTop:
                                "30px"
                        }}
                    >
                        {reviews.length === 0 ? (
                            <div
                                style={{
                                    padding:
                                        "30px",
                                    textAlign:
                                        "center",
                                    color:
                                        "#6b7280",
                                    borderTop:
                                        "1px solid #e5e7eb"
                                }}
                            >
                                No reviews yet.
                                Be the first
                                customer to review
                                this product.
                            </div>
                        ) : (
                            reviews.map(
                                (review) => (
                                    <div
                                        key={
                                            review.id
                                        }
                                        style={{
                                            borderTop:
                                                "1px solid #e5e7eb",
                                            padding:
                                                "20px 0"
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
                                                flexWrap:
                                                    "wrap"
                                            }}
                                        >
                                            <div>
                                                <strong>
                                                    {review.user_name ||
                                                        review.name ||
                                                        "Customer"}
                                                </strong>

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "5px"
                                                    }}
                                                >
                                                    {renderStars(
                                                        review.rating
                                                    )}
                                                </div>
                                            </div>

                                            {isCustomer &&
                                                Number(
                                                    review.user_id
                                                ) ===
                                                    Number(
                                                        user.id
                                                    ) && (
                                                    <span
                                                        style={{
                                                            color:
                                                                "#2563eb",
                                                            fontSize:
                                                                "13px",
                                                            fontWeight:
                                                                "600"
                                                        }}
                                                    >
                                                        Your
                                                        review
                                                    </span>
                                                )}
                                        </div>

                                        <p
                                            style={{
                                                color:
                                                    "#374151",
                                                lineHeight:
                                                    "1.6",
                                                margin:
                                                    "12px 0"
                                            }}
                                        >
                                            {
                                                review.comment
                                            }
                                        </p>

                                        <small
                                            style={{
                                                color:
                                                    "#9ca3af"
                                            }}
                                        >
                                            {review.created_at
                                                ? new Date(
                                                      review.created_at
                                                  ).toLocaleDateString(
                                                      "en-IN"
                                                  )
                                                : ""}
                                        </small>
                                    </div>
                                )
                            )
                        )}
                    </div>
                </section>

                {relatedProducts.length > 0 && (
                    <section
                        style={{
                            marginTop:
                                "30px"
                        }}
                    >
                        <h2>
                            Related Products
                        </h2>

                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "20px"
                            }}
                        >
                            {relatedProducts.map(
                                (item) => {
                                    const itemPrice =
                                        item.discount_price !==
                                            null &&
                                        item.discount_price !==
                                            undefined &&
                                        Number(
                                            item.discount_price
                                        ) > 0
                                            ? Number(
                                                  item.discount_price
                                              )
                                            : Number(
                                                  item.price ||
                                                      0
                                              );

                                    const itemImage =
                                        item.primary_image ||
                                        item.image_url ||
                                        "";

                                    return (
                                        <div
                                            key={
                                                item.id
                                            }
                                            style={{
                                                background:
                                                    "white",
                                                borderRadius:
                                                    "12px",
                                                padding:
                                                    "15px",
                                                boxShadow:
                                                    "0 3px 15px rgba(0,0,0,0.05)"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height:
                                                        "200px",
                                                    background:
                                                        "#f9fafb",
                                                    borderRadius:
                                                        "8px",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    overflow:
                                                        "hidden"
                                                }}
                                            >
                                                {itemImage ? (
                                                    <img
                                                        src={
                                                            itemImage
                                                        }
                                                        alt={
                                                            item.name
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
                                                                "#9ca3af"
                                                        }}
                                                    >
                                                        No image
                                                    </span>
                                                )}
                                            </div>

                                            <h3
                                                style={{
                                                    fontSize:
                                                        "17px",
                                                    margin:
                                                        "15px 0 8px"
                                                }}
                                            >
                                                {
                                                    item.name
                                                }
                                            </h3>

                                            <p
                                                style={{
                                                    fontWeight:
                                                        "700",
                                                    fontSize:
                                                        "18px"
                                                }}
                                            >
                                                ₹
                                                {formatPrice(
                                                    itemPrice
                                                )}
                                            </p>

                                            <Link
                                                to={`/product/${item.id}`}
                                                style={{
                                                    display:
                                                        "block",
                                                    textAlign:
                                                        "center",
                                                    padding:
                                                        "10px",
                                                    background:
                                                        "#111827",
                                                    color:
                                                        "white",
                                                    textDecoration:
                                                        "none",
                                                    borderRadius:
                                                        "7px"
                                                }}
                                            >
                                                View Product
                                            </Link>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </section>
                )}
            </main>

            <footer
                style={{
                    background:
                        "#111827",
                    color: "white",
                    textAlign:
                        "center",
                    padding:
                        "25px",
                    marginTop:
                        "40px"
                }}
            >
                <p
                    style={{
                        margin: 0
                    }}
                >
                    © 2026 ShopZone. All rights
                    reserved.
                </p>
            </footer>
        </div>
    );
}

export default ProductDetails;