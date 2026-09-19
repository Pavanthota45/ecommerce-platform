import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

const AdminCustomers = () => {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [customerOrders, setCustomerOrders] = useState([]);
    const [customerAddresses, setCustomerAddresses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [search, setSearch] = useState("");

    const [showDetails, setShowDetails] = useState(false);

    const [activeTab, setActiveTab] = useState("overview");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

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

            loadCustomers();

        } catch (err) {
            console.error("User data error:", err);
            navigate("/login");
        }
    }, [navigate]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/api/admin/customers`,
                getAuthHeaders()
            );

            if (response.data.success) {
                setCustomers(response.data.customers || []);
            } else {
                setError(
                    response.data.message ||
                    "Failed to load customers."
                );
            }

        } catch (err) {
            console.error(
                "Load customers error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load customers."
            );

        } finally {
            setLoading(false);
        }
    };

    const openCustomerDetails = async (customer) => {
        try {
            setSelectedCustomer(customer);
            setShowDetails(true);
            setActiveTab("overview");

            setCustomerOrders([]);
            setCustomerAddresses([]);

            setDetailsLoading(true);
            setError("");

            const [
                customerResponse,
                ordersResponse,
                addressesResponse
            ] = await Promise.all([
                axios.get(
                    `${API_URL}/api/admin/customers/${customer.id}`,
                    getAuthHeaders()
                ),

                axios.get(
                    `${API_URL}/api/admin/customers/${customer.id}/orders`,
                    getAuthHeaders()
                ),

                axios.get(
                    `${API_URL}/api/admin/customers/${customer.id}/addresses`,
                    getAuthHeaders()
                )
            ]);

            if (customerResponse.data.success) {
                setSelectedCustomer(
                    customerResponse.data.customer
                );
            }

            if (ordersResponse.data.success) {
                setCustomerOrders(
                    ordersResponse.data.orders || []
                );
            }

            if (addressesResponse.data.success) {
                setCustomerAddresses(
                    addressesResponse.data.addresses || []
                );
            }

        } catch (err) {
            console.error(
                "Customer details error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to load customer details."
            );

        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setShowDetails(false);
        setSelectedCustomer(null);
        setCustomerOrders([]);
        setCustomerAddresses([]);
        setActiveTab("overview");
    };

    const filteredCustomers = customers.filter(
        (customer) => {
            const searchText =
                search.toLowerCase().trim();

            if (!searchText) {
                return true;
            }

            return (
                String(customer.id || "")
                    .toLowerCase()
                    .includes(searchText) ||

                String(customer.name || "")
                    .toLowerCase()
                    .includes(searchText) ||

                String(customer.email || "")
                    .toLowerCase()
                    .includes(searchText) ||

                String(customer.phone || "")
                    .toLowerCase()
                    .includes(searchText)
            );
        }
    );

    const totalCustomers = customers.length;

    const totalOrders = customers.reduce(
        (total, customer) =>
            total +
            Number(customer.order_count || 0),
        0
    );

    const totalRevenue = customers.reduce(
        (total, customer) =>
            total +
            Number(customer.total_spent || 0),
        0
    );

    const formatCurrency = (amount) => {
        return `₹${Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )}`;
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatDateTime = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    const formatOrderStatus = (status) => {
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

    const getOrderStatusStyle = (status) => {
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
                    background: "#fef3c7",
                    color: "#92400e"
                };

            case "DELIVERED":
                return {
                    background: "#dcfce7",
                    color: "#166534"
                };

            case "CANCELLED":
                return {
                    background: "#fee2e2",
                    color: "#b91c1c"
                };

            case "RETURN_REQUESTED":
                return {
                    background: "#fce7f3",
                    color: "#9d174d"
                };

            case "RETURNED":
                return {
                    background: "#f3e8ff",
                    color: "#7e22ce"
                };

            case "REFUNDED":
                return {
                    background: "#e5e7eb",
                    color: "#374151"
                };

            default:
                return {
                    background: "#f3f4f6",
                    color: "#374151"
                };
        }
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
                "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "25px"
        },

        statCard: {
            background: "white",
            padding: "22px",
            borderRadius: "12px",
            boxShadow:
                "0 2px 10px rgba(0,0,0,0.06)"
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
            boxShadow:
                "0 2px 10px rgba(0,0,0,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap"
        },

        searchInput: {
            width: "100%",
            maxWidth: "550px",
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
            boxShadow:
                "0 2px 10px rgba(0,0,0,0.06)"
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
            borderBottom:
                "1px solid #e5e7eb"
        },

        td: {
            padding: "15px",
            color: "#4b5563",
            fontSize: "14px",
            borderBottom:
                "1px solid #e5e7eb"
        },

        customerName: {
            color: "#111827",
            fontWeight: "700",
            marginBottom: "4px"
        },

        customerId: {
            color: "#9ca3af",
            fontSize: "12px"
        },

        email: {
            color: "#374151",
            marginBottom: "3px"
        },

        phone: {
            color: "#6b7280",
            fontSize: "13px"
        },

        viewButton: {
            border: "none",
            background: "#111827",
            color: "white",
            padding: "8px 13px",
            borderRadius: "7px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "700"
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
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
            boxSizing: "border-box"
        },

        modal: {
            width: "100%",
            maxWidth: "1100px",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "white",
            borderRadius: "14px",
            padding: "25px",
            boxSizing: "border-box"
        },

        modalHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
        },

        modalTitle: {
            margin: 0,
            color: "#111827",
            fontSize: "24px"
        },

        closeButton: {
            border: "none",
            background: "#f3f4f6",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "20px"
        },

        customerHeader: {
            background: "#f9fafb",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px"
        },

        customerHeaderName: {
            fontSize: "22px",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "7px"
        },

        customerHeaderInfo: {
            color: "#6b7280",
            fontSize: "14px",
            marginBottom: "4px"
        },

        tabs: {
            display: "flex",
            gap: "8px",
            borderBottom:
                "1px solid #e5e7eb",
            marginBottom: "20px",
            overflowX: "auto"
        },

        tab: {
            border: "none",
            background: "transparent",
            padding: "12px 17px",
            cursor: "pointer",
            fontWeight: "600",
            color: "#6b7280",
            whiteSpace: "nowrap"
        },

        activeTab: {
            color: "#111827",
            borderBottom:
                "2px solid #111827"
        },

        infoGrid: {
            display: "grid",
            gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "15px"
        },

        infoCard: {
            background: "#f9fafb",
            borderRadius: "9px",
            padding: "16px"
        },

        infoLabel: {
            color: "#6b7280",
            fontSize: "12px",
            marginBottom: "6px"
        },

        infoValue: {
            color: "#111827",
            fontSize: "16px",
            fontWeight: "600"
        },

        detailSection: {
            marginBottom: "25px"
        },

        sectionTitle: {
            color: "#111827",
            fontSize: "18px",
            marginTop: 0,
            marginBottom: "14px"
        },

        orderCard: {
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "17px",
            marginBottom: "12px"
        },

        orderTop: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "12px"
        },

        orderId: {
            fontWeight: "700",
            color: "#111827"
        },

        orderInfoGrid: {
            display: "grid",
            gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px"
        },

        orderInfoLabel: {
            color: "#9ca3af",
            fontSize: "11px",
            marginBottom: "4px"
        },

        orderInfoValue: {
            color: "#374151",
            fontSize: "13px",
            fontWeight: "600"
        },

        statusBadge: {
            display: "inline-block",
            padding: "5px 10px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: "700"
        },

        addressCard: {
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            padding: "17px",
            marginBottom: "12px"
        },

        defaultBadge: {
            display: "inline-block",
            background: "#dcfce7",
            color: "#166534",
            padding: "4px 9px",
            borderRadius: "15px",
            fontSize: "11px",
            fontWeight: "700",
            marginBottom: "8px"
        },

        addressText: {
            color: "#4b5563",
            fontSize: "14px",
            lineHeight: "1.6"
        },

        noData: {
            background: "#f9fafb",
            borderRadius: "9px",
            padding: "30px",
            textAlign: "center",
            color: "#6b7280"
        },

        detailLoading: {
            padding: "40px",
            textAlign: "center",
            color: "#6b7280"
        }
    };

    return (
        <div style={styles.page}>

            <div style={styles.container}>

                <div style={styles.topBar}>

                    <div>
                        <h1 style={styles.title}>
                            Customer Management
                        </h1>

                        <p style={styles.subtitle}>
                            View and manage your registered customers.
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
                            Total Customers
                        </div>

                        <div style={styles.statValue}>
                            {totalCustomers}
                        </div>

                    </div>

                    <div style={styles.statCard}>

                        <div style={styles.statLabel}>
                            Total Orders
                        </div>

                        <div style={styles.statValue}>
                            {totalOrders}
                        </div>

                    </div>

                    <div style={styles.statCard}>

                        <div style={styles.statLabel}>
                            Customer Revenue
                        </div>

                        <div style={styles.statValue}>
                            {formatCurrency(totalRevenue)}
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
                        placeholder="Search by name, email, phone or customer ID..."
                        style={styles.searchInput}
                    />

                    <div style={styles.resultCount}>
                        Showing{" "}
                        <strong>
                            {filteredCustomers.length}
                        </strong>{" "}
                        of{" "}
                        <strong>
                            {customers.length}
                        </strong>{" "}
                        customers
                    </div>

                </div>

                <div style={styles.tableContainer}>

                    {loading ? (

                        <div style={styles.loading}>
                            Loading customers...
                        </div>

                    ) : filteredCustomers.length === 0 ? (

                        <div style={styles.empty}>

                            <h3>
                                No customers found
                            </h3>

                            <p>
                                {search
                                    ? "Try a different search."
                                    : "There are no registered customers yet."
                                }
                            </p>

                        </div>

                    ) : (

                        <table style={styles.table}>

                            <thead>

                                <tr>

                                    <th style={styles.th}>
                                        Customer
                                    </th>

                                    <th style={styles.th}>
                                        Contact
                                    </th>

                                    <th style={styles.th}>
                                        Orders
                                    </th>

                                    <th style={styles.th}>
                                        Total Spent
                                    </th>

                                    <th style={styles.th}>
                                        Registered
                                    </th>

                                    <th style={styles.th}>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredCustomers.map(
                                    (customer) => (

                                        <tr
                                            key={customer.id}
                                        >

                                            <td style={styles.td}>

                                                <div
                                                    style={
                                                        styles.customerName
                                                    }
                                                >
                                                    {
                                                        customer.name ||
                                                        "Unnamed Customer"
                                                    }
                                                </div>

                                                <div
                                                    style={
                                                        styles.customerId
                                                    }
                                                >
                                                    Customer ID: #
                                                    {
                                                        customer.id
                                                    }
                                                </div>

                                            </td>

                                            <td style={styles.td}>

                                                <div
                                                    style={
                                                        styles.email
                                                    }
                                                >
                                                    {
                                                        customer.email
                                                    }
                                                </div>

                                                <div
                                                    style={
                                                        styles.phone
                                                    }
                                                >
                                                    {
                                                        customer.phone ||
                                                        "No phone number"
                                                    }
                                                </div>

                                            </td>

                                            <td style={styles.td}>
                                                {
                                                    Number(
                                                        customer.order_count ||
                                                        0
                                                    )
                                                }
                                            </td>

                                            <td style={styles.td}>

                                                <strong>
                                                    {formatCurrency(
                                                        customer.total_spent
                                                    )}
                                                </strong>

                                            </td>

                                            <td style={styles.td}>
                                                {
                                                    formatDate(
                                                        customer.created_at
                                                    )
                                                }
                                            </td>

                                            <td style={styles.td}>

                                                <button
                                                    type="button"
                                                    style={
                                                        styles.viewButton
                                                    }
                                                    onClick={() =>
                                                        openCustomerDetails(
                                                            customer
                                                        )
                                                    }
                                                >
                                                    View Details
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </div>

            {showDetails && (

                <div
                    style={styles.modalOverlay}
                    onClick={closeDetails}
                >

                    <div
                        style={styles.modal}
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div style={styles.modalHeader}>

                            <h2 style={styles.modalTitle}>
                                Customer Details
                            </h2>

                            <button
                                type="button"
                                style={styles.closeButton}
                                onClick={closeDetails}
                            >
                                ×
                            </button>

                        </div>

                        {detailsLoading ? (

                            <div
                                style={
                                    styles.detailLoading
                                }
                            >
                                Loading customer details...
                            </div>

                        ) : selectedCustomer ? (

                            <>

                                <div
                                    style={
                                        styles.customerHeader
                                    }
                                >

                                    <div
                                        style={
                                            styles.customerHeaderName
                                        }
                                    >
                                        {
                                            selectedCustomer.name ||
                                            "Unnamed Customer"
                                        }
                                    </div>

                                    <div
                                        style={
                                            styles.customerHeaderInfo
                                        }
                                    >
                                        Customer ID: #
                                        {
                                            selectedCustomer.id
                                        }
                                    </div>

                                    <div
                                        style={
                                            styles.customerHeaderInfo
                                        }
                                    >
                                        Email:{" "}
                                        {
                                            selectedCustomer.email
                                        }
                                    </div>

                                    <div
                                        style={
                                            styles.customerHeaderInfo
                                        }
                                    >
                                        Phone:{" "}
                                        {
                                            selectedCustomer.phone ||
                                            "Not provided"
                                        }
                                    </div>

                                </div>

                                <div style={styles.tabs}>

                                    <button
                                        type="button"
                                        style={{
                                            ...styles.tab,
                                            ...(activeTab ===
                                            "overview"
                                                ? styles.activeTab
                                                : {})
                                        }}
                                        onClick={() =>
                                            setActiveTab(
                                                "overview"
                                            )
                                        }
                                    >
                                        Overview
                                    </button>

                                    <button
                                        type="button"
                                        style={{
                                            ...styles.tab,
                                            ...(activeTab ===
                                            "orders"
                                                ? styles.activeTab
                                                : {})
                                        }}
                                        onClick={() =>
                                            setActiveTab(
                                                "orders"
                                            )
                                        }
                                    >
                                        Orders (
                                        {
                                            customerOrders.length
                                        }
                                        )
                                    </button>

                                    <button
                                        type="button"
                                        style={{
                                            ...styles.tab,
                                            ...(activeTab ===
                                            "addresses"
                                                ? styles.activeTab
                                                : {})
                                        }}
                                        onClick={() =>
                                            setActiveTab(
                                                "addresses"
                                            )
                                        }
                                    >
                                        Addresses (
                                        {
                                            customerAddresses.length
                                        }
                                        )
                                    </button>

                                </div>

                                {activeTab ===
                                    "overview" && (

                                    <div>

                                        <div
                                            style={
                                                styles.detailSection
                                            }
                                        >

                                            <h3
                                                style={
                                                    styles.sectionTitle
                                                }
                                            >
                                                Customer Information
                                            </h3>

                                            <div
                                                style={
                                                    styles.infoGrid
                                                }
                                            >

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Full Name
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {
                                                            selectedCustomer.name ||
                                                            "-"
                                                        }
                                                    </div>

                                                </div>

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Email
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {
                                                            selectedCustomer.email ||
                                                            "-"
                                                        }
                                                    </div>

                                                </div>

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Phone
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {
                                                            selectedCustomer.phone ||
                                                            "Not provided"
                                                        }
                                                    </div>

                                                </div>

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Registered
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {
                                                            formatDate(
                                                                selectedCustomer.created_at
                                                            )
                                                        }
                                                    </div>

                                                </div>

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Total Orders
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {
                                                            Number(
                                                                selectedCustomer.order_count ||
                                                                0
                                                            )
                                                        }
                                                    </div>

                                                </div>

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Total Spent
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            selectedCustomer.total_spent
                                                        )}
                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                        <div
                                            style={
                                                styles.detailSection
                                            }
                                        >

                                            <h3
                                                style={
                                                    styles.sectionTitle
                                                }
                                            >
                                                Customer Summary
                                            </h3>

                                            <div
                                                style={
                                                    styles.infoGrid
                                                }
                                            >

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Saved Addresses
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {
                                                            customerAddresses.length
                                                        }
                                                    </div>

                                                </div>

                                                <div
                                                    style={
                                                        styles.infoCard
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.infoLabel
                                                        }
                                                    >
                                                        Average Order Value
                                                    </div>

                                                    <div
                                                        style={
                                                            styles.infoValue
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            Number(
                                                                selectedCustomer.order_count ||
                                                                0
                                                            ) > 0
                                                                ? Number(
                                                                    selectedCustomer.total_spent ||
                                                                    0
                                                                ) /
                                                                Number(
                                                                    selectedCustomer.order_count
                                                                )
                                                                : 0
                                                        )}
                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>

                                )}

                                {activeTab ===
                                    "orders" && (

                                    <div>

                                        <h3
                                            style={
                                                styles.sectionTitle
                                            }
                                        >
                                            Customer Orders
                                        </h3>

                                        {customerOrders.length ===
                                        0 ? (

                                            <div
                                                style={
                                                    styles.noData
                                                }
                                            >
                                                This customer has not placed any orders yet.
                                            </div>

                                        ) : (

                                            customerOrders.map(
                                                (order) => (

                                                    <div
                                                        key={
                                                            order.id
                                                        }
                                                        style={
                                                            styles.orderCard
                                                        }
                                                    >

                                                        <div
                                                            style={
                                                                styles.orderTop
                                                            }
                                                        >

                                                            <div
                                                                style={
                                                                    styles.orderId
                                                                }
                                                            >
                                                                Order #
                                                                {
                                                                    order.id
                                                                }
                                                            </div>

                                                            <span
                                                                style={{
                                                                    ...styles.statusBadge,
                                                                    ...getOrderStatusStyle(
                                                                        order.status
                                                                    )
                                                                }}
                                                            >
                                                                {
                                                                    formatOrderStatus(
                                                                        order.status
                                                                    )
                                                                }
                                                            </span>

                                                        </div>

                                                        <div
                                                            style={
                                                                styles.orderInfoGrid
                                                            }
                                                        >

                                                            <div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoLabel
                                                                    }
                                                                >
                                                                    Order Date
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoValue
                                                                    }
                                                                >
                                                                    {
                                                                        formatDateTime(
                                                                            order.created_at
                                                                        )
                                                                    }
                                                                </div>

                                                            </div>

                                                            <div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoLabel
                                                                    }
                                                                >
                                                                    Subtotal
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoValue
                                                                    }
                                                                >
                                                                    {formatCurrency(
                                                                        order.subtotal
                                                                    )}
                                                                </div>

                                                            </div>

                                                            <div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoLabel
                                                                    }
                                                                >
                                                                    Discount
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoValue
                                                                    }
                                                                >
                                                                    {formatCurrency(
                                                                        order.discount
                                                                    )}
                                                                </div>

                                                            </div>

                                                            <div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoLabel
                                                                    }
                                                                >
                                                                    Delivery Fee
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoValue
                                                                    }
                                                                >
                                                                    {formatCurrency(
                                                                        order.delivery_fee
                                                                    )}
                                                                </div>

                                                            </div>

                                                            <div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoLabel
                                                                    }
                                                                >
                                                                    Total
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoValue
                                                                    }
                                                                >
                                                                    {formatCurrency(
                                                                        order.total_amount
                                                                    )}
                                                                </div>

                                                            </div>

                                                            <div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoLabel
                                                                    }
                                                                >
                                                                    Payment
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.orderInfoValue
                                                                    }
                                                                >
                                                                    {
                                                                        order.payment_method ||
                                                                        "Not available"
                                                                    }
                                                                    {" - "}
                                                                    {
                                                                        order.payment_status ||
                                                                        "Unknown"
                                                                    }
                                                                </div>

                                                            </div>

                                                        </div>

                                                    </div>

                                                )
                                            )

                                        )}

                                    </div>

                                )}

                                {activeTab ===
                                    "addresses" && (

                                    <div>

                                        <h3
                                            style={
                                                styles.sectionTitle
                                            }
                                        >
                                            Saved Addresses
                                        </h3>

                                        {customerAddresses.length ===
                                        0 ? (

                                            <div
                                                style={
                                                    styles.noData
                                                }
                                            >
                                                This customer has no saved addresses.
                                            </div>

                                        ) : (

                                            customerAddresses.map(
                                                (address) => (

                                                    <div
                                                        key={
                                                            address.id
                                                        }
                                                        style={
                                                            styles.addressCard
                                                        }
                                                    >

                                                        {Number(
                                                            address.is_default
                                                        ) ===
                                                            1 && (

                                                            <div
                                                                style={
                                                                    styles.defaultBadge
                                                                }
                                                            >
                                                                DEFAULT ADDRESS
                                                            </div>

                                                        )}

                                                        <div
                                                            style={
                                                                styles.addressText
                                                            }
                                                        >

                                                            <strong>
                                                                {
                                                                    address.full_name
                                                                }
                                                            </strong>

                                                            <br />

                                                            {
                                                                address.phone
                                                            }

                                                            <br />

                                                            {
                                                                address.address_line1
                                                            }

                                                            {address.address_line2 && (
                                                                <>
                                                                    <br />
                                                                    {
                                                                        address.address_line2
                                                                    }
                                                                </>
                                                            )}

                                                            <br />

                                                            {
                                                                address.city
                                                            }
                                                            ,{" "}
                                                            {
                                                                address.state
                                                            }{" "}
                                                            -{" "}
                                                            {
                                                                address.postal_code
                                                            }

                                                            <br />

                                                            {
                                                                address.country
                                                            }

                                                        </div>

                                                    </div>

                                                )
                                            )

                                        )}

                                    </div>

                                )}

                            </>

                        ) : (

                            <div style={styles.noData}>
                                Customer information is not available.
                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
};

export default AdminCustomers;