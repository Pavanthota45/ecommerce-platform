import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Addresses() {
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
        is_default: false
    });

    const token = localStorage.getItem("token");
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    useEffect(() => {
        if (!token || !user || user.role !== "customer") {
            navigate("/login");
            return;
        }

        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/addresses",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setAddresses(response.data.addresses || []);

        } catch (err) {
            console.error("Load addresses error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load addresses"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));
    };

    const resetForm = () => {
        setForm({
            full_name: "",
            phone: "",
            address_line1: "",
            address_line2: "",
            city: "",
            state: "",
            postal_code: "",
            country: "India",
            is_default: false
        });

        setEditingId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");
        setSaving(true);

        try {
            let response;

            if (editingId) {
                response = await axios.put(
                    `http://localhost:5000/api/addresses/${editingId}`,
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            } else {
                response = await axios.post(
                    "http://localhost:5000/api/addresses",
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            }

            setMessage(
                response.data.message ||
                "Address saved successfully"
            );

            resetForm();

            await loadAddresses();

        } catch (err) {
            console.error("Save address error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to save address"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (address) => {
        setMessage("");
        setError("");

        setEditingId(address.id);

        setForm({
            full_name: address.full_name || "",
            phone: address.phone || "",
            address_line1:
                address.address_line1 || "",
            address_line2:
                address.address_line2 || "",
            city: address.city || "",
            state: address.state || "",
            postal_code:
                address.postal_code || "",
            country:
                address.country || "India",
            is_default:
                Boolean(address.is_default)
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleSetDefault = async (id) => {
        try {
            setMessage("");
            setError("");

            const response = await axios.put(
                `http://localhost:5000/api/addresses/${id}/default`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message ||
                "Default address updated"
            );

            await loadAddresses();

        } catch (err) {
            console.error(
                "Set default address error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to set default address"
            );
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this address?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:5000/api/addresses/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message ||
                "Address deleted successfully"
            );

            if (editingId === id) {
                resetForm();
            }

            await loadAddresses();

        } catch (err) {
            console.error(
                "Delete address error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to delete address"
            );
        }
    };

    if (loading) {
        return (
            <div style={styles.loadingPage}>
                <h2>Loading addresses...</h2>
            </div>
        );
    }

    return (
        <div style={styles.page}>

            {/* HEADER */}
            <header style={styles.header}>

                <div>
                    <Link
                        to="/"
                        style={styles.logo}
                    >
                        E-Commerce Store
                    </Link>
                </div>

                <div style={styles.headerLinks}>

                    <Link
                        to="/"
                        style={styles.headerLink}
                    >
                        Home
                    </Link>

                    <Link
                        to="/cart"
                        style={styles.headerLink}
                    >
                        Cart
                    </Link>

                    <Link
                        to="/addresses"
                        style={styles.activeHeaderLink}
                    >
                        Addresses
                    </Link>

                    <button
                        style={styles.logoutButton}
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            navigate("/login");
                        }}
                    >
                        Logout
                    </button>

                </div>

            </header>

            {/* MAIN */}
            <main style={styles.container}>

                <div style={styles.titleSection}>

                    <h1 style={styles.title}>
                        My Addresses
                    </h1>

                    <p style={styles.subtitle}>
                        Manage your delivery addresses
                    </p>

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

                {/* ADDRESS FORM */}
                <section style={styles.formCard}>

                    <div style={styles.formHeader}>

                        <h2>
                            {editingId
                                ? "Edit Address"
                                : "Add New Address"}
                        </h2>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                style={styles.cancelButton}
                            >
                                Cancel Edit
                            </button>
                        )}

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        style={styles.form}
                    >

                        <div style={styles.twoColumns}>

                            <div style={styles.field}>
                                <label>
                                    Full Name *
                                </label>

                                <input
                                    type="text"
                                    name="full_name"
                                    value={form.full_name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div style={styles.field}>
                                <label>
                                    Phone *
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>

                        </div>

                        <div style={styles.field}>
                            <label>
                                Address Line 1 *
                            </label>

                            <input
                                type="text"
                                name="address_line1"
                                value={form.address_line1}
                                onChange={handleChange}
                                placeholder="House number, street, area"
                                required
                            />
                        </div>

                        <div style={styles.field}>
                            <label>
                                Address Line 2
                            </label>

                            <input
                                type="text"
                                name="address_line2"
                                value={form.address_line2}
                                onChange={handleChange}
                                placeholder="Landmark, apartment, etc. (optional)"
                            />
                        </div>

                        <div style={styles.threeColumns}>

                            <div style={styles.field}>
                                <label>
                                    City *
                                </label>

                                <input
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    required
                                />
                            </div>

                            <div style={styles.field}>
                                <label>
                                    State *
                                </label>

                                <input
                                    type="text"
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                    placeholder="State"
                                    required
                                />
                            </div>

                            <div style={styles.field}>
                                <label>
                                    Postal Code *
                                </label>

                                <input
                                    type="text"
                                    name="postal_code"
                                    value={form.postal_code}
                                    onChange={handleChange}
                                    placeholder="Postal code"
                                    required
                                />
                            </div>

                        </div>

                        <div style={styles.field}>
                            <label>
                                Country *
                            </label>

                            <input
                                type="text"
                                name="country"
                                value={form.country}
                                onChange={handleChange}
                                placeholder="Country"
                                required
                            />
                        </div>

                        <label style={styles.checkboxRow}>

                            <input
                                type="checkbox"
                                name="is_default"
                                checked={form.is_default}
                                onChange={handleChange}
                            />

                            <span>
                                Set as default address
                            </span>

                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            style={styles.saveButton}
                        >
                            {saving
                                ? "Saving..."
                                : editingId
                                ? "Update Address"
                                : "Add Address"}
                        </button>

                    </form>

                </section>

                {/* SAVED ADDRESSES */}
                <section style={styles.addressSection}>

                    <div style={styles.sectionHeader}>

                        <h2>
                            Saved Addresses
                        </h2>

                        <span style={styles.count}>
                            {addresses.length} address
                            {addresses.length !== 1
                                ? "es"
                                : ""}
                        </span>

                    </div>

                    {addresses.length === 0 ? (

                        <div style={styles.emptyCard}>

                            <div style={styles.emptyIcon}>
                                📍
                            </div>

                            <h3>
                                No addresses saved
                            </h3>

                            <p>
                                Add an address above to use
                                it during checkout.
                            </p>

                        </div>

                    ) : (

                        <div style={styles.addressGrid}>

                            {addresses.map(
                                (address) => (
                                    <div
                                        key={address.id}
                                        style={styles.addressCard}
                                    >

                                        <div
                                            style={
                                                styles.addressTop
                                            }
                                        >

                                            <div>
                                                <h3
                                                    style={
                                                        styles.addressName
                                                    }
                                                >
                                                    {
                                                        address.full_name
                                                    }
                                                </h3>

                                                {Boolean(
                                                    address.is_default
                                                ) && (
                                                    <span
                                                        style={
                                                            styles.defaultBadge
                                                        }
                                                    >
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            style={
                                                styles.addressDetails
                                            }
                                        >

                                            <p>
                                                📞{" "}
                                                {address.phone}
                                            </p>

                                            <p>
                                                {
                                                    address.address_line1
                                                }
                                            </p>

                                            {address.address_line2 && (
                                                <p>
                                                    {
                                                        address.address_line2
                                                    }
                                                </p>
                                            )}

                                            <p>
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
                                            </p>

                                            <p>
                                                {
                                                    address.country
                                                }
                                            </p>

                                        </div>

                                        <div
                                            style={
                                                styles.actionRow
                                            }
                                        >

                                            <button
                                                onClick={() =>
                                                    handleEdit(
                                                        address
                                                    )
                                                }
                                                style={
                                                    styles.editButton
                                                }
                                            >
                                                Edit
                                            </button>

                                            {!Boolean(
                                                address.is_default
                                            ) && (
                                                <button
                                                    onClick={() =>
                                                        handleSetDefault(
                                                            address.id
                                                        )
                                                    }
                                                    style={
                                                        styles.defaultButton
                                                    }
                                                >
                                                    Set Default
                                                </button>
                                            )}

                                            <button
                                                onClick={() =>
                                                    handleDelete(
                                                        address.id
                                                    )
                                                }
                                                style={
                                                    styles.deleteButton
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb"
    },

    loadingPage: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif"
    },

    header: {
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "18px 6%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap"
    },

    logo: {
        textDecoration: "none",
        color: "#111827",
        fontSize: "22px",
        fontWeight: "700"
    },

    headerLinks: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
        flexWrap: "wrap"
    },

    headerLink: {
        textDecoration: "none",
        color: "#374151",
        fontWeight: "600"
    },

    activeHeaderLink: {
        textDecoration: "none",
        color: "#2563eb",
        fontWeight: "700"
    },

    logoutButton: {
        border: "none",
        background: "#111827",
        color: "#ffffff",
        padding: "9px 16px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    container: {
        width: "92%",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "35px 0 60px"
    },

    titleSection: {
        marginBottom: "25px"
    },

    title: {
        margin: "0 0 8px",
        color: "#111827"
    },

    subtitle: {
        margin: 0,
        color: "#6b7280"
    },

    successMessage: {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px"
    },

    errorMessage: {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fca5a5",
        padding: "12px 16px",
        borderRadius: "8px",
        marginBottom: "20px"
    },

    formCard: {
        background: "#ffffff",
        padding: "28px",
        borderRadius: "12px",
        boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
        marginBottom: "35px"
    },

    formHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "25px"
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px"
    },

    twoColumns: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "18px"
    },

    threeColumns: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "18px"
    },

    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },

    checkboxRow: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        color: "#374151",
        fontWeight: "600",
        cursor: "pointer"
    },

    saveButton: {
        width: "fit-content",
        border: "none",
        background: "#2563eb",
        color: "#ffffff",
        padding: "12px 22px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "15px"
    },

    cancelButton: {
        border: "1px solid #d1d5db",
        background: "#ffffff",
        color: "#374151",
        padding: "9px 15px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px"
    },

    count: {
        color: "#6b7280",
        fontSize: "14px"
    },

    addressGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px"
    },

    addressCard: {
        background: "#ffffff",
        borderRadius: "12px",
        padding: "22px",
        boxShadow: "0 3px 15px rgba(0,0,0,0.06)"
    },

    addressTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "15px"
    },

    addressName: {
        margin: "0 0 8px",
        color: "#111827"
    },

    defaultBadge: {
        display: "inline-block",
        background: "#dcfce7",
        color: "#166534",
        padding: "4px 9px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700"
    },

    addressDetails: {
        color: "#4b5563",
        lineHeight: "1.6",
        marginBottom: "18px"
    },

    actionRow: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        borderTop: "1px solid #eee",
        paddingTop: "15px"
    },

    editButton: {
        border: "1px solid #2563eb",
        background: "#ffffff",
        color: "#2563eb",
        padding: "8px 13px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    defaultButton: {
        border: "1px solid #16a34a",
        background: "#ffffff",
        color: "#15803d",
        padding: "8px 13px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    deleteButton: {
        border: "1px solid #dc2626",
        background: "#ffffff",
        color: "#dc2626",
        padding: "8px 13px",
        borderRadius: "7px",
        cursor: "pointer",
        fontWeight: "600"
    },

    emptyCard: {
        background: "#ffffff",
        borderRadius: "12px",
        padding: "50px 20px",
        textAlign: "center",
        boxShadow: "0 3px 15px rgba(0,0,0,0.06)"
    },

    emptyIcon: {
        fontSize: "45px",
        marginBottom: "10px"
    }
};

export default Addresses;