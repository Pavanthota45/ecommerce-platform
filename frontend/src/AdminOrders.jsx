import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

const ORDER_STATUSES = [
    "ALL",
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

function AdminOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [statistics, setStatistics] = useState({
        total_orders: 0,
        total_sales: 0,
        status_counts: []
    });

    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

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
    // LOAD STATISTICS
    // ======================================================

    const loadStatistics = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/admin/orders/statistics`,
                getAuthHeaders()
            );

            if (response.data.success) {
                setStatistics(
                    response.data.statistics || {
                        total_orders: 0,
                        total_sales: 0,
                        status_counts: []
                    }
                );
            }
        } catch (error) {
            console.error(
                "Load order statistics error:",
                error
            );
        }
    };

    // ======================================================
    // LOAD ORDERS
    // ======================================================

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            if (
                statusFilter &&
                statusFilter !== "ALL"
            ) {
                params.status = statusFilter;
            }

            const response = await axios.get(
                `${API_URL}/api/admin/orders`,
                {
                    ...getAuthHeaders(),
                    params
                }
            );

            if (response.data.success) {
                const receivedOrders =
                    Array.isArray(response.data.orders)
                        ? response.data.orders
                        : [];

                setOrders(receivedOrders);

                setPagination(
                    response.data.pagination || {
                        page,
                        limit,
                        total: receivedOrders.length,
                        totalPages: 1
                    }
                );
            } else {
                setError(
                    response.data.message ||
                    "Unable to load orders."
                );
            }
        } catch (error) {
            console.error(
                "Load admin orders error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load orders."
            );
        } finally {
            setLoading(false);
        }
    };

    // ======================================================
    // INITIAL LOAD / FILTER LOAD
    // ======================================================

    useEffect(() => {
        loadOrders();
        loadStatistics();
    }, [page, search, statusFilter]);

    // ======================================================
    // SEARCH
    // ======================================================

    const handleSearch = (event) => {
        event.preventDefault();

        setPage(1);
        setSearch(searchInput.trim());
    };

    const handleClearSearch = () => {
        setSearchInput("");
        setSearch("");
        setPage(1);
    };

    // ======================================================
    // STATUS UPDATE
    // ======================================================

    const handleStatusChange = async (
        order,
        newStatus
    ) => {
        if (!order) {
            return;
        }

        if (
            !order.id &&
            order.id !== 0
        ) {
            setError(
                "This order does not have a valid order ID."
            );
            return;
        }

        if (newStatus === order.status) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to change Order #${order.id} from "${formatStatus(
                order.status
            )}" to "${formatStatus(newStatus)}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setUpdatingOrderId(order.id);
            setError("");
            setSuccessMessage("");

            const response = await axios.put(
                `${API_URL}/api/admin/orders/${order.id}/status`,
                {
                    status: newStatus
                },
                getAuthHeaders()
            );

            if (response.data.success) {
                setSuccessMessage(
                    `Order #${order.id} status updated to ${formatStatus(
                        newStatus
                    )}.`
                );

                await loadOrders();
                await loadStatistics();
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
            setUpdatingOrderId(null);
        }
    };

    // ======================================================
    // VIEW DETAILS
    // ======================================================

    const handleViewDetails = (order) => {
        if (!order) {
            setError("Order information is missing.");
            return;
        }

        const orderId = Number(order.id);

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            console.error(
                "Invalid order object:",
                order
            );

            setError(
                "Unable to open order details because the order ID is missing."
            );

            return;
        }

        navigate(`/admin/orders/${orderId}`);
    };

    // ======================================================
    // REFRESH
    // ======================================================

    const handleRefresh = async () => {
        setSuccessMessage("");
        await loadOrders();
        await loadStatistics();
    };

    // ======================================================
    // PAGE CHANGE
    // ======================================================

    const handlePreviousPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    const handleNextPage = () => {
        if (
            pagination.totalPages &&
            page < pagination.totalPages
        ) {
            setPage(page + 1);
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
                        Loading Orders...
                    </h2>

                    <p>
                        Please wait while orders are loaded.
                    </p>
                </div>
            </div>
        );
    }

    // ======================================================
    // RENDER
    // ======================================================

    return (
        <div style={styles.page}>

            {/* ==================================================
                HEADER
            ================================================== */}

            <header style={styles.header}>

                <div>
                    <Link
                        to="/admin"
                        style={styles.backLink}
                    >
                        ← Back to Dashboard
                    </Link>

                    <h1 style={styles.title}>
                        Order Management
                    </h1>

                    <p style={styles.subtitle}>
                        View and manage all customer orders.
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    style={styles.refreshButton}
                >
                    ↻ Refresh
                </button>

            </header>

            {/* ==================================================
                MESSAGES
            ================================================== */}

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

            {/* ==================================================
                STATISTICS
            ================================================== */}

            <section style={styles.statisticsGrid}>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>
                        Total Orders
                    </span>

                    <strong style={styles.statValue}>
                        {statistics.total_orders}
                    </strong>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>
                        Total Sales
                    </span>

                    <strong style={styles.statValue}>
                        {formatCurrency(
                            statistics.total_sales
                        )}
                    </strong>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>
                        Current Page
                    </span>

                    <strong style={styles.statValue}>
                        {orders.length}
                    </strong>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>
                        Pages
                    </span>

                    <strong style={styles.statValue}>
                        {pagination.totalPages || 0}
                    </strong>
                </div>

            </section>

            {/* ==================================================
                FILTERS
            ================================================== */}

            <section style={styles.filterCard}>

                <form
                    onSubmit={handleSearch}
                    style={styles.searchForm}
                >
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(
                                event.target.value
                            )
                        }
                        placeholder="Search by order ID, customer name, email or phone..."
                        style={styles.searchInput}
                    />

                    <button
                        type="submit"
                        style={styles.searchButton}
                    >
                        Search
                    </button>

                    {search && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            style={styles.clearButton}
                        >
                            Clear
                        </button>
                    )}
                </form>

                <div style={styles.statusFilterBox}>

                    <label style={styles.filterLabel}>
                        Status
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(
                                event.target.value
                            );
                            setPage(1);
                        }}
                        style={styles.statusSelect}
                    >
                        {ORDER_STATUSES.map(
                            (status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status === "ALL"
                                        ? "All Orders"
                                        : formatStatus(
                                            status
                                        )}
                                </option>
                            )
                        )}
                    </select>

                </div>

            </section>

            {/* ==================================================
                ORDERS TABLE
            ================================================== */}

            <section style={styles.tableCard}>

                <div style={styles.tableHeader}>

                    <div>
                        <h2 style={styles.tableTitle}>
                            Orders
                        </h2>

                        <p style={styles.tableSubtitle}>
                            Showing{" "}
                            {orders.length}{" "}
                            of{" "}
                            {pagination.total}{" "}
                            orders
                        </p>
                    </div>

                    <div style={styles.pageInfo}>
                        Page{" "}
                        {pagination.page || page}
                        {" "}
                        of{" "}
                        {pagination.totalPages || 0}
                    </div>

                </div>

                {orders.length === 0 ? (

                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>
                            📦
                        </div>

                        <h3>
                            No Orders Found
                        </h3>

                        <p>
                            There are no orders matching your current filters.
                        </p>
                    </div>

                ) : (

                    <div style={styles.tableWrapper}>

                        <table style={styles.table}>

                            <thead>
                                <tr>

                                    <th style={styles.th}>
                                        Order
                                    </th>

                                    <th style={styles.th}>
                                        Customer
                                    </th>

                                    <th style={styles.th}>
                                        Amount
                                    </th>

                                    <th style={styles.th}>
                                        Payment
                                    </th>

                                    <th style={styles.th}>
                                        Status
                                    </th>

                                    <th style={styles.th}>
                                        Date
                                    </th>

                                    <th style={styles.th}>
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            <tbody>

                                {orders.map(
                                    (order) => {

                                        const orderId =
                                            Number(
                                                order.id
                                            );

                                        const validOrderId =
                                            Number.isInteger(
                                                orderId
                                            ) &&
                                            orderId > 0;

                                        return (
                                            <tr
                                                key={
                                                    validOrderId
                                                        ? orderId
                                                        : `invalid-${Math.random()}`
                                                }
                                                style={
                                                    styles.tr
                                                }
                                            >

                                                {/* ORDER */}

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <strong
                                                        style={
                                                            styles.orderId
                                                        }
                                                    >
                                                        #
                                                        {
                                                            validOrderId
                                                                ? orderId
                                                                : "-"
                                                        }
                                                    </strong>

                                                    <div
                                                        style={
                                                            styles.smallText
                                                        }
                                                    >
                                                        User ID:{" "}
                                                        {
                                                            order.user_id ||
                                                            "-"
                                                        }
                                                    </div>

                                                </td>

                                                {/* CUSTOMER */}

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <strong>
                                                        {
                                                            order.customer_name ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    <div
                                                        style={
                                                            styles.smallText
                                                        }
                                                    >
                                                        {
                                                            order.customer_email ||
                                                            "-"
                                                        }
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.smallText
                                                        }
                                                    >
                                                        {
                                                            order.customer_phone ||
                                                            "-"
                                                        }
                                                    </div>

                                                </td>

                                                {/* AMOUNT */}

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <strong
                                                        style={
                                                            styles.amount
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            order.total_amount
                                                        )}
                                                    </strong>

                                                    <div
                                                        style={
                                                            styles.smallText
                                                        }
                                                    >
                                                        Items:{" "}
                                                        {
                                                            Array.isArray(
                                                                order.items
                                                            )
                                                                ? order.items.reduce(
                                                                    (
                                                                        total,
                                                                        item
                                                                    ) =>
                                                                        total +
                                                                        Number(
                                                                            item.quantity ||
                                                                            0
                                                                        ),
                                                                    0
                                                                )
                                                                : 0
                                                        }
                                                    </div>

                                                </td>

                                                {/* PAYMENT */}

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <strong>
                                                        {
                                                            order.payment_method ||
                                                            "-"
                                                        }
                                                    </strong>

                                                    <div
                                                        style={{
                                                            ...styles.paymentBadge,
                                                            ...getPaymentStyle(
                                                                order.payment_status
                                                            )
                                                        }}
                                                    >
                                                        {
                                                            order.payment_status ||
                                                            "PENDING"
                                                        }
                                                    </div>

                                                </td>

                                                {/* STATUS */}

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <select
                                                        value={
                                                            order.status ||
                                                            "PLACED"
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleStatusChange(
                                                                order,
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        disabled={
                                                            updatingOrderId ===
                                                            orderId
                                                        }
                                                        style={
                                                            styles.statusSelectTable
                                                        }
                                                    >

                                                        {ORDER_STATUSES
                                                            .filter(
                                                                (
                                                                    status
                                                                ) =>
                                                                    status !==
                                                                    "ALL"
                                                            )
                                                            .map(
                                                                (
                                                                    status
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {formatStatus(
                                                                            status
                                                                        )}
                                                                    </option>
                                                                )
                                                            )}

                                                    </select>

                                                    <div
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
                                                    </div>

                                                </td>

                                                {/* DATE */}

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.dateText
                                                        }
                                                    >
                                                        {formatDate(
                                                            order.created_at
                                                        )}
                                                    </span>
                                                </td>

                                                {/* ACTION */}

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    {validOrderId ? (

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleViewDetails(
                                                                    order
                                                                )
                                                            }
                                                            style={
                                                                styles.viewButton
                                                            }
                                                        >
                                                            View Details
                                                        </button>

                                                    ) : (

                                                        <span
                                                            style={
                                                                styles.invalidId
                                                            }
                                                        >
                                                            Invalid ID
                                                        </span>

                                                    )}

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

                {/* ==================================================
                    PAGINATION
                ================================================== */}

                {pagination.totalPages > 0 && (
                    <div style={styles.pagination}>

                        <button
                            onClick={
                                handlePreviousPage
                            }
                            disabled={
                                page <= 1
                            }
                            style={
                                page <= 1
                                    ? styles.pageButtonDisabled
                                    : styles.pageButton
                            }
                        >
                            ← Previous
                        </button>

                        <span style={styles.pageNumber}>
                            Page{" "}
                            {page}{" "}
                            of{" "}
                            {pagination.totalPages}
                        </span>

                        <button
                            onClick={
                                handleNextPage
                            }
                            disabled={
                                page >=
                                pagination.totalPages
                            }
                            style={
                                page >=
                                pagination.totalPages
                                    ? styles.pageButtonDisabled
                                    : styles.pageButton
                            }
                        >
                            Next →
                        </button>

                    </div>
                )}

            </section>

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
        justifyContent: "center",
        fontFamily:
            "Arial, Helvetica, sans-serif"
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
        maxWidth: "1500px",
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
        fontSize: "32px",
        color: "#111827"
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
        maxWidth: "1500px",
        margin: "0 auto 20px",
        padding: "14px 16px",
        background: "#fee2e2",
        border:
            "1px solid #fecaca",
        color: "#991b1b",
        borderRadius: "8px"
    },

    success: {
        maxWidth: "1500px",
        margin: "0 auto 20px",
        padding: "14px 16px",
        background: "#dcfce7",
        border:
            "1px solid #bbf7d0",
        color: "#166534",
        borderRadius: "8px"
    },

    statisticsGrid: {
        maxWidth: "1500px",
        margin: "0 auto 20px",
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px"
    },

    statCard: {
        background: "#ffffff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)"
    },

    statLabel: {
        display: "block",
        color: "#6b7280",
        fontSize: "13px",
        marginBottom: "8px"
    },

    statValue: {
        display: "block",
        fontSize: "25px",
        color: "#111827"
    },

    filterCard: {
        maxWidth: "1500px",
        margin: "0 auto 20px",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "20px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        flexWrap: "wrap"
    },

    searchForm: {
        flex: "1",
        minWidth: "350px",
        display: "flex",
        gap: "10px"
    },

    searchInput: {
        flex: "1",
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "11px 13px",
        fontSize: "14px",
        outline: "none",
        color: "#111827",
        background: "#ffffff"
    },

    searchButton: {
        border: "none",
        borderRadius: "8px",
        padding: "11px 18px",
        background: "#2563eb",
        color: "#ffffff",
        fontWeight: "600",
        cursor: "pointer"
    },

    clearButton: {
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "11px 18px",
        background: "#ffffff",
        color: "#374151",
        fontWeight: "600",
        cursor: "pointer"
    },

    statusFilterBox: {
        minWidth: "200px"
    },

    filterLabel: {
        display: "block",
        marginBottom: "7px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151"
    },

    statusSelect: {
        width: "100%",
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "10px",
        background: "#ffffff",
        color: "#111827",
        fontSize: "14px",
        cursor: "pointer"
    },

    tableCard: {
        maxWidth: "1500px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)"
    },

    tableHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        gap: "20px"
    },

    tableTitle: {
        margin: "0 0 5px",
        fontSize: "21px"
    },

    tableSubtitle: {
        margin: "0",
        color: "#6b7280",
        fontSize: "13px"
    },

    pageInfo: {
        color: "#6b7280",
        fontSize: "13px"
    },

    tableWrapper: {
        overflowX: "auto"
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        minWidth: "1200px"
    },

    th: {
        textAlign: "left",
        padding: "13px 12px",
        background: "#f9fafb",
        borderBottom:
            "2px solid #e5e7eb",
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        color: "#6b7280"
    },

    tr: {
        borderBottom:
            "1px solid #e5e7eb"
    },

    td: {
        padding: "16px 12px",
        verticalAlign: "top",
        fontSize: "13px"
    },

    orderId: {
        color: "#2563eb",
        fontSize: "15px"
    },

    smallText: {
        marginTop: "4px",
        color: "#6b7280",
        fontSize: "11px"
    },

    amount: {
        color: "#111827",
        fontSize: "15px"
    },

    paymentBadge: {
        display: "inline-block",
        marginTop: "7px",
        padding: "5px 8px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: "700"
    },

    statusSelectTable: {
        width: "160px",
        border:
            "1px solid #d1d5db",
        borderRadius: "7px",
        padding: "7px",
        background: "#ffffff",
        color: "#111827",
        fontSize: "12px",
        cursor: "pointer"
    },

    statusBadge: {
        display: "inline-block",
        marginTop: "7px",
        padding: "5px 8px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: "700"
    },

    dateText: {
        color: "#374151",
        fontSize: "12px"
    },

    viewButton: {
        border: "none",
        borderRadius: "7px",
        padding: "9px 13px",
        background: "#2563eb",
        color: "#ffffff",
        fontWeight: "600",
        fontSize: "12px",
        cursor: "pointer",
        whiteSpace: "nowrap"
    },

    invalidId: {
        color: "#dc2626",
        fontSize: "12px",
        fontWeight: "600"
    },

    emptyState: {
        textAlign: "center",
        padding: "70px 20px",
        color: "#6b7280"
    },

    emptyIcon: {
        fontSize: "45px",
        marginBottom: "15px"
    },

    pagination: {
        marginTop: "22px",
        paddingTop: "18px",
        borderTop:
            "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px"
    },

    pageButton: {
        border: "none",
        borderRadius: "7px",
        padding: "9px 16px",
        background: "#2563eb",
        color: "#ffffff",
        fontWeight: "600",
        cursor: "pointer"
    },

    pageButtonDisabled: {
        border: "none",
        borderRadius: "7px",
        padding: "9px 16px",
        background: "#d1d5db",
        color: "#6b7280",
        fontWeight: "600",
        cursor: "not-allowed"
    },

    pageNumber: {
        color: "#374151",
        fontSize: "13px",
        fontWeight: "600"
    }
};

export default AdminOrders;