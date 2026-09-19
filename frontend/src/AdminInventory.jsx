import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

const AdminInventory = () => {
    const navigate = useNavigate();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [quantity, setQuantity] = useState("");
    const [stockValue, setStockValue] = useState("");

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            if (user.role !== "admin") {
                navigate("/login");
                return;
            }

            loadInventory();
        } catch (err) {
            console.error("User data error:", err);
            navigate("/login");
        }
    }, [navigate]);

    const loadInventory = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/api/admin/inventory`,
                getAuthHeaders()
            );

            if (response.data.success) {
                setInventory(response.data.inventory || []);
            } else {
                setError(
                    response.data.message ||
                    "Failed to load inventory."
                );
            }
        } catch (err) {
            console.error("Load inventory error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load inventory."
            );
        } finally {
            setLoading(false);
        }
    };

    const openSetStockModal = (product) => {
        setSelectedProduct(product);
        setModalType("set");
        setStockValue(product.stock_quantity ?? 0);
        setQuantity("");
        setMessage("");
        setError("");
        setShowModal(true);
    };

    const openAddStockModal = (product) => {
        setSelectedProduct(product);
        setModalType("add");
        setQuantity("");
        setStockValue("");
        setMessage("");
        setError("");
        setShowModal(true);
    };

    const openReduceStockModal = (product) => {
        setSelectedProduct(product);
        setModalType("reduce");
        setQuantity("");
        setStockValue("");
        setMessage("");
        setError("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setModalType("");
        setQuantity("");
        setStockValue("");
    };

    const setStock = async () => {
        const value = Number(stockValue);

        if (!Number.isInteger(value) || value < 0) {
            setError(
                "Stock must be a whole number greater than or equal to 0."
            );
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await axios.put(
                `${API_URL}/api/admin/inventory/${selectedProduct.product_id}`,
                {
                    stock_quantity: value
                },
                getAuthHeaders()
            );

            if (response.data.success) {
                closeModal();

                setMessage(
                    response.data.message ||
                    "Stock updated successfully."
                );

                await loadInventory();
            } else {
                setError(
                    response.data.message ||
                    "Failed to update stock."
                );
            }
        } catch (err) {
            console.error("Set stock error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to update stock."
            );
        }
    };

    const addStock = async () => {
        const value = Number(quantity);

        if (!Number.isInteger(value) || value <= 0) {
            setError(
                "Quantity must be a positive whole number."
            );
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await axios.post(
                `${API_URL}/api/admin/inventory/${selectedProduct.product_id}/add`,
                {
                    quantity: value
                },
                getAuthHeaders()
            );

            if (response.data.success) {
                closeModal();

                setMessage(
                    response.data.message ||
                    "Stock added successfully."
                );

                await loadInventory();
            } else {
                setError(
                    response.data.message ||
                    "Failed to add stock."
                );
            }
        } catch (err) {
            console.error("Add stock error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to add stock."
            );
        }
    };

    const reduceStock = async () => {
        const value = Number(quantity);

        if (!Number.isInteger(value) || value <= 0) {
            setError(
                "Quantity must be a positive whole number."
            );
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await axios.post(
                `${API_URL}/api/admin/inventory/${selectedProduct.product_id}/reduce`,
                {
                    quantity: value
                },
                getAuthHeaders()
            );

            if (response.data.success) {
                closeModal();

                setMessage(
                    response.data.message ||
                    "Stock reduced successfully."
                );

                await loadInventory();
            } else {
                setError(
                    response.data.message ||
                    "Failed to reduce stock."
                );
            }
        } catch (err) {
            console.error("Reduce stock error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to reduce stock."
            );
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (modalType === "set") {
            await setStock();
            return;
        }

        if (modalType === "add") {
            await addStock();
            return;
        }

        if (modalType === "reduce") {
            await reduceStock();
        }
    };

    const filteredInventory = inventory.filter((item) => {
        const searchText = search.toLowerCase().trim();

        if (!searchText) {
            return true;
        }

        return (
            String(item.product_id || "")
                .toLowerCase()
                .includes(searchText) ||
            String(item.product_name || "")
                .toLowerCase()
                .includes(searchText) ||
            String(item.sku || "")
                .toLowerCase()
                .includes(searchText) ||
            String(item.category_name || "")
                .toLowerCase()
                .includes(searchText)
        );
    });

    const totalProducts = inventory.length;

    const inStockCount = inventory.filter(
        (item) =>
            item.inventory_status === "IN_STOCK" ||
            item.status === "IN_STOCK"
    ).length;

    const lowStockCount = inventory.filter(
        (item) =>
            item.inventory_status === "LOW_STOCK" ||
            item.status === "LOW_STOCK"
    ).length;

    const outOfStockCount = inventory.filter(
        (item) =>
            item.inventory_status === "OUT_OF_STOCK" ||
            item.status === "OUT_OF_STOCK"
    ).length;

    const getAvailableQuantity = (item) => {
        if (item.available_quantity !== undefined) {
            return item.available_quantity;
        }

        if (item.available !== undefined) {
            return item.available;
        }

        return (
            Number(item.stock_quantity || 0) -
            Number(item.reserved_quantity || 0)
        );
    };

    const getInventoryStatus = (item) => {
        if (item.inventory_status) {
            return item.inventory_status;
        }

        if (item.status) {
            return item.status;
        }

        const available = getAvailableQuantity(item);

        if (Number(item.stock_quantity || 0) <= 0) {
            return "OUT_OF_STOCK";
        }

        if (available <= 5) {
            return "LOW_STOCK";
        }

        return "IN_STOCK";
    };

    const formatStatus = (status) => {
        if (!status) {
            return "-";
        }

        return status
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const getStatusStyle = (status) => {
        if (status === "OUT_OF_STOCK") {
            return {
                background: "#fee2e2",
                color: "#b91c1c"
            };
        }

        if (status === "LOW_STOCK") {
            return {
                background: "#fef3c7",
                color: "#92400e"
            };
        }

        return {
            background: "#dcfce7",
            color: "#166534"
        };
    };

    const styles = {
        page: {
            minHeight: "100vh",
            background: "#f5f7fb",
            padding: "30px",
            boxSizing: "border-box",
            fontFamily: "Arial, sans-serif"
        },

        container: {
            maxWidth: "1400px",
            margin: "0 auto"
        },

        topBar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "25px",
            flexWrap: "wrap"
        },

        title: {
            margin: 0,
            fontSize: "30px",
            color: "#111827"
        },

        subtitle: {
            marginTop: "7px",
            marginBottom: 0,
            color: "#6b7280",
            fontSize: "15px"
        },

        backButton: {
            textDecoration: "none",
            background: "#111827",
            color: "white",
            padding: "11px 17px",
            borderRadius: "8px",
            fontWeight: "600"
        },

        statsGrid: {
            display: "grid",
            gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "18px",
            marginBottom: "25px"
        },

        statCard: {
            background: "white",
            padding: "22px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
        },

        statLabel: {
            color: "#6b7280",
            fontSize: "14px",
            marginBottom: "8px"
        },

        statValue: {
            color: "#111827",
            fontSize: "28px",
            fontWeight: "700"
        },

        toolbar: {
            background: "white",
            padding: "18px",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap"
        },

        searchInput: {
            width: "100%",
            maxWidth: "500px",
            padding: "12px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "15px",
            boxSizing: "border-box",
            outline: "none"
        },

        resultCount: {
            color: "#6b7280",
            fontSize: "14px"
        },

        tableContainer: {
            background: "white",
            borderRadius: "12px",
            overflowX: "auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
        },

        table: {
            width: "100%",
            minWidth: "1050px",
            borderCollapse: "collapse"
        },

        th: {
            padding: "15px",
            background: "#f9fafb",
            color: "#374151",
            textAlign: "left",
            fontSize: "13px",
            borderBottom: "1px solid #e5e7eb"
        },

        td: {
            padding: "15px",
            color: "#4b5563",
            fontSize: "14px",
            borderBottom: "1px solid #e5e7eb"
        },

        productName: {
            color: "#111827",
            fontWeight: "700",
            marginBottom: "4px"
        },

        productId: {
            color: "#9ca3af",
            fontSize: "12px"
        },

        statusBadge: {
            display: "inline-block",
            padding: "5px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700"
        },

        actionButton: {
            border: "none",
            padding: "8px 11px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "700",
            marginRight: "6px",
            marginBottom: "5px"
        },

        setButton: {
            background: "#e0e7ff",
            color: "#3730a3"
        },

        addButton: {
            background: "#dcfce7",
            color: "#166534"
        },

        reduceButton: {
            background: "#fee2e2",
            color: "#b91c1c"
        },

        loading: {
            padding: "60px",
            textAlign: "center",
            color: "#6b7280"
        },

        empty: {
            padding: "60px",
            textAlign: "center",
            color: "#6b7280"
        },

        message: {
            padding: "13px 16px",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: "8px",
            marginBottom: "20px"
        },

        error: {
            padding: "13px 16px",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "8px",
            marginBottom: "20px"
        },

        modalOverlay: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
            boxSizing: "border-box"
        },

        modal: {
            width: "100%",
            maxWidth: "500px",
            background: "white",
            borderRadius: "14px",
            padding: "25px",
            boxSizing: "border-box"
        },

        modalHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "22px"
        },

        modalTitle: {
            margin: 0,
            color: "#111827",
            fontSize: "22px"
        },

        closeButton: {
            border: "none",
            background: "#f3f4f6",
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "18px"
        },

        selectedProduct: {
            background: "#f9fafb",
            padding: "14px",
            borderRadius: "8px",
            marginBottom: "18px"
        },

        selectedProductName: {
            fontWeight: "700",
            color: "#111827"
        },

        selectedProductInfo: {
            color: "#6b7280",
            fontSize: "13px",
            marginTop: "5px"
        },

        formGroup: {
            marginBottom: "18px"
        },

        label: {
            display: "block",
            marginBottom: "7px",
            fontWeight: "600",
            color: "#374151"
        },

        input: {
            width: "100%",
            padding: "12px",
            border: "1px solid #d1d5db",
            borderRadius: "7px",
            fontSize: "15px",
            boxSizing: "border-box"
        },

        modalActions: {
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "22px"
        },

        cancelButton: {
            border: "none",
            padding: "11px 17px",
            borderRadius: "7px",
            background: "#e5e7eb",
            color: "#374151",
            cursor: "pointer",
            fontWeight: "600"
        },

        submitButton: {
            border: "none",
            padding: "11px 17px",
            borderRadius: "7px",
            background: "#111827",
            color: "white",
            cursor: "pointer",
            fontWeight: "600"
        }
    };

    return (
        <div style={styles.page}>

            <div style={styles.container}>

                <div style={styles.topBar}>

                    <div>
                        <h1 style={styles.title}>
                            Inventory Management
                        </h1>

                        <p style={styles.subtitle}>
                            Monitor and manage product stock levels.
                        </p>
                    </div>

                    <Link
                        to="/admin"
                        style={styles.backButton}
                    >
                        ← Back to Dashboard
                    </Link>

                </div>

                {message && (
                    <div style={styles.message}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                <div style={styles.statsGrid}>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Total Products
                        </div>

                        <div style={styles.statValue}>
                            {totalProducts}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            In Stock
                        </div>

                        <div style={styles.statValue}>
                            {inStockCount}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Low Stock
                        </div>

                        <div style={styles.statValue}>
                            {lowStockCount}
                        </div>
                    </div>

                    <div style={styles.statCard}>
                        <div style={styles.statLabel}>
                            Out of Stock
                        </div>

                        <div style={styles.statValue}>
                            {outOfStockCount}
                        </div>
                    </div>

                </div>

                <div style={styles.toolbar}>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search by product, SKU, category or ID..."
                        style={styles.searchInput}
                    />

                    <div style={styles.resultCount}>
                        Showing{" "}
                        <strong>
                            {filteredInventory.length}
                        </strong>{" "}
                        of{" "}
                        <strong>
                            {inventory.length}
                        </strong>{" "}
                        products
                    </div>

                </div>

                <div style={styles.tableContainer}>

                    {loading ? (
                        <div style={styles.loading}>
                            Loading inventory...
                        </div>
                    ) : filteredInventory.length === 0 ? (
                        <div style={styles.empty}>

                            <h3>
                                No inventory found
                            </h3>

                            <p>
                                {search
                                    ? "Try a different search."
                                    : "No inventory records are available."
                                }
                            </p>

                        </div>
                    ) : (

                        <table style={styles.table}>

                            <thead>

                                <tr>

                                    <th style={styles.th}>
                                        Product
                                    </th>

                                    <th style={styles.th}>
                                        Category
                                    </th>

                                    <th style={styles.th}>
                                        SKU
                                    </th>

                                    <th style={styles.th}>
                                        Stock
                                    </th>

                                    <th style={styles.th}>
                                        Reserved
                                    </th>

                                    <th style={styles.th}>
                                        Available
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

                                {filteredInventory.map(
                                    (item) => {

                                        const status =
                                            getInventoryStatus(item);

                                        const available =
                                            getAvailableQuantity(item);

                                        return (
                                            <tr
                                                key={
                                                    item.product_id
                                                }
                                            >

                                                <td style={styles.td}>

                                                    <div
                                                        style={
                                                            styles.productName
                                                        }
                                                    >
                                                        {
                                                            item.product_name ||
                                                            "Unnamed Product"
                                                        }
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.productId
                                                        }
                                                    >
                                                        ID: #
                                                        {
                                                            item.product_id
                                                        }
                                                    </div>

                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.category_name ||
                                                        "Uncategorized"
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.sku ||
                                                        "-"
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.stock_quantity ??
                                                        0
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        item.reserved_quantity ??
                                                        0
                                                    }
                                                </td>

                                                <td style={styles.td}>
                                                    {
                                                        available
                                                    }
                                                </td>

                                                <td style={styles.td}>

                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,
                                                            ...getStatusStyle(
                                                                status
                                                            )
                                                        }}
                                                    >
                                                        {formatStatus(
                                                            status
                                                        )}
                                                    </span>

                                                </td>

                                                <td style={styles.td}>

                                                    <button
                                                        type="button"
                                                        style={{
                                                            ...styles.actionButton,
                                                            ...styles.setButton
                                                        }}
                                                        onClick={() =>
                                                            openSetStockModal(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        Set Stock
                                                    </button>

                                                    <button
                                                        type="button"
                                                        style={{
                                                            ...styles.actionButton,
                                                            ...styles.addButton
                                                        }}
                                                        onClick={() =>
                                                            openAddStockModal(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        + Add
                                                    </button>

                                                    <button
                                                        type="button"
                                                        style={{
                                                            ...styles.actionButton,
                                                            ...styles.reduceButton
                                                        }}
                                                        onClick={() =>
                                                            openReduceStockModal(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        − Reduce
                                                    </button>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </div>

            {showModal && selectedProduct && (

                <div
                    style={styles.modalOverlay}
                    onClick={closeModal}
                >

                    <div
                        style={styles.modal}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div style={styles.modalHeader}>

                            <h2 style={styles.modalTitle}>

                                {modalType === "set"
                                    ? "Set Stock"
                                    : modalType === "add"
                                    ? "Add Stock"
                                    : "Reduce Stock"}

                            </h2>

                            <button
                                type="button"
                                style={styles.closeButton}
                                onClick={closeModal}
                            >
                                ×
                            </button>

                        </div>

                        <div
                            style={
                                styles.selectedProduct
                            }
                        >

                            <div
                                style={
                                    styles.selectedProductName
                                }
                            >
                                {
                                    selectedProduct.product_name ||
                                    "Unnamed Product"
                                }
                            </div>

                            <div
                                style={
                                    styles.selectedProductInfo
                                }
                            >
                                SKU:{" "}
                                {
                                    selectedProduct.sku ||
                                    "-"
                                }
                            </div>

                            <div
                                style={
                                    styles.selectedProductInfo
                                }
                            >
                                Current Stock:{" "}
                                {
                                    selectedProduct.stock_quantity ??
                                    0
                                }
                            </div>

                            <div
                                style={
                                    styles.selectedProductInfo
                                }
                            >
                                Reserved:{" "}
                                {
                                    selectedProduct.reserved_quantity ??
                                    0
                                }
                            </div>

                            <div
                                style={
                                    styles.selectedProductInfo
                                }
                            >
                                Available:{" "}
                                {
                                    getAvailableQuantity(
                                        selectedProduct
                                    )
                                }
                            </div>

                        </div>

                        <form
                            onSubmit={handleSubmit}
                        >

                            {modalType === "set" ? (

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >

                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        New Stock Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={stockValue}
                                        onChange={(e) =>
                                            setStockValue(
                                                e.target.value
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    />

                                </div>

                            ) : (

                                <div
                                    style={
                                        styles.formGroup
                                    }
                                >

                                    <label
                                        style={
                                            styles.label
                                        }
                                    >
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={quantity}
                                        onChange={(e) =>
                                            setQuantity(
                                                e.target.value
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                        placeholder="Enter quantity"
                                        required
                                    />

                                </div>

                            )}

                            <div
                                style={
                                    styles.modalActions
                                }
                            >

                                <button
                                    type="button"
                                    style={
                                        styles.cancelButton
                                    }
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    style={
                                        styles.submitButton
                                    }
                                >

                                    {modalType === "set"
                                        ? "Update Stock"
                                        : modalType === "add"
                                        ? "Add Stock"
                                        : "Reduce Stock"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default AdminInventory;