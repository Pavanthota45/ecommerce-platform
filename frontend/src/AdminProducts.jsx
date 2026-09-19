import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function AdminProducts() {

    // ==========================================
    // STATE
    // ==========================================

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [editingProduct, setEditingProduct] =
        useState(null);

    const [formData, setFormData] = useState({
        category_id: "",
        name: "",
        description: "",
        brand: "",
        price: "",
        discount_price: "",
        sku: "",
        stock_quantity: "",
        status: "active"
    });

    // ==========================================
    // IMAGE MANAGEMENT STATE
    // ==========================================

    const [selectedProduct, setSelectedProduct] =
        useState(null);

    const [productImages, setProductImages] =
        useState([]);

    const [imageUrl, setImageUrl] =
        useState("");

    const [loadingImages, setLoadingImages] =
        useState(false);

    const [addingImage, setAddingImage] =
        useState(false);

    // ==========================================
    // AUTH
    // ==========================================

    const token = localStorage.getItem("token");

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    // ==========================================
    // CHECK ADMIN
    // ==========================================

    useEffect(() => {

        if (
            !token ||
            !user ||
            user.role !== "admin"
        ) {

            window.location.href = "/login";

        }

    }, [token, user]);

    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    const loadProducts = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/products"
            );

            setProducts(
                response.data.products || []
            );

        } catch (error) {

            console.error(
                "Load products error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load products"
            );

        } finally {

            setLoading(false);

        }

    };

    // ==========================================
    // LOAD CATEGORIES
    // ==========================================

    const loadCategories = async () => {

        try {

            const response = await axios.get(
                "http://localhost:5000/api/categories"
            );

            setCategories(
                response.data.categories || []
            );

        } catch (error) {

            console.error(
                "Load categories error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load categories"
            );

        }

    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        if (
            token &&
            user?.role === "admin"
        ) {

            loadProducts();
            loadCategories();

        }

    }, []);

    // ==========================================
    // HANDLE FORM INPUT
    // ==========================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setFormData(
            previous => ({
                ...previous,
                [name]: value
            })
        );

    };

    // ==========================================
    // RESET PRODUCT FORM
    // ==========================================

    const resetForm = () => {

        setFormData({
            category_id: "",
            name: "",
            description: "",
            brand: "",
            price: "",
            discount_price: "",
            sku: "",
            stock_quantity: "",
            status: "active"
        });

        setEditingProduct(null);

        setMessage("");
        setError("");

    };

    // ==========================================
    // ADD / UPDATE PRODUCT
    // ==========================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        // Validate category

        if (!formData.category_id) {

            setError(
                "Please select a category."
            );

            return;

        }

        // Validate product name

        if (!formData.name.trim()) {

            setError(
                "Please enter the product name."
            );

            return;

        }

        // Validate price

        if (
            formData.price === "" ||
            Number(formData.price) < 0
        ) {

            setError(
                "Please enter a valid product price."
            );

            return;

        }

        // Validate SKU

        if (!formData.sku.trim()) {

            setError(
                "Please enter the product SKU."
            );

            return;

        }

        // Validate stock

        if (
            formData.stock_quantity === "" ||
            Number(formData.stock_quantity) < 0
        ) {

            setError(
                "Please enter a valid stock quantity."
            );

            return;

        }

        const data = {

            category_id:
                Number(formData.category_id),

            name:
                formData.name.trim(),

            description:
                formData.description.trim(),

            brand:
                formData.brand.trim(),

            price:
                Number(formData.price),

            discount_price:
                formData.discount_price === ""
                    ? null
                    : Number(formData.discount_price),

            sku:
                formData.sku.trim(),

            stock_quantity:
                Number(formData.stock_quantity),

            status:
                formData.status

        };

        try {

            if (editingProduct) {

                await axios.put(
                    `http://localhost:5000/api/products/${editingProduct.id}`,
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setMessage(
                    "Product updated successfully."
                );

            } else {

                await axios.post(
                    "http://localhost:5000/api/products",
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setMessage(
                    "Product added successfully."
                );

            }

            resetForm();

            await loadProducts();

        } catch (error) {

            console.error(
                "Save product error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to save product."
            );

        }

    };

    // ==========================================
    // EDIT PRODUCT
    // ==========================================

    const handleEdit = (product) => {

        setEditingProduct(product);

        setFormData({

            category_id:
                product.category_id || "",

            name:
                product.name || "",

            description:
                product.description || "",

            brand:
                product.brand || "",

            price:
                product.price ?? "",

            discount_price:
                product.discount_price ?? "",

            sku:
                product.sku || "",

            stock_quantity:
                product.stock_quantity ?? 0,

            status:
                product.status || "active"

        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    };

    // ==========================================
    // DELETE PRODUCT
    // ==========================================

    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this product?"
            );

        if (!confirmed) {
            return;
        }

        setMessage("");
        setError("");

        try {

            await axios.delete(
                `http://localhost:5000/api/products/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setMessage(
                "Product deleted successfully."
            );

            if (
                selectedProduct?.id === id
            ) {

                closeImageManager();

            }

            await loadProducts();

        } catch (error) {

            console.error(
                "Delete product error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to delete product."
            );

        }

    };

    // ==========================================
    // LOAD PRODUCT IMAGES
    // ==========================================

    const loadProductImages = async (
        productId
    ) => {

        try {

            setLoadingImages(true);
            setError("");

            const response =
                await axios.get(
                    `http://localhost:5000/api/product-images/product/${productId}`
                );

            setProductImages(
                response.data.images || []
            );

        } catch (error) {

            console.error(
                "Load product images error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load product images."
            );

        } finally {

            setLoadingImages(false);

        }

    };

    // ==========================================
    // OPEN IMAGE MANAGER
    // ==========================================

    const openImageManager = async (
        product
    ) => {

        setSelectedProduct(product);

        setImageUrl("");

        setProductImages([]);

        setMessage("");
        setError("");

        await loadProductImages(
            product.id
        );

    };

    // ==========================================
    // CLOSE IMAGE MANAGER
    // ==========================================

    const closeImageManager = () => {

        setSelectedProduct(null);

        setProductImages([]);

        setImageUrl("");

        setMessage("");
        setError("");

    };

    // ==========================================
    // ADD IMAGE
    // ==========================================

    const handleAddImage = async (
        event
    ) => {

        event.preventDefault();

        if (!selectedProduct) {
            return;
        }

        if (!imageUrl.trim()) {

            setError(
                "Please enter an image URL."
            );

            return;

        }

        try {

            setAddingImage(true);

            setMessage("");
            setError("");

            await axios.post(
                `http://localhost:5000/api/product-images/product/${selectedProduct.id}`,
                {
                    image_url:
                        imageUrl.trim(),

                    is_primary:
                        productImages.length === 0
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setMessage(
                "Product image added successfully."
            );

            setImageUrl("");

            await loadProductImages(
                selectedProduct.id
            );

        } catch (error) {

            console.error(
                "Add image error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to add product image."
            );

        } finally {

            setAddingImage(false);

        }

    };

    // ==========================================
    // SET PRIMARY IMAGE
    // ==========================================

    const handleSetPrimary = async (
        imageId
    ) => {

        if (!selectedProduct) {
            return;
        }

        try {

            setMessage("");
            setError("");

            await axios.put(
                `http://localhost:5000/api/product-images/product/${selectedProduct.id}/${imageId}/primary`,
                {},
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setMessage(
                "Primary image updated successfully."
            );

            await loadProductImages(
                selectedProduct.id
            );

        } catch (error) {

            console.error(
                "Set primary image error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to set primary image."
            );

        }

    };

    // ==========================================
    // DELETE IMAGE
    // ==========================================

    const handleDeleteImage = async (
        imageId
    ) => {

        if (!selectedProduct) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this image?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setMessage("");
            setError("");

            await axios.delete(
                `http://localhost:5000/api/product-images/product/${selectedProduct.id}/${imageId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            setMessage(
                "Product image deleted successfully."
            );

            await loadProductImages(
                selectedProduct.id
            );

        } catch (error) {

            console.error(
                "Delete image error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to delete product image."
            );

        }

    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href =
            "/login";

    };

    // ==========================================
    // FORMAT PRICE
    // ==========================================

    const formatPrice = (price) => {

        if (
            price === null ||
            price === undefined
        ) {

            return "₹0";

        }

        return `₹${Number(price).toLocaleString(
            "en-IN"
        )}`;

    };

    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div style={styles.page}>

            {/* =====================================
                HEADER
            ====================================== */}

            <header style={styles.header}>

                <div>

                    <h1 style={styles.headerTitle}>
                        E-Commerce Admin
                    </h1>

                    <p style={styles.headerSubtitle}>
                        Product Management
                    </p>

                </div>

                <div style={styles.headerRight}>

                    <span style={styles.adminName}>
                        👤 {user?.name || "Admin"}
                    </span>

                    <button
                        onClick={logout}
                        style={styles.logoutButton}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* =====================================
                MAIN
            ====================================== */}

            <main style={styles.container}>

                {/* BACK */}

                <Link
                    to="/admin"
                    style={styles.backLink}
                >
                    ← Back to Dashboard
                </Link>


                {/* TITLE */}

                <div style={styles.pageTitleRow}>

                    <div>

                        <h2 style={styles.pageTitle}>
                            Products
                        </h2>

                        <p style={styles.pageDescription}>
                            Add, edit, manage products,
                            inventory, and product images.
                        </p>

                    </div>

                    <button
                        onClick={resetForm}
                        style={styles.newProductButton}
                    >
                        + New Product
                    </button>

                </div>


                {/* MESSAGES */}

                {message && (

                    <div style={styles.successMessage}>
                        {message}
                    </div>

                )}

                {error && (

                    <div style={styles.errorMessage}>
                        {error}
                    </div>

                )}


                {/* =================================
                    PRODUCT FORM
                ================================== */}

                <section style={styles.formCard}>

                    <h3 style={styles.sectionTitle}>

                        {editingProduct
                            ? "Edit Product"
                            : "Add New Product"}

                    </h3>


                    <form onSubmit={handleSubmit}>

                        <div style={styles.formGrid}>

                            {/* CATEGORY */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    Category *
                                </label>

                                <select
                                    name="category_id"
                                    value={
                                        formData.category_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={styles.input}
                                    required
                                >

                                    <option value="">
                                        Select Category
                                    </option>

                                    {categories.map(
                                        category => (

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


                            {/* PRODUCT NAME */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    Product Name *
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        formData.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter product name"
                                    style={styles.input}
                                    required
                                />

                            </div>


                            {/* BRAND */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    Brand
                                </label>

                                <input
                                    type="text"
                                    name="brand"
                                    value={
                                        formData.brand
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter brand"
                                    style={styles.input}
                                />

                            </div>


                            {/* SKU */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    SKU *
                                </label>

                                <input
                                    type="text"
                                    name="sku"
                                    value={
                                        formData.sku
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Example: SAM-GAL-001"
                                    style={styles.input}
                                    required
                                />

                            </div>


                            {/* PRICE */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    Price *
                                </label>

                                <input
                                    type="number"
                                    name="price"
                                    value={
                                        formData.price
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter price"
                                    min="0"
                                    step="0.01"
                                    style={styles.input}
                                    required
                                />

                            </div>


                            {/* DISCOUNT */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    Discount Price
                                </label>

                                <input
                                    type="number"
                                    name="discount_price"
                                    value={
                                        formData.discount_price
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter discount price"
                                    min="0"
                                    step="0.01"
                                    style={styles.input}
                                />

                            </div>


                            {/* STOCK */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    Stock Quantity *
                                </label>

                                <input
                                    type="number"
                                    name="stock_quantity"
                                    value={
                                        formData.stock_quantity
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter stock quantity"
                                    min="0"
                                    step="1"
                                    style={styles.input}
                                    required
                                />

                            </div>


                            {/* STATUS */}

                            <div style={styles.formGroup}>

                                <label style={styles.label}>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={styles.input}
                                >

                                    <option value="active">
                                        Active
                                    </option>

                                    <option value="inactive">
                                        Inactive
                                    </option>

                                </select>

                            </div>

                        </div>


                        {/* DESCRIPTION */}

                        <div style={styles.formGroup}>

                            <label style={styles.label}>
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter product description"
                                rows="5"
                                style={styles.textarea}
                            />

                        </div>


                        {/* BUTTONS */}

                        <div style={styles.formActions}>

                            <button
                                type="submit"
                                style={
                                    styles.submitButton
                                }
                            >

                                {editingProduct
                                    ? "Update Product"
                                    : "Add Product"}

                            </button>


                            <button
                                type="button"
                                onClick={resetForm}
                                style={
                                    styles.cancelButton
                                }
                            >
                                Clear
                            </button>

                        </div>

                    </form>

                </section>


                {/* =================================
                    PRODUCT LIST
                ================================== */}

                <section style={styles.tableCard}>

                    <div style={styles.tableHeader}>

                        <div>

                            <h3 style={styles.sectionTitle}>
                                Existing Products
                            </h3>

                            <p style={styles.productCount}>
                                Total Products:{" "}
                                {products.length}
                            </p>

                        </div>


                        <button
                            onClick={loadProducts}
                            style={styles.refreshButton}
                        >
                            ↻ Refresh
                        </button>

                    </div>


                    {loading ? (

                        <div style={styles.loading}>
                            Loading products...
                        </div>

                    ) : products.length === 0 ? (

                        <div style={styles.emptyState}>

                            <div style={styles.emptyIcon}>
                                📦
                            </div>

                            <h3>
                                No Products Found
                            </h3>

                            <p>
                                Add your first product
                                using the form above.
                            </p>

                        </div>

                    ) : (

                        <div style={styles.tableWrapper}>

                            <table style={styles.table}>

                                <thead>

                                    <tr>

                                        <th style={styles.th}>
                                            ID
                                        </th>

                                        <th style={styles.th}>
                                            Product
                                        </th>

                                        <th style={styles.th}>
                                            Category
                                        </th>

                                        <th style={styles.th}>
                                            Brand
                                        </th>

                                        <th style={styles.th}>
                                            Price
                                        </th>

                                        <th style={styles.th}>
                                            Discount
                                        </th>

                                        <th style={styles.th}>
                                            Stock
                                        </th>

                                        <th style={styles.th}>
                                            Status
                                        </th>

                                        <th style={styles.th}>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {products.map(
                                        product => (

                                            <tr
                                                key={
                                                    product.id
                                                }
                                                style={
                                                    styles.tr
                                                }
                                            >

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        product.id
                                                    }
                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.productName
                                                        }
                                                    >
                                                        {
                                                            product.name
                                                        }
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.sku
                                                        }
                                                    >
                                                        SKU:{" "}
                                                        {
                                                            product.sku
                                                        }
                                                    </div>

                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        product.category_name ||
                                                        "No Category"
                                                    }
                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        product.brand ||
                                                        "-"
                                                    }
                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        formatPrice(
                                                            product.price
                                                        )
                                                    }
                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    {
                                                        product.discount_price
                                                            ? formatPrice(
                                                                  product.discount_price
                                                              )
                                                            : "-"
                                                    }

                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <span
                                                        style={
                                                            product.stock_quantity >
                                                            0
                                                                ? styles.stockAvailable
                                                                : styles.stockUnavailable
                                                        }
                                                    >
                                                        {
                                                            product.stock_quantity ??
                                                            0
                                                        }
                                                    </span>

                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <span
                                                        style={
                                                            product.status ===
                                                            "active"
                                                                ? styles.activeStatus
                                                                : styles.inactiveStatus
                                                        }
                                                    >
                                                        {
                                                            product.status
                                                        }
                                                    </span>

                                                </td>


                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.actionButtons
                                                        }
                                                    >

                                                        <button
                                                            onClick={() =>
                                                                handleEdit(
                                                                    product
                                                                )
                                                            }
                                                            style={
                                                                styles.editButton
                                                            }
                                                        >
                                                            Edit
                                                        </button>


                                                        <button
                                                            onClick={() =>
                                                                openImageManager(
                                                                    product
                                                                )
                                                            }
                                                            style={
                                                                styles.imageButton
                                                            }
                                                        >
                                                            📸 Images
                                                        </button>


                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    product.id
                                                                )
                                                            }
                                                            style={
                                                                styles.deleteButton
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* =================================
                    IMAGE MANAGER
                ================================== */}

                {selectedProduct && (

                    <section
                        style={
                            styles.imageManagerCard
                        }
                    >

                        <div
                            style={
                                styles.imageManagerHeader
                            }
                        >

                            <div>

                                <h3
                                    style={
                                        styles.sectionTitle
                                    }
                                >
                                    📸 Product Images
                                </h3>

                                <p
                                    style={
                                        styles.imageProductName
                                    }
                                >
                                    Product:{" "}
                                    <strong>
                                        {
                                            selectedProduct.name
                                        }
                                    </strong>
                                </p>

                            </div>


                            <button
                                onClick={
                                    closeImageManager
                                }
                                style={
                                    styles.closeButton
                                }
                            >
                                ✕ Close
                            </button>

                        </div>


                        {/* ADD IMAGE FORM */}

                        <form
                            onSubmit={
                                handleAddImage
                            }
                            style={
                                styles.imageForm
                            }
                        >

                            <div
                                style={
                                    styles.imageInputContainer
                                }
                            >

                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Image URL
                                </label>

                                <input
                                    type="url"
                                    value={
                                        imageUrl
                                    }
                                    onChange={
                                        event =>
                                            setImageUrl(
                                                event.target
                                                    .value
                                            )
                                    }
                                    placeholder="Paste direct image URL here"
                                    style={
                                        styles.input
                                    }
                                />

                            </div>


                            <button
                                type="submit"
                                disabled={
                                    addingImage
                                }
                                style={
                                    styles.addImageButton
                                }
                            >

                                {addingImage
                                    ? "Adding..."
                                    : "+ Add Image"}

                            </button>

                        </form>


                        {/* IMAGE HELP */}

                        <div
                            style={
                                styles.imageHelp
                            }
                        >

                            <strong>
                                💡 Testing tip:
                            </strong>

                            <span>
                                Use a direct image URL
                                ending in an image
                                format such as .jpg,
                                .jpeg, .png, or .webp.
                            </span>

                        </div>


                        {/* IMAGE LIST */}

                        <h4
                            style={
                                styles.imagesHeading
                            }
                        >
                            Existing Images
                        </h4>


                        {loadingImages ? (

                            <div
                                style={
                                    styles.loading
                                }
                            >
                                Loading images...
                            </div>

                        ) : productImages.length === 0 ? (

                            <div
                                style={
                                    styles.noImages
                                }
                            >

                                <div
                                    style={
                                        styles.noImagesIcon
                                    }
                                >
                                    🖼️
                                </div>

                                <p>
                                    No images added
                                    for this product yet.
                                </p>

                            </div>

                        ) : (

                            <div
                                style={
                                    styles.imageGrid
                                }
                            >

                                {productImages.map(
                                    image => (

                                        <div
                                            key={
                                                image.id
                                            }
                                            style={
                                                styles.imageCard
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.imagePreviewContainer
                                                }
                                            >

                                                <img
                                                    src={
                                                        image.image_url
                                                    }
                                                    alt={
                                                        selectedProduct.name
                                                    }
                                                    style={
                                                        styles.imagePreview
                                                    }
                                                    onError={
                                                        event => {
                                                            event.currentTarget.style.display =
                                                                "none";
                                                        }
                                                    }
                                                />

                                            </div>


                                            {image.is_primary ? (

                                                <div
                                                    style={
                                                        styles.primaryBadge
                                                    }
                                                >
                                                    ⭐ Primary Image
                                                </div>

                                            ) : (

                                                <button
                                                    onClick={() =>
                                                        handleSetPrimary(
                                                            image.id
                                                        )
                                                    }
                                                    style={
                                                        styles.primaryButton
                                                    }
                                                >
                                                    ⭐ Set as Primary
                                                </button>

                                            )}


                                            <button
                                                onClick={() =>
                                                    handleDeleteImage(
                                                        image.id
                                                    )
                                                }
                                                style={
                                                    styles.deleteImageButton
                                                }
                                            >
                                                🗑️ Delete Image
                                            </button>


                                            <div
                                                style={
                                                    styles.imageUrlText
                                                }
                                                title={
                                                    image.image_url
                                                }
                                            >
                                                {
                                                    image.image_url
                                                }
                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>

                )}

            </main>

        </div>

    );
}


// ==========================================
// STYLES
// ==========================================

const styles = {

    page: {
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937"
    },

    header: {
        backgroundColor: "#111827",
        color: "white",
        padding: "18px 35px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.15)"
    },

    headerTitle: {
        margin: 0,
        fontSize: "24px"
    },

    headerSubtitle: {
        margin: "5px 0 0",
        color: "#d1d5db",
        fontSize: "14px"
    },

    headerRight: {
        display: "flex",
        alignItems: "center",
        gap: "15px"
    },

    adminName: {
        fontSize: "15px"
    },

    logoutButton: {
        border: "none",
        backgroundColor: "#dc2626",
        color: "white",
        padding: "9px 15px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    container: {
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "30px"
    },

    backLink: {
        display: "inline-block",
        marginBottom: "20px",
        textDecoration: "none",
        color: "#2563eb",
        fontWeight: "bold"
    },

    pageTitleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        gap: "20px"
    },

    pageTitle: {
        margin: 0,
        fontSize: "32px"
    },

    pageDescription: {
        marginTop: "8px",
        color: "#6b7280"
    },

    newProductButton: {
        border: "none",
        backgroundColor: "#2563eb",
        color: "white",
        padding: "12px 18px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    successMessage: {
        backgroundColor: "#dcfce7",
        color: "#166534",
        padding: "12px 15px",
        borderRadius: "7px",
        marginBottom: "20px",
        border: "1px solid #bbf7d0"
    },

    errorMessage: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        padding: "12px 15px",
        borderRadius: "7px",
        marginBottom: "20px",
        border: "1px solid #fecaca"
    },

    formCard: {
        backgroundColor: "white",
        borderRadius: "10px",
        padding: "25px",
        marginBottom: "30px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)"
    },

    sectionTitle: {
        marginTop: 0,
        marginBottom: "20px",
        fontSize: "21px"
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "18px"
    },

    formGroup: {
        display: "flex",
        flexDirection: "column",
        marginBottom: "18px"
    },

    label: {
        fontWeight: "bold",
        marginBottom: "7px",
        fontSize: "14px"
    },

    input: {
        padding: "11px 12px",
        border:
            "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "15px",
        outline: "none",
        boxSizing: "border-box",
        width: "100%"
    },

    textarea: {
        padding: "11px 12px",
        border:
            "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "15px",
        resize: "vertical",
        fontFamily:
            "Arial, sans-serif",
        outline: "none",
        boxSizing: "border-box",
        width: "100%"
    },

    formActions: {
        display: "flex",
        gap: "10px",
        marginTop: "10px"
    },

    submitButton: {
        border: "none",
        backgroundColor: "#16a34a",
        color: "white",
        padding: "11px 18px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    cancelButton: {
        border: "none",
        backgroundColor: "#6b7280",
        color: "white",
        padding: "11px 18px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    tableCard: {
        backgroundColor: "white",
        borderRadius: "10px",
        padding: "25px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
        marginBottom: "30px"
    },

    tableHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },

    productCount: {
        margin: "-10px 0 0",
        color: "#6b7280",
        fontSize: "14px"
    },

    refreshButton: {
        border:
            "1px solid #d1d5db",
        backgroundColor: "white",
        padding: "9px 14px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    loading: {
        padding: "40px",
        textAlign: "center",
        color: "#6b7280"
    },

    emptyState: {
        padding: "50px",
        textAlign: "center",
        color: "#6b7280"
    },

    emptyIcon: {
        fontSize: "45px",
        marginBottom: "10px"
    },

    tableWrapper: {
        overflowX: "auto"
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "1100px"
    },

    th: {
        textAlign: "left",
        padding: "13px 10px",
        backgroundColor: "#f3f4f6",
        borderBottom:
            "2px solid #e5e7eb",
        fontSize: "13px",
        whiteSpace: "nowrap"
    },

    td: {
        padding: "14px 10px",
        borderBottom:
            "1px solid #e5e7eb",
        fontSize: "14px",
        verticalAlign: "middle"
    },

    tr: {
        transition:
            "background-color 0.2s"
    },

    productName: {
        fontWeight: "bold",
        marginBottom: "4px"
    },

    sku: {
        color: "#6b7280",
        fontSize: "12px"
    },

    stockAvailable: {
        display: "inline-block",
        backgroundColor: "#dcfce7",
        color: "#166534",
        padding: "4px 8px",
        borderRadius: "5px",
        fontWeight: "bold"
    },

    stockUnavailable: {
        display: "inline-block",
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        padding: "4px 8px",
        borderRadius: "5px",
        fontWeight: "bold"
    },

    activeStatus: {
        display: "inline-block",
        backgroundColor: "#dcfce7",
        color: "#166534",
        padding: "4px 8px",
        borderRadius: "5px",
        textTransform: "capitalize",
        fontWeight: "bold"
    },

    inactiveStatus: {
        display: "inline-block",
        backgroundColor: "#e5e7eb",
        color: "#374151",
        padding: "4px 8px",
        borderRadius: "5px",
        textTransform: "capitalize",
        fontWeight: "bold"
    },

    actionButtons: {
        display: "flex",
        gap: "7px",
        flexWrap: "wrap"
    },

    editButton: {
        border: "none",
        backgroundColor: "#2563eb",
        color: "white",
        padding: "7px 11px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    imageButton: {
        border: "none",
        backgroundColor: "#7c3aed",
        color: "white",
        padding: "7px 11px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    deleteButton: {
        border: "none",
        backgroundColor: "#dc2626",
        color: "white",
        padding: "7px 11px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    // ==========================================
    // IMAGE MANAGER
    // ==========================================

    imageManagerCard: {
        backgroundColor: "white",
        borderRadius: "10px",
        padding: "25px",
        marginBottom: "30px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        border:
            "2px solid #ddd6fe"
    },

    imageManagerHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "20px"
    },

    imageProductName: {
        color: "#6b7280",
        marginTop: "-10px"
    },

    closeButton: {
        border: "none",
        backgroundColor: "#374151",
        color: "white",
        padding: "9px 14px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    imageForm: {
        display: "flex",
        gap: "12px",
        alignItems: "flex-end",
        marginBottom: "15px",
        flexWrap: "wrap"
    },

    imageInputContainer: {
        flex: 1,
        minWidth: "300px"
    },

    addImageButton: {
        border: "none",
        backgroundColor: "#7c3aed",
        color: "white",
        padding: "11px 18px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        whiteSpace: "nowrap"
    },

    imageHelp: {
        display: "flex",
        gap: "8px",
        backgroundColor: "#f3f4f6",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "25px",
        color: "#4b5563",
        fontSize: "13px",
        flexWrap: "wrap"
    },

    imagesHeading: {
        marginBottom: "15px",
        fontSize: "18px"
    },

    noImages: {
        padding: "35px",
        textAlign: "center",
        backgroundColor: "#f9fafb",
        borderRadius: "8px",
        color: "#6b7280"
    },

    noImagesIcon: {
        fontSize: "40px",
        marginBottom: "8px"
    },

    imageGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "20px"
    },

    imageCard: {
        border:
            "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "12px",
        backgroundColor: "#ffffff",
        overflow: "hidden"
    },

    imagePreviewContainer: {
        width: "100%",
        height: "190px",
        backgroundColor: "#f3f4f6",
        borderRadius: "6px",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "10px"
    },

    imagePreview: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },

    primaryBadge: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        padding: "7px",
        borderRadius: "5px",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "13px",
        marginBottom: "8px"
    },

    primaryButton: {
        width: "100%",
        border: "none",
        backgroundColor: "#f59e0b",
        color: "white",
        padding: "8px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        marginBottom: "8px"
    },

    deleteImageButton: {
        width: "100%",
        border: "none",
        backgroundColor: "#dc2626",
        color: "white",
        padding: "8px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        marginBottom: "8px"
    },

    imageUrlText: {
        fontSize: "11px",
        color: "#6b7280",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    }

};

export default AdminProducts;