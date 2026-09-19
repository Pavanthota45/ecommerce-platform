import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const AdminCoupons = () => {
    const navigate = useNavigate();

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        code: "",
        discount_type: "PERCENTAGE",
        discount_value: "",
        min_order_amount: "0",
        max_discount: "",
        usage_limit: "",
        expires_at: "",
        status: "active"
    });

    // ==========================================
    // AUTH CHECK
    // ==========================================

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userString = localStorage.getItem("user");

        if (!token || !userString) {
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(userString);

            if (user.role !== "admin") {
                navigate("/");
                return;
            }

            loadCoupons();
        } catch (err) {
            console.error("Auth check error:", err);

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            navigate("/login");
        }
    }, [navigate]);

    // ==========================================
    // LOAD COUPONS
    // ==========================================

    const loadCoupons = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${API_URL}/admin/coupons`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setCoupons(response.data.coupons || []);
            } else {
                setError(
                    response.data.message ||
                    "Unable to load coupons."
                );
            }

        } catch (err) {
            console.error("Load coupons error:", err);

            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");
                return;
            }

            setError(
                err.response?.data?.message ||
                "Unable to load coupons."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // FORM INPUT
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // ==========================================
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setForm({
            code: "",
            discount_type: "PERCENTAGE",
            discount_value: "",
            min_order_amount: "0",
            max_discount: "",
            usage_limit: "",
            expires_at: "",
            status: "active"
        });

        setEditingId(null);
    };

    // ==========================================
    // SUBMIT FORM
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const code = form.code.trim().toUpperCase();

        if (!code) {
            setError("Coupon code is required.");
            return;
        }

        if (!form.discount_value) {
            setError("Discount value is required.");
            return;
        }

        const discountValue = Number(
            form.discount_value
        );

        if (
            !Number.isFinite(discountValue) ||
            discountValue <= 0
        ) {
            setError(
                "Discount value must be greater than 0."
            );
            return;
        }

        if (
            form.discount_type === "PERCENTAGE" &&
            discountValue > 100
        ) {
            setError(
                "Percentage discount cannot be greater than 100."
            );
            return;
        }

        const minOrderAmount = Number(
            form.min_order_amount || 0
        );

        if (
            !Number.isFinite(minOrderAmount) ||
            minOrderAmount < 0
        ) {
            setError(
                "Minimum order amount cannot be negative."
            );
            return;
        }

        let maxDiscount = null;

        if (form.max_discount !== "") {
            maxDiscount = Number(
                form.max_discount
            );

            if (
                !Number.isFinite(maxDiscount) ||
                maxDiscount <= 0
            ) {
                setError(
                    "Maximum discount must be greater than 0."
                );
                return;
            }
        }

        let usageLimit = null;

        if (form.usage_limit !== "") {
            usageLimit = Number(
                form.usage_limit
            );

            if (
                !Number.isInteger(usageLimit) ||
                usageLimit <= 0
            ) {
                setError(
                    "Usage limit must be a positive whole number."
                );
                return;
            }
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            const data = {
                code,
                discount_type:
                    form.discount_type,
                discount_value:
                    discountValue,
                min_order_amount:
                    minOrderAmount,
                max_discount:
                    maxDiscount,
                usage_limit:
                    usageLimit,
                expires_at:
                    form.expires_at === ""
                        ? null
                        : form.expires_at,
                status:
                    form.status
            };

            if (editingId) {
                await axios.put(
                    `${API_URL}/admin/coupons/${editingId}`,
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setSuccess(
                    "Coupon updated successfully."
                );

            } else {
                await axios.post(
                    `${API_URL}/admin/coupons`,
                    data,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                setSuccess(
                    "Coupon created successfully."
                );
            }

            resetForm();

            await loadCoupons();

        } catch (err) {
            console.error(
                "Save coupon error:",
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
                "Unable to save coupon."
            );

        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // EDIT COUPON
    // ==========================================

    const handleEdit = (coupon) => {
        setError("");
        setSuccess("");

        let expiryValue = "";

        if (coupon.expires_at) {
            const date = new Date(
                coupon.expires_at
            );

            if (!Number.isNaN(date.getTime())) {
                const year =
                    date.getFullYear();

                const month =
                    String(
                        date.getMonth() + 1
                    ).padStart(2, "0");

                const day =
                    String(
                        date.getDate()
                    ).padStart(2, "0");

                const hours =
                    String(
                        date.getHours()
                    ).padStart(2, "0");

                const minutes =
                    String(
                        date.getMinutes()
                    ).padStart(2, "0");

                expiryValue =
                    `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        }

        setForm({
            code: coupon.code || "",

            discount_type:
                String(
                    coupon.discount_type ||
                    "PERCENTAGE"
                ).toUpperCase(),

            discount_value:
                coupon.discount_value ?? "",

            min_order_amount:
                coupon.min_order_amount ?? "0",

            max_discount:
                coupon.max_discount ?? "",

            usage_limit:
                coupon.usage_limit ?? "",

            expires_at:
                expiryValue,

            status:
                coupon.status || "active"
        });

        setEditingId(coupon.id);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // ==========================================
    // DELETE COUPON
    // ==========================================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this coupon?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            const token =
                localStorage.getItem("token");

            const response =
                await axios.delete(
                    `${API_URL}/admin/coupons/${id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            setSuccess(
                response.data.message ||
                "Coupon deleted successfully."
            );

            await loadCoupons();

        } catch (err) {
            console.error(
                "Delete coupon error:",
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
                "Unable to delete coupon."
            );
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "No expiry";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "No expiry";
        }

        return date.toLocaleString();
    };

    // ==========================================
    // FORMAT DISCOUNT
    // ==========================================

    const formatDiscount = (coupon) => {
        const type =
            String(
                coupon.discount_type || ""
            ).toUpperCase();

        if (type === "PERCENTAGE") {
            return `${coupon.discount_value}%`;
        }

        return `₹${Number(
            coupon.discount_value
        ).toFixed(2)}`;
    };

    // ==========================================
    // CHECK EXPIRED
    // ==========================================

    const isExpired = (coupon) => {
        if (!coupon.expires_at) {
            return false;
        }

        return (
            new Date(
                coupon.expires_at
            ) < new Date()
        );
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                padding: "20px"
            }}
        >
            {/* =====================================
                HEADER
            ===================================== */}

            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto 20px",
                    background: "#ffffff",
                    padding: "20px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap"
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "28px"
                        }}
                    >
                        Coupon Management
                    </h1>

                    <p
                        style={{
                            margin:
                                "6px 0 0",
                            color: "#666"
                        }}
                    >
                        Create and manage
                        discount coupons
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        onClick={() =>
                            navigate(
                                "/admin"
                            )
                        }
                        style={{
                            padding:
                                "10px 16px",
                            border: "none",
                            borderRadius:
                                "8px",
                            cursor:
                                "pointer",
                            background:
                                "#e9edf5"
                        }}
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={
                            loadCoupons
                        }
                        style={{
                            padding:
                                "10px 16px",
                            border: "none",
                            borderRadius:
                                "8px",
                            cursor:
                                "pointer",
                            background:
                                "#e9edf5"
                        }}
                    >
                        Refresh
                    </button>

                    <button
                        onClick={
                            handleLogout
                        }
                        style={{
                            padding:
                                "10px 16px",
                            border: "none",
                            borderRadius:
                                "8px",
                            cursor:
                                "pointer",
                            background:
                                "#dc3545",
                            color: "#fff"
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto"
                }}
            >
                {/* =====================================
                    MESSAGES
                ===================================== */}

                {error && (
                    <div
                        style={{
                            background:
                                "#ffe5e5",
                            color:
                                "#b00020",
                            padding:
                                "12px 15px",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "15px"
                        }}
                    >
                        {error}
                    </div>
                )}

                {success && (
                    <div
                        style={{
                            background:
                                "#e5f8e8",
                            color:
                                "#137333",
                            padding:
                                "12px 15px",
                            borderRadius:
                                "8px",
                            marginBottom:
                                "15px"
                        }}
                    >
                        {success}
                    </div>
                )}

                {/* =====================================
                    COUPON FORM
                ===================================== */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        padding: "25px",
                        borderRadius:
                            "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                        marginBottom:
                            "25px"
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center",
                            marginBottom:
                                "20px",
                            gap: "10px",
                            flexWrap:
                                "wrap"
                        }}
                    >
                        <h2
                            style={{
                                margin: 0
                            }}
                        >
                            {editingId
                                ? "Edit Coupon"
                                : "Create New Coupon"}
                        </h2>

                        {editingId && (
                            <button
                                onClick={
                                    resetForm
                                }
                                style={{
                                    padding:
                                        "9px 14px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "7px",
                                    background:
                                        "#6c757d",
                                    color:
                                        "#fff",
                                    cursor:
                                        "pointer"
                                }}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >
                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "16px"
                            }}
                        >
                            {/* CODE */}

                            <div>
                                <label>
                                    Coupon Code
                                </label>

                                <input
                                    type="text"
                                    name="code"
                                    value={
                                        form.code
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="SAVE20"
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px",
                                        boxSizing:
                                            "border-box",
                                        textTransform:
                                            "uppercase"
                                    }}
                                />
                            </div>

                            {/* DISCOUNT TYPE */}

                            <div>
                                <label>
                                    Discount Type
                                </label>

                                <select
                                    name="discount_type"
                                    value={
                                        form.discount_type
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px"
                                    }}
                                >
                                    <option value="PERCENTAGE">
                                        Percentage
                                    </option>

                                    <option value="FIXED">
                                        Fixed Amount
                                    </option>
                                </select>
                            </div>

                            {/* DISCOUNT VALUE */}

                            <div>
                                <label>
                                    Discount Value
                                </label>

                                <input
                                    type="number"
                                    name="discount_value"
                                    value={
                                        form.discount_value
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    step="0.01"
                                    placeholder={
                                        form.discount_type ===
                                        "PERCENTAGE"
                                            ? "20"
                                            : "200"
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px",
                                        boxSizing:
                                            "border-box"
                                    }}
                                />
                            </div>

                            {/* MINIMUM ORDER */}

                            <div>
                                <label>
                                    Minimum Order
                                </label>

                                <input
                                    type="number"
                                    name="min_order_amount"
                                    value={
                                        form.min_order_amount
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    step="0.01"
                                    placeholder="1000"
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px",
                                        boxSizing:
                                            "border-box"
                                    }}
                                />
                            </div>

                            {/* MAX DISCOUNT */}

                            <div>
                                <label>
                                    Maximum Discount
                                </label>

                                <input
                                    type="number"
                                    name="max_discount"
                                    value={
                                        form.max_discount
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    step="0.01"
                                    placeholder="500"
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px",
                                        boxSizing:
                                            "border-box"
                                    }}
                                />

                                <small
                                    style={{
                                        color:
                                            "#777"
                                    }}
                                >
                                    Mainly useful
                                    for percentage
                                    coupons.
                                </small>
                            </div>

                            {/* USAGE LIMIT */}

                            <div>
                                <label>
                                    Usage Limit
                                </label>

                                <input
                                    type="number"
                                    name="usage_limit"
                                    value={
                                        form.usage_limit
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="1"
                                    placeholder="100"
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px",
                                        boxSizing:
                                            "border-box"
                                    }}
                                />

                                <small
                                    style={{
                                        color:
                                            "#777"
                                    }}
                                >
                                    Leave empty for
                                    unlimited.
                                </small>
                            </div>

                            {/* EXPIRY */}

                            <div>
                                <label>
                                    Expiry Date
                                </label>

                                <input
                                    type="datetime-local"
                                    name="expires_at"
                                    value={
                                        form.expires_at
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px",
                                        boxSizing:
                                            "border-box"
                                    }}
                                />

                                <small
                                    style={{
                                        color:
                                            "#777"
                                    }}
                                >
                                    Leave empty for
                                    no expiry.
                                </small>
                            </div>

                            {/* STATUS */}

                            <div>
                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        form.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "11px",
                                        marginTop:
                                            "6px",
                                        border:
                                            "1px solid #ccc",
                                        borderRadius:
                                            "7px"
                                    }}
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

                        <div
                            style={{
                                marginTop:
                                    "20px",
                                display:
                                    "flex",
                                gap: "10px"
                            }}
                        >
                            <button
                                type="submit"
                                disabled={
                                    saving
                                }
                                style={{
                                    padding:
                                        "12px 22px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "8px",
                                    background:
                                        "#198754",
                                    color:
                                        "#fff",
                                    cursor:
                                        saving
                                            ? "not-allowed"
                                            : "pointer",
                                    fontWeight:
                                        "bold"
                                }}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                    ? "Update Coupon"
                                    : "Create Coupon"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    resetForm
                                }
                                style={{
                                    padding:
                                        "12px 22px",
                                    border:
                                        "none",
                                    borderRadius:
                                        "8px",
                                    background:
                                        "#6c757d",
                                    color:
                                        "#fff",
                                    cursor:
                                        "pointer"
                                }}
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>

                {/* =====================================
                    COUPONS TABLE
                ===================================== */}

                <div
                    style={{
                        background:
                            "#ffffff",
                        padding: "25px",
                        borderRadius:
                            "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)"
                    }}
                >
                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "space-between",
                            alignItems:
                                "center",
                            marginBottom:
                                "20px"
                        }}
                    >
                        <h2
                            style={{
                                margin: 0
                            }}
                        >
                            Existing Coupons
                        </h2>

                        <span
                            style={{
                                background:
                                    "#eef2ff",
                                padding:
                                    "7px 12px",
                                borderRadius:
                                    "20px",
                                fontWeight:
                                    "bold"
                            }}
                        >
                            {coupons.length} Coupons
                        </span>
                    </div>

                    {loading ? (
                        <p>
                            Loading coupons...
                        </p>
                    ) : coupons.length === 0 ? (
                        <div
                            style={{
                                textAlign:
                                    "center",
                                padding:
                                    "40px 20px",
                                color: "#777"
                            }}
                        >
                            <h3>
                                No coupons found
                            </h3>

                            <p>
                                Create your first
                                coupon using the
                                form above.
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                overflowX:
                                    "auto"
                            }}
                        >
                            <table
                                style={{
                                    width:
                                        "100%",
                                    borderCollapse:
                                        "collapse",
                                    minWidth:
                                        "1100px"
                                }}
                            >
                                <thead>
                                    <tr>
                                        {[
                                            "ID",
                                            "Code",
                                            "Discount",
                                            "Min Order",
                                            "Max Discount",
                                            "Usage",
                                            "Expiry",
                                            "Status",
                                            "Actions"
                                        ].map(
                                            (
                                                heading
                                            ) => (
                                                <th
                                                    key={
                                                        heading
                                                    }
                                                    style={{
                                                        padding:
                                                            "12px",
                                                        borderBottom:
                                                            "1px solid #ddd",
                                                        textAlign:
                                                            "left"
                                                    }}
                                                >
                                                    {
                                                        heading
                                                    }
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>

                                <tbody>
                                    {coupons.map(
                                        (
                                            coupon
                                        ) => {
                                            const expired =
                                                isExpired(
                                                    coupon
                                                );

                                            const active =
                                                String(
                                                    coupon.status ||
                                                        ""
                                                ).toLowerCase() ===
                                                "active";

                                            return (
                                                <tr
                                                    key={
                                                        coupon.id
                                                    }
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        {
                                                            coupon.id
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        <strong>
                                                            {
                                                                coupon.code
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        {
                                                            formatDiscount(
                                                                coupon
                                                            )
                                                        }
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        ₹
                                                        {Number(
                                                            coupon.min_order_amount ||
                                                                0
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        {coupon.max_discount ===
                                                            null ||
                                                        coupon.max_discount ===
                                                            undefined
                                                            ? "-"
                                                            : `₹${Number(
                                                                  coupon.max_discount
                                                              ).toFixed(
                                                                  2
                                                              )}`}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        {
                                                            coupon.usage_count ||
                                                            0
                                                        }

                                                        {" / "}

                                                        {coupon.usage_limit
                                                            ? coupon.usage_limit
                                                            : "∞"}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        {expired ? (
                                                            <span
                                                                style={{
                                                                    color:
                                                                        "#dc3545",
                                                                    fontWeight:
                                                                        "bold"
                                                                }}
                                                            >
                                                                Expired
                                                            </span>
                                                        ) : (
                                                            formatDate(
                                                                coupon.expires_at
                                                            )
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                padding:
                                                                    "5px 9px",
                                                                borderRadius:
                                                                    "15px",
                                                                background:
                                                                    active
                                                                        ? "#d1e7dd"
                                                                        : "#e2e3e5",
                                                                color:
                                                                    active
                                                                        ? "#0f5132"
                                                                        : "#41464b",
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight:
                                                                    "bold"
                                                            }}
                                                        >
                                                            {String(
                                                                coupon.status ||
                                                                ""
                                                            ).toUpperCase()}
                                                        </span>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            borderBottom:
                                                                "1px solid #eee"
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display:
                                                                    "flex",
                                                                gap:
                                                                    "7px",
                                                                flexWrap:
                                                                    "wrap"
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        coupon
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "7px 11px",
                                                                    border:
                                                                        "none",
                                                                    borderRadius:
                                                                        "6px",
                                                                    background:
                                                                        "#0d6efd",
                                                                    color:
                                                                        "#fff",
                                                                    cursor:
                                                                        "pointer"
                                                                }}
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        coupon.id
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "7px 11px",
                                                                    border:
                                                                        "none",
                                                                    borderRadius:
                                                                        "6px",
                                                                    background:
                                                                        "#dc3545",
                                                                    color:
                                                                        "#fff",
                                                                    cursor:
                                                                        "pointer"
                                                                }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCoupons;