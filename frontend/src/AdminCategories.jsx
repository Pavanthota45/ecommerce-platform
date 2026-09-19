import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function AdminCategories() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        description: "",
        image_url: ""
    });

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            if (user.role !== "admin") {
                navigate("/");
                return;
            }

            loadCategories();
        } catch (err) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
        }
    }, [navigate]);

    const getToken = () => {
        return localStorage.getItem("token");
    };

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:5000/api/categories"
            );

            setCategories(response.data.categories || []);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to load categories"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            image_url: ""
        });

        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!form.name.trim()) {
            setError("Category name is required.");
            return;
        }

        const token = getToken();

        try {
            if (editingId) {
                await axios.put(
                    `http://localhost:5000/api/categories/${editingId}`,
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage("Category updated successfully.");
            } else {
                await axios.post(
                    "http://localhost:5000/api/categories",
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMessage("Category added successfully.");
            }

            resetForm();
            loadCategories();

        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Something went wrong."
            );
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);

        setForm({
            name: category.name || "",
            description: category.description || "",
            image_url: category.image_url || ""
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this category?"
        );

        if (!confirmed) {
            return;
        }

        const token = getToken();

        setMessage("");
        setError("");

        try {
            await axios.delete(
                `http://localhost:5000/api/categories/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage("Category deleted successfully.");

            loadCategories();

        } catch (err) {
            console.error(err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Failed to delete category."
            );
        }
    };

    return (
        <div style={styles.page}>

            {/* HEADER */}
            <header style={styles.header}>

                <div>
                    <h1 style={styles.headerTitle}>
                        Category Management
                    </h1>

                    <p style={styles.headerSubtitle}>
                        Manage your product categories
                    </p>
                </div>

                <Link
                    to="/admin"
                    style={styles.backButton}
                >
                    ← Back to Dashboard
                </Link>

            </header>

            <main style={styles.container}>

                {/* FORM */}
                <section style={styles.formSection}>

                    <h2 style={styles.sectionTitle}>
                        {editingId
                            ? "Edit Category"
                            : "Add New Category"}
                    </h2>

                    {message && (
                        <div style={styles.success}>
                            {message}
                        </div>
                    )}

                    {error && (
                        <div style={styles.error}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Category Name *
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Example: Electronics"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Enter category description"
                                rows="4"
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>
                                Image URL
                            </label>

                            <input
                                type="text"
                                name="image_url"
                                value={form.image_url}
                                onChange={handleChange}
                                placeholder="https://example.com/image.jpg"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formButtons}>

                            <button
                                type="submit"
                                style={styles.primaryButton}
                            >
                                {editingId
                                    ? "Update Category"
                                    : "Add Category"}
                            </button>

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

                    </form>

                </section>

                {/* CATEGORY LIST */}
                <section style={styles.listSection}>

                    <div style={styles.listHeader}>

                        <div>
                            <h2 style={styles.sectionTitle}>
                                Existing Categories
                            </h2>

                            <p style={styles.count}>
                                Total Categories: {categories.length}
                            </p>
                        </div>

                        <button
                            onClick={loadCategories}
                            style={styles.refreshButton}
                        >
                            ↻ Refresh
                        </button>

                    </div>

                    {loading ? (
                        <div style={styles.center}>
                            Loading categories...
                        </div>
                    ) : categories.length === 0 ? (
                        <div style={styles.empty}>
                            <div style={styles.emptyIcon}>
                                📂
                            </div>

                            <h3>
                                No categories yet
                            </h3>

                            <p>
                                Add your first category using the form above.
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
                                            Image
                                        </th>

                                        <th style={styles.th}>
                                            Name
                                        </th>

                                        <th style={styles.th}>
                                            Description
                                        </th>

                                        <th style={styles.th}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {categories.map((category) => (

                                        <tr key={category.id}>

                                            <td style={styles.td}>
                                                {category.id}
                                            </td>

                                            <td style={styles.td}>

                                                {category.image_url ? (
                                                    <img
                                                        src={category.image_url}
                                                        alt={category.name}
                                                        style={styles.image}
                                                    />
                                                ) : (
                                                    <div style={styles.noImage}>
                                                        📁
                                                    </div>
                                                )}

                                            </td>

                                            <td style={styles.td}>
                                                <strong>
                                                    {category.name}
                                                </strong>
                                            </td>

                                            <td style={styles.td}>
                                                {category.description ||
                                                    "No description"}
                                            </td>

                                            <td style={styles.td}>

                                                <div style={styles.actions}>

                                                    <button
                                                        onClick={() =>
                                                            handleEdit(category)
                                                        }
                                                        style={styles.editButton}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                category.id
                                                            )
                                                        }
                                                        style={styles.deleteButton}
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

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
        backgroundColor: "#f5f7fb",
        fontFamily: "Arial, sans-serif"
    },

    header: {
        backgroundColor: "#111827",
        color: "white",
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px"
    },

    headerTitle: {
        margin: 0,
        fontSize: "26px"
    },

    headerSubtitle: {
        margin: "5px 0 0",
        color: "#d1d5db"
    },

    backButton: {
        color: "white",
        textDecoration: "none",
        backgroundColor: "#374151",
        padding: "10px 16px",
        borderRadius: "6px",
        fontWeight: "bold"
    },

    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "35px 25px"
    },

    formSection: {
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "10px",
        marginBottom: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    },

    listSection: {
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
    },

    sectionTitle: {
        marginTop: 0,
        color: "#111827"
    },

    formGroup: {
        marginBottom: "20px"
    },

    label: {
        display: "block",
        marginBottom: "7px",
        fontWeight: "bold",
        color: "#374151"
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "15px"
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        fontSize: "15px",
        resize: "vertical"
    },

    formButtons: {
        display: "flex",
        gap: "10px"
    },

    primaryButton: {
        backgroundColor: "#2563eb",
        color: "white",
        border: "none",
        padding: "12px 20px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    cancelButton: {
        backgroundColor: "#6b7280",
        color: "white",
        border: "none",
        padding: "12px 20px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    success: {
        backgroundColor: "#dcfce7",
        color: "#166534",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "20px"
    },

    error: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "20px"
    },

    listHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
    },

    count: {
        color: "#6b7280",
        margin: "5px 0 0"
    },

    refreshButton: {
        backgroundColor: "#374151",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "6px",
        cursor: "pointer"
    },

    center: {
        textAlign: "center",
        padding: "40px",
        color: "#6b7280"
    },

    empty: {
        textAlign: "center",
        padding: "50px",
        border: "1px dashed #d1d5db",
        borderRadius: "8px",
        color: "#6b7280"
    },

    emptyIcon: {
        fontSize: "45px"
    },

    tableWrapper: {
        overflowX: "auto"
    },

    table: {
        width: "100%",
        borderCollapse: "collapse"
    },

    th: {
        textAlign: "left",
        padding: "14px",
        backgroundColor: "#f3f4f6",
        borderBottom: "2px solid #e5e7eb",
        color: "#374151"
    },

    td: {
        padding: "14px",
        borderBottom: "1px solid #e5e7eb",
        verticalAlign: "middle"
    },

    image: {
        width: "55px",
        height: "55px",
        objectFit: "cover",
        borderRadius: "6px"
    },

    noImage: {
        width: "55px",
        height: "55px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: "6px",
        fontSize: "25px"
    },

    actions: {
        display: "flex",
        gap: "8px"
    },

    editButton: {
        backgroundColor: "#f59e0b",
        color: "white",
        border: "none",
        padding: "8px 12px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    deleteButton: {
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
        padding: "8px 12px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold"
    }
};

export default AdminCategories;