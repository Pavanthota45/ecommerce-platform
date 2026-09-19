import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import NotificationBell from "./NotificationBell";

const API_URL = "http://localhost:5000";

function CustomerHome() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState("newest");

    const [cartCount, setCartCount] = useState(0);


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!storedUser || !token) {
            navigate("/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);

            if (parsedUser.role !== "customer") {
                navigate("/admin");
                return;
            }

            setUser(parsedUser);

            loadCategories();
            loadProducts();
            loadCart();

        } catch (error) {
            console.error("User parsing error:", error);

            localStorage.removeItem("user");
            localStorage.removeItem("token");

            navigate("/login");
        }
    }, [navigate]);


    // =====================================================
    // LOAD CATEGORIES
    // =====================================================

    const loadCategories = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/categories`
            );

            if (response.data.success) {
                setCategories(
                    response.data.categories || []
                );
            }

        } catch (error) {
            console.error(
                "Category loading error:",
                error
            );
        }
    };


    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    const loadProducts = async () => {
        try {
            setLoadingProducts(true);
            setError("");

            const params = {};

            if (search.trim() !== "") {
                params.search = search.trim();
            }

            if (selectedCategory !== "") {
                params.category_id =
                    selectedCategory;
            }

            if (selectedBrand !== "") {
                params.brand =
                    selectedBrand;
            }

            if (minPrice !== "") {
                params.min_price =
                    minPrice;
            }

            if (maxPrice !== "") {
                params.max_price =
                    maxPrice;
            }

            if (sort !== "") {
                params.sort = sort;
            }


            const response = await axios.get(
                `${API_URL}/api/products`,
                {
                    params
                }
            );


            if (response.data.success) {
                setProducts(
                    response.data.products || []
                );
            } else {
                setProducts([]);
            }

        } catch (error) {
            console.error(
                "Product loading error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load products."
            );

            setProducts([]);

        } finally {
            setLoadingProducts(false);
            setLoading(false);
        }
    };


    // =====================================================
    // LOAD CART
    // =====================================================

    const loadCart = async () => {
        try {
            const token =
                localStorage.getItem("token");

            if (!token) {
                return;
            }

            const response = await axios.get(
                `${API_URL}/api/cart`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


            if (response.data.success) {

                const items =
                    response.data.items ||
                    response.data.cart_items ||
                    response.data.cart?.items ||
                    [];

                const count =
                    items.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.quantity || 0
                            ),
                        0
                    );

                setCartCount(count);
            }

        } catch (error) {
            console.error(
                "Cart loading error:",
                error
            );
        }
    };


    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        loadProducts();
    };


    // =====================================================
    // APPLY FILTERS
    // =====================================================

    const applyFilters = () => {
        loadProducts();
    };


    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    const clearFilters = () => {

        setSearch("");
        setSelectedCategory("");
        setSelectedBrand("");
        setMinPrice("");
        setMaxPrice("");
        setSort("newest");

        setTimeout(() => {
            loadProductsWithValues({
                search: "",
                selectedCategory: "",
                selectedBrand: "",
                minPrice: "",
                maxPrice: "",
                sort: "newest"
            });
        }, 0);
    };


    // =====================================================
    // LOAD PRODUCTS WITH SPECIFIC VALUES
    // =====================================================

    const loadProductsWithValues = async ({
        search: searchValue,
        selectedCategory: categoryValue,
        selectedBrand: brandValue,
        minPrice: minPriceValue,
        maxPrice: maxPriceValue,
        sort: sortValue
    }) => {

        try {
            setLoadingProducts(true);
            setError("");

            const params = {};

            if (searchValue.trim() !== "") {
                params.search =
                    searchValue.trim();
            }

            if (categoryValue !== "") {
                params.category_id =
                    categoryValue;
            }

            if (brandValue !== "") {
                params.brand =
                    brandValue;
            }

            if (minPriceValue !== "") {
                params.min_price =
                    minPriceValue;
            }

            if (maxPriceValue !== "") {
                params.max_price =
                    maxPriceValue;
            }

            if (sortValue !== "") {
                params.sort =
                    sortValue;
            }


            const response = await axios.get(
                `${API_URL}/api/products`,
                {
                    params
                }
            );


            if (response.data.success) {
                setProducts(
                    response.data.products || []
                );
            } else {
                setProducts([]);
            }

        } catch (error) {

            console.error(
                "Filtered product loading error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load products."
            );

        } finally {
            setLoadingProducts(false);
        }
    };


    // =====================================================
    // BRAND LIST
    // =====================================================

    const brands = useMemo(() => {

        const uniqueBrands = [
            ...new Set(
                products
                    .map((product) =>
                        product.brand
                    )
                    .filter(
                        (brand) =>
                            brand &&
                            brand.trim() !== ""
                    )
            )
        ];

        return uniqueBrands.sort();

    }, [products]);


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.removeItem("user");
        localStorage.removeItem("token");

        navigate("/login");
    };


    // =====================================================
    // PRICE DISPLAY
    // =====================================================

    const formatCurrency = (value) => {

        return Number(value || 0).toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2
            }
        );
    };


    // =====================================================
    // PRODUCT PRICE
    // =====================================================

    const getProductPrice = (product) => {

        if (
            product.discount_price !== null &&
            product.discount_price !== undefined &&
            Number(product.discount_price) <
                Number(product.price)
        ) {
            return Number(
                product.discount_price
            );
        }

        return Number(product.price || 0);
    };


    // =====================================================
    // DISCOUNT PERCENTAGE
    // =====================================================

    const getDiscountPercentage = (product) => {

        if (
            product.discount_price === null ||
            product.discount_price === undefined
        ) {
            return 0;
        }

        const price =
            Number(product.price || 0);

        const discountPrice =
            Number(product.discount_price);

        if (
            price <= 0 ||
            discountPrice >= price
        ) {
            return 0;
        }

        return Math.round(
            ((price - discountPrice) /
                price) *
                100
        );
    };


    // =====================================================
    // STOCK STATUS
    // =====================================================

    const getStockStatus = (product) => {

        const stock =
            Number(
                product.available_stock ||
                0
            );

        if (stock <= 0) {
            return {
                text: "Out of Stock",
                type: "out"
            };
        }

        if (stock <= 5) {
            return {
                text: `Only ${stock} left`,
                type: "low"
            };
        }

        return {
            text: "In Stock",
            type: "in"
        };
    };


    // =====================================================
    // PRODUCT IMAGE
    // =====================================================

    const getProductImage = (product) => {

        if (product.image_url) {
            return product.image_url;
        }

        if (
            product.images &&
            product.images.length > 0
        ) {
            return product.images[0].image_url;
        }

        return "https://placehold.co/400x400?text=No+Image";
    };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div style={styles.page}>

            {/* ==========================================
                HEADER
            ========================================== */}

            <header style={styles.header}>

                <Link
                    to="/"
                    style={styles.logo}
                >
                    E-Commerce Store
                </Link>


                <form
                    onSubmit={handleSearchSubmit}
                    style={styles.searchForm}
                >

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search products, brands, categories..."
                        style={styles.searchInput}
                    />

                    <button
                        type="submit"
                        style={styles.searchButton}
                    >
                        🔎 Search
                    </button>

                </form>


                <div style={styles.headerRight}>

                    <span style={styles.userName}>
                        Hi, {user?.name || "Customer"}
                    </span>

                    <NotificationBell />


                    <Link
                        to="/cart"
                        style={styles.headerLink}
                    >
                        🛒 Cart
                        {cartCount > 0 && (
                            <span
                                style={
                                    styles.cartBadge
                                }
                            >
                                {cartCount}
                            </span>
                        )}
                    </Link>


                    <Link
                        to="/wishlist"
                        style={styles.headerLink}
                    >
                        ❤️ Wishlist
                    </Link>


                    <Link
                        to="/orders"
                        style={styles.headerLink}
                    >
                        📦 Orders
                    </Link>


                    <Link
                        to="/profile"
                        style={styles.headerLink}
                    >
                        👤 Profile
                    </Link>


                    <button
                        onClick={logout}
                        style={styles.logoutButton}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ==========================================
                MAIN
            ========================================== */}

            <main style={styles.container}>

                <section style={styles.hero}>

                    <div>
                        <h1 style={styles.heroTitle}>
                            Discover Products
                        </h1>

                        <p style={styles.heroText}>
                            Search, filter and sort
                            products to find exactly
                            what you need.
                        </p>
                    </div>

                </section>


                {/* ======================================
                    FILTER SECTION
                ====================================== */}

                <section style={styles.filterCard}>

                    <div style={styles.filterHeader}>

                        <h2 style={styles.filterTitle}>
                            🔎 Filters
                        </h2>

                        <button
                            onClick={clearFilters}
                            style={styles.clearButton}
                        >
                            Clear Filters
                        </button>

                    </div>


                    <div style={styles.filterGrid}>

                        {/* CATEGORY */}

                        <div style={styles.filterGroup}>

                            <label
                                style={
                                    styles.filterLabel
                                }
                            >
                                Category
                            </label>

                            <select
                                value={
                                    selectedCategory
                                }
                                onChange={(event) =>
                                    setSelectedCategory(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.select
                                }
                            >

                                <option value="">
                                    All Categories
                                </option>

                                {categories.map(
                                    (category) => (
                                        <option
                                            key={
                                                category.id
                                            }
                                            value={
                                                category.id
                                            }
                                        >
                                            {
                                                category.name
                                            }
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        {/* BRAND */}

                        <div style={styles.filterGroup}>

                            <label
                                style={
                                    styles.filterLabel
                                }
                            >
                                Brand
                            </label>

                            <select
                                value={
                                    selectedBrand
                                }
                                onChange={(event) =>
                                    setSelectedBrand(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.select
                                }
                            >

                                <option value="">
                                    All Brands
                                </option>

                                {brands.map(
                                    (brand) => (
                                        <option
                                            key={brand}
                                            value={brand}
                                        >
                                            {brand}
                                        </option>
                                    )
                                )}

                            </select>

                        </div>


                        {/* MIN PRICE */}

                        <div style={styles.filterGroup}>

                            <label
                                style={
                                    styles.filterLabel
                                }
                            >
                                Minimum Price
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={minPrice}
                                onChange={(event) =>
                                    setMinPrice(
                                        event.target.value
                                    )
                                }
                                placeholder="₹ Min"
                                style={
                                    styles.priceInput
                                }
                            />

                        </div>


                        {/* MAX PRICE */}

                        <div style={styles.filterGroup}>

                            <label
                                style={
                                    styles.filterLabel
                                }
                            >
                                Maximum Price
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={maxPrice}
                                onChange={(event) =>
                                    setMaxPrice(
                                        event.target.value
                                    )
                                }
                                placeholder="₹ Max"
                                style={
                                    styles.priceInput
                                }
                            />

                        </div>


                        {/* SORT */}

                        <div style={styles.filterGroup}>

                            <label
                                style={
                                    styles.filterLabel
                                }
                            >
                                Sort By
                            </label>

                            <select
                                value={sort}
                                onChange={(event) =>
                                    setSort(
                                        event.target.value
                                    )
                                }
                                style={
                                    styles.select
                                }
                            >

                                <option value="newest">
                                    Newest
                                </option>

                                <option value="price_asc">
                                    Price: Low to High
                                </option>

                                <option value="price_desc">
                                    Price: High to Low
                                </option>

                                <option value="name_asc">
                                    Name: A to Z
                                </option>

                                <option value="name_desc">
                                    Name: Z to A
                                </option>

                                <option value="oldest">
                                    Oldest
                                </option>

                            </select>

                        </div>


                        {/* APPLY */}

                        <div
                            style={
                                styles.applyGroup
                            }
                        >

                            <button
                                onClick={applyFilters}
                                style={
                                    styles.applyButton
                                }
                            >
                                Apply Filters
                            </button>

                        </div>

                    </div>

                </section>


                {/* ======================================
                    RESULTS HEADER
                ====================================== */}

                <section style={styles.resultsHeader}>

                    <div>

                        <h2 style={styles.resultsTitle}>
                            Products
                        </h2>

                        <p style={styles.resultsCount}>
                            {loadingProducts
                                ? "Loading..."
                                : `${products.length} product${
                                    products.length === 1
                                        ? ""
                                        : "s"
                                } found`}
                        </p>

                    </div>

                </section>


                {/* ======================================
                    ERROR
                ====================================== */}

                {error && (
                    <div style={styles.errorBox}>
                        {error}
                    </div>
                )}


                {/* ======================================
                    LOADING
                ====================================== */}

                {loadingProducts && (
                    <div style={styles.loadingBox}>
                        <div style={styles.spinner}></div>

                        <p>
                            Loading products...
                        </p>
                    </div>
                )}


                {/* ======================================
                    PRODUCTS
                ====================================== */}

                {!loadingProducts &&
                    products.length > 0 && (

                        <div style={styles.productGrid}>

                            {products.map(
                                (product) => {

                                    const price =
                                        getProductPrice(
                                            product
                                        );

                                    const discount =
                                        getDiscountPercentage(
                                            product
                                        );

                                    const stock =
                                        getStockStatus(
                                            product
                                        );

                                    return (
                                        <Link
                                            key={
                                                product.id
                                            }
                                            to={`/product/${product.id}`}
                                            style={
                                                styles.productCard
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.imageContainer
                                                }
                                            >

                                                <img
                                                    src={getProductImage(
                                                        product
                                                    )}
                                                    alt={
                                                        product.name
                                                    }
                                                    style={
                                                        styles.productImage
                                                    }
                                                    onError={(
                                                        event
                                                    ) => {
                                                        event.currentTarget.src =
                                                            "https://placehold.co/400x400?text=No+Image";
                                                    }}
                                                />

                                                {discount >
                                                    0 && (
                                                    <span
                                                        style={
                                                            styles.discountBadge
                                                        }
                                                    >
                                                        {discount}%
                                                        OFF
                                                    </span>
                                                )}

                                            </div>


                                            <div
                                                style={
                                                    styles.productContent
                                                }
                                            >

                                                <p
                                                    style={
                                                        styles.categoryName
                                                    }
                                                >
                                                    {
                                                        product.category_name ||
                                                        "Product"
                                                    }
                                                </p>


                                                <h3
                                                    style={
                                                        styles.productName
                                                    }
                                                >
                                                    {
                                                        product.name
                                                    }
                                                </h3>


                                                {product.brand && (
                                                    <p
                                                        style={
                                                            styles.brand
                                                        }
                                                    >
                                                        Brand:{" "}
                                                        {
                                                            product.brand
                                                        }
                                                    </p>
                                                )}


                                                <div
                                                    style={
                                                        styles.priceRow
                                                    }
                                                >

                                                    <strong
                                                        style={
                                                            styles.currentPrice
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            price
                                                        )}
                                                    </strong>


                                                    {discount >
                                                        0 && (
                                                        <span
                                                            style={
                                                                styles.originalPrice
                                                            }
                                                        >
                                                            {formatCurrency(
                                                                product.price
                                                            )}
                                                        </span>
                                                    )}

                                                </div>


                                                <span
                                                    style={{
                                                        ...styles.stockStatus,
                                                        ...(stock.type ===
                                                        "out"
                                                            ? styles.outStock
                                                            : stock.type ===
                                                                "low"
                                                            ? styles.lowStock
                                                            : styles.inStock)
                                                    }}
                                                >
                                                    {stock.text}
                                                </span>

                                            </div>

                                        </Link>
                                    );
                                }
                            )}

                        </div>
                    )}


                {/* ======================================
                    NO PRODUCTS
                ====================================== */}

                {!loadingProducts &&
                    products.length === 0 && (

                        <div style={styles.emptyBox}>

                            <div
                                style={
                                    styles.emptyIcon
                                }
                            >
                                🔍
                            </div>

                            <h2>
                                No products found
                            </h2>

                            <p>
                                Try changing your
                                search or filters.
                            </p>

                            <button
                                onClick={clearFilters}
                                style={
                                    styles.applyButton
                                }
                            >
                                Clear Filters
                            </button>

                        </div>
                    )}

            </main>


            {/* ==========================================
                FOOTER
            ========================================== */}

            <footer style={styles.footer}>

                <p>
                    © 2026 E-Commerce Platform
                </p>

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
        backgroundColor: "#f5f7fb",
        fontFamily:
            "Arial, Helvetica, sans-serif",
        color: "#1f2937"
    },

    header: {
        backgroundColor: "#ffffff",
        borderBottom:
            "1px solid #e5e7eb",
        padding: "16px 25px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
        position: "sticky",
        top: 0,
        zIndex: 100
    },

    logo: {
        fontSize: "22px",
        fontWeight: "700",
        textDecoration: "none",
        color: "#111827",
        whiteSpace: "nowrap"
    },

    searchForm: {
        flex: 1,
        minWidth: "280px",
        maxWidth: "650px",
        display: "flex",
        gap: "8px"
    },

    searchInput: {
        flex: 1,
        padding: "11px 14px",
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none"
    },

    searchButton: {
        border: "none",
        backgroundColor: "#111827",
        color: "#ffffff",
        padding: "11px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        whiteSpace: "nowrap"
    },

    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap"
    },

    userName: {
        color: "#4b5563",
        fontSize: "14px"
    },

    headerLink: {
        textDecoration: "none",
        color: "#374151",
        fontWeight: "600",
        fontSize: "14px",
        position: "relative"
    },

    cartBadge: {
        marginLeft: "5px",
        backgroundColor: "#111827",
        color: "#ffffff",
        borderRadius: "50%",
        minWidth: "20px",
        height: "20px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px"
    },

    logoutButton: {
        border: "none",
        backgroundColor: "#dc2626",
        color: "#ffffff",
        padding: "9px 13px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    container: {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "25px"
    },

    hero: {
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "35px",
        marginBottom: "25px",
        border:
            "1px solid #e5e7eb"
    },

    heroTitle: {
        margin: "0 0 8px",
        fontSize: "32px"
    },

    heroText: {
        margin: 0,
        color: "#6b7280",
        fontSize: "16px"
    },

    filterCard: {
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "24px",
        border:
            "1px solid #e5e7eb",
        marginBottom: "30px"
    },

    filterHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        gap: "15px",
        flexWrap: "wrap"
    },

    filterTitle: {
        margin: 0,
        fontSize: "20px"
    },

    clearButton: {
        border:
            "1px solid #d1d5db",
        backgroundColor: "#ffffff",
        padding: "8px 13px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    filterGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
        alignItems: "end"
    },

    filterGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },

    filterLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#4b5563"
    },

    select: {
        width: "100%",
        padding: "10px",
        border:
            "1px solid #d1d5db",
        borderRadius: "7px",
        backgroundColor: "#ffffff",
        fontSize: "14px"
    },

    priceInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "10px",
        border:
            "1px solid #d1d5db",
        borderRadius: "7px",
        fontSize: "14px"
    },

    applyGroup: {
        display: "flex",
        alignItems: "flex-end"
    },

    applyButton: {
        border: "none",
        backgroundColor: "#111827",
        color: "#ffffff",
        padding: "10px 17px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    resultsHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px"
    },

    resultsTitle: {
        margin: 0,
        fontSize: "24px"
    },

    resultsCount: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "14px"
    },

    productGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fill, minmax(230px, 1fr))",
        gap: "20px"
    },

    productCard: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        overflow: "hidden",
        border:
            "1px solid #e5e7eb",
        textDecoration: "none",
        color: "#1f2937",
        transition:
            "transform 0.15s ease"
    },

    imageContainer: {
        position: "relative",
        width: "100%",
        height: "250px",
        backgroundColor: "#f3f4f6"
    },

    productImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },

    discountBadge: {
        position: "absolute",
        top: "10px",
        left: "10px",
        backgroundColor: "#dc2626",
        color: "#ffffff",
        padding: "5px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "700"
    },

    productContent: {
        padding: "16px"
    },

    categoryName: {
        margin: "0 0 5px",
        color: "#6b7280",
        fontSize: "12px"
    },

    productName: {
        margin: "0 0 7px",
        fontSize: "17px",
        lineHeight: "1.3"
    },

    brand: {
        margin: "0 0 10px",
        color: "#6b7280",
        fontSize: "13px"
    },

    priceRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "10px",
        flexWrap: "wrap"
    },

    currentPrice: {
        fontSize: "18px"
    },

    originalPrice: {
        color: "#9ca3af",
        textDecoration: "line-through",
        fontSize: "13px"
    },

    stockStatus: {
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: "5px",
        fontSize: "12px",
        fontWeight: "600"
    },

    inStock: {
        backgroundColor: "#dcfce7",
        color: "#166534"
    },

    lowStock: {
        backgroundColor: "#fef3c7",
        color: "#92400e"
    },

    outStock: {
        backgroundColor: "#fee2e2",
        color: "#991b1b"
    },

    loadingBox: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "50px",
        textAlign: "center",
        border:
            "1px solid #e5e7eb"
    },

    spinner: {
        width: "35px",
        height: "35px",
        border:
            "4px solid #e5e7eb",
        borderTop:
            "4px solid #111827",
        borderRadius: "50%",
        margin:
            "0 auto 15px",
        animation:
            "spin 1s linear infinite"
    },

    emptyBox: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "60px 30px",
        textAlign: "center",
        border:
            "1px solid #e5e7eb"
    },

    emptyIcon: {
        fontSize: "45px",
        marginBottom: "10px"
    },

    errorBox: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        border:
            "1px solid #fecaca",
        borderRadius: "8px",
        padding: "15px",
        marginBottom: "20px"
    },

    footer: {
        marginTop: "50px",
        padding: "25px",
        textAlign: "center",
        backgroundColor: "#ffffff",
        borderTop:
            "1px solid #e5e7eb",
        color: "#6b7280"
    }
};

export default CustomerHome;