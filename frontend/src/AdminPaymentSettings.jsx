import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";


// ======================================================
// API CONFIG
// ======================================================

const API_URL = "http://localhost:5000/api";


// ======================================================
// INITIAL FORM DATA
// ======================================================

const initialFormData = {
    cod_enabled: true,

    upi_id_enabled: true,
    upi_id: "",

    qr_enabled: true,
    qr_merchant_name: "",

    bank_transfer_enabled: true,
    account_name: "",
    bank_name: "",
    account_number: "",
    ifsc_code: ""
};


// ======================================================
// COMPONENT
// ======================================================

const AdminPaymentSettings = () => {

    const navigate = useNavigate();


    // ==================================================
    // STATE
    // ==================================================

    const [formData, setFormData] =
        useState(initialFormData);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ==================================================
    // GET TOKEN
    // ==================================================

    const getToken = () => {

        const token =
            localStorage.getItem("token");

        return token;
    };


    // ==================================================
    // AUTH HEADERS
    // ==================================================

    const getHeaders = () => {

        const token = getToken();

        return {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };
    };


    // ==================================================
    // LOAD PAYMENT SETTINGS
    // ==================================================

    const loadPaymentSettings = async () => {

        try {

            setLoading(true);
            setError("");

            const token = getToken();

            if (!token) {

                navigate("/login");
                return;
            }


            const response = await axios.get(
                `${API_URL}/admin/payment-settings`,
                getHeaders()
            );


            if (
                response.data &&
                response.data.success
            ) {

                const settings =
                    response.data.settings || {};


                setFormData({

                    cod_enabled:
                        Boolean(
                            settings.cod_enabled
                        ),

                    upi_id_enabled:
                        Boolean(
                            settings.upi_id_enabled
                        ),

                    upi_id:
                        settings.upi_id || "",

                    qr_enabled:
                        Boolean(
                            settings.qr_enabled
                        ),

                    qr_merchant_name:
                        settings.qr_merchant_name || "",

                    bank_transfer_enabled:
                        Boolean(
                            settings.bank_transfer_enabled
                        ),

                    account_name:
                        settings.account_name || "",

                    bank_name:
                        settings.bank_name || "",

                    account_number:
                        settings.account_number || "",

                    ifsc_code:
                        settings.ifsc_code || ""
                });

            } else {

                setFormData(
                    initialFormData
                );
            }

        } catch (err) {

            console.error(
                "Load payment settings error:",
                err
            );


            if (
                err.response &&
                err.response.status === 401
            ) {

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");

                return;
            }


            if (
                err.response &&
                err.response.status === 403
            ) {

                setError(
                    "You do not have permission to access payment settings."
                );

                return;
            }


            setError(
                err.response?.data?.message ||
                "Unable to load payment settings."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // LOAD ON PAGE OPEN
    // ==================================================

    useEffect(() => {

        loadPaymentSettings();

    }, []);


    // ==================================================
    // HANDLE TOGGLE
    // ==================================================

    const handleToggle = (field) => {

        setFormData((previous) => ({

            ...previous,

            [field]:
                !previous[field]

        }));


        setError("");
        setSuccess("");
    };


    // ==================================================
    // HANDLE INPUT
    // ==================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setFormData((previous) => ({

            ...previous,

            [name]: value

        }));


        setError("");
        setSuccess("");
    };


    // ==================================================
    // VALIDATE UPI
    // ==================================================

    const validateUpi = () => {

        const upi =
            formData.upi_id.trim();


        if (
            !formData.upi_id_enabled &&
            !formData.qr_enabled
        ) {

            return true;
        }


        if (!upi) {

            setError(
                "Please enter the UPI ID because UPI or QR payment is enabled."
            );

            return false;
        }


        if (!upi.includes("@")) {

            setError(
                "Please enter a valid UPI ID, for example pavan@upi."
            );

            return false;
        }


        if (upi.length < 5) {

            setError(
                "Please enter a valid UPI ID."
            );

            return false;
        }


        return true;
    };


    // ==================================================
    // VALIDATE QR
    // ==================================================

    const validateQr = () => {

        if (!formData.qr_enabled) {

            return true;
        }


        if (
            !formData.upi_id ||
            !formData.upi_id.trim()
        ) {

            setError(
                "UPI ID is required when QR payment is enabled."
            );

            return false;
        }


        if (
            !formData.qr_merchant_name.trim()
        ) {

            setError(
                "Please enter the QR merchant name."
            );

            return false;
        }


        return true;
    };


    // ==================================================
    // VALIDATE BANK TRANSFER
    // ==================================================

    const validateBankTransfer = () => {

        if (
            !formData.bank_transfer_enabled
        ) {

            return true;
        }


        if (
            !formData.account_name.trim()
        ) {

            setError(
                "Please enter the bank account name."
            );

            return false;
        }


        if (
            !formData.bank_name.trim()
        ) {

            setError(
                "Please enter the bank name."
            );

            return false;
        }


        if (
            !formData.account_number.trim()
        ) {

            setError(
                "Please enter the bank account number."
            );

            return false;
        }


        if (
            !/^[0-9]{6,30}$/.test(
                formData.account_number.trim()
            )
        ) {

            setError(
                "Please enter a valid bank account number."
            );

            return false;
        }


        if (
            !formData.ifsc_code.trim()
        ) {

            setError(
                "Please enter the IFSC code."
            );

            return false;
        }


        const ifsc =
            formData.ifsc_code
                .trim()
                .toUpperCase();


        const ifscRegex =
            /^[A-Z]{4}0[A-Z0-9]{6}$/;


        if (!ifscRegex.test(ifsc)) {

            setError(
                "Please enter a valid IFSC code, for example SBIN0001234."
            );

            return false;
        }


        return true;
    };


    // ==================================================
    // VALIDATE COMPLETE FORM
    // ==================================================

    const validateForm = () => {

        setError("");
        setSuccess("");


        // At least one payment method

        if (
            !formData.cod_enabled &&
            !formData.upi_id_enabled &&
            !formData.qr_enabled &&
            !formData.bank_transfer_enabled
        ) {

            setError(
                "Please enable at least one payment method."
            );

            return false;
        }


        if (!validateUpi()) {

            return false;
        }


        if (!validateQr()) {

            return false;
        }


        if (!validateBankTransfer()) {

            return false;
        }


        return true;
    };


    // ==================================================
    // SAVE PAYMENT SETTINGS
    // ==================================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        if (!validateForm()) {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }


        try {

            setSaving(true);
            setError("");
            setSuccess("");


            const data = {

                cod_enabled:
                    formData.cod_enabled,

                upi_id_enabled:
                    formData.upi_id_enabled,

                upi_id:
                    formData.upi_id.trim(),

                qr_enabled:
                    formData.qr_enabled,

                qr_merchant_name:
                    formData.qr_merchant_name.trim(),

                bank_transfer_enabled:
                    formData.bank_transfer_enabled,

                account_name:
                    formData.account_name.trim(),

                bank_name:
                    formData.bank_name.trim(),

                account_number:
                    formData.account_number.trim(),

                ifsc_code:
                    formData.ifsc_code
                        .trim()
                        .toUpperCase()
            };


            const response = await axios.put(
                `${API_URL}/admin/payment-settings`,
                data,
                getHeaders()
            );


            if (
                response.data &&
                response.data.success
            ) {

                const settings =
                    response.data.settings || {};


                setFormData({

                    cod_enabled:
                        Boolean(
                            settings.cod_enabled
                        ),

                    upi_id_enabled:
                        Boolean(
                            settings.upi_id_enabled
                        ),

                    upi_id:
                        settings.upi_id || "",

                    qr_enabled:
                        Boolean(
                            settings.qr_enabled
                        ),

                    qr_merchant_name:
                        settings.qr_merchant_name || "",

                    bank_transfer_enabled:
                        Boolean(
                            settings.bank_transfer_enabled
                        ),

                    account_name:
                        settings.account_name || "",

                    bank_name:
                        settings.bank_name || "",

                    account_number:
                        settings.account_number || "",

                    ifsc_code:
                        settings.ifsc_code || ""
                });


                setSuccess(
                    "Payment settings saved successfully."
                );


                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            } else {

                setError(
                    response.data?.message ||
                    "Unable to save payment settings."
                );
            }

        } catch (err) {

            console.error(
                "Save payment settings error:",
                err
            );


            if (
                err.response &&
                err.response.status === 401
            ) {

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");

                return;
            }


            if (
                err.response &&
                err.response.status === 403
            ) {

                setError(
                    "You do not have permission to update payment settings."
                );

                return;
            }


            setError(
                err.response?.data?.message ||
                "Unable to save payment settings."
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } finally {

            setSaving(false);
        }
    };


    // ==================================================
    // RESET FORM
    // ==================================================

    const handleReset = () => {

        loadPaymentSettings();

        setError("");
        setSuccess("");
    };


    // ==================================================
    // LOGOUT
    // ==================================================

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };


    // ==================================================
    // LOADING SCREEN
    // ==================================================

    if (loading) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    background: "#f4f7fb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily:
                        "Arial, sans-serif"
                }}
            >

                <div
                    style={{
                        background: "#ffffff",
                        padding: "40px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,0.08)",
                        textAlign: "center"
                    }}
                >

                    <div
                        style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#1f2937",
                            marginBottom: "10px"
                        }}
                    >
                        Loading Payment Settings...
                    </div>

                    <div
                        style={{
                            fontSize: "14px",
                            color: "#6b7280"
                        }}
                    >
                        Please wait.
                    </div>

                </div>

            </div>
        );
    }


    // ==================================================
    // MAIN UI
    // ==================================================

    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f4f7fb",
                fontFamily:
                    "Arial, Helvetica, sans-serif",
                color: "#111827"
            }}
        >

            {/* ==================================================
                HEADER
            ================================================== */}

            <header
                style={{
                    background: "#ffffff",
                    borderBottom:
                        "1px solid #e5e7eb",
                    padding:
                        "16px 30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        "space-between",
                    gap: "20px",
                    position: "sticky",
                    top: 0,
                    zIndex: 100
                }}
            >

                <div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "24px",
                            color: "#111827"
                        }}
                    >
                        Payment Settings
                    </h1>

                    <p
                        style={{
                            margin:
                                "5px 0 0",
                            color: "#6b7280",
                            fontSize: "14px"
                        }}
                    >
                        Configure the payment methods
                        available to customers.
                    </p>

                </div>


                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap"
                    }}
                >

                    <Link
                        to="/admin"
                        style={{
                            textDecoration: "none",
                            background: "#2563eb",
                            color: "#ffffff",
                            padding:
                                "10px 16px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "14px"
                        }}
                    >
                        ← Admin Dashboard
                    </Link>


                    <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                            border: "1px solid #dc2626",
                            background: "#ffffff",
                            color: "#dc2626",
                            padding:
                                "10px 16px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "14px",
                            cursor: "pointer"
                        }}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ==================================================
                CONTENT
            ================================================== */}

            <main
                style={{
                    maxWidth: "1000px",
                    margin: "0 auto",
                    padding:
                        "30px 20px 60px"
                }}
            >

                {/* ==================================================
                    ERROR MESSAGE
                ================================================== */}

                {error && (

                    <div
                        style={{
                            background: "#fef2f2",
                            border:
                                "1px solid #fecaca",
                            color: "#991b1b",
                            padding: "15px 18px",
                            borderRadius: "10px",
                            marginBottom: "20px",
                            fontSize: "14px",
                            fontWeight: "600"
                        }}
                    >
                        ❌ {error}
                    </div>

                )}


                {/* ==================================================
                    SUCCESS MESSAGE
                ================================================== */}

                {success && (

                    <div
                        style={{
                            background: "#ecfdf5",
                            border:
                                "1px solid #a7f3d0",
                            color: "#065f46",
                            padding: "15px 18px",
                            borderRadius: "10px",
                            marginBottom: "20px",
                            fontSize: "14px",
                            fontWeight: "600"
                        }}
                    >
                        ✅ {success}
                    </div>

                )}


                <form
                    onSubmit={handleSubmit}
                >

                    {/* ==================================================
                        PAYMENT METHODS
                    ================================================== */}

                    <section
                        style={{
                            background: "#ffffff",
                            borderRadius: "14px",
                            padding: "25px",
                            marginBottom: "22px",
                            boxShadow:
                                "0 3px 15px rgba(0,0,0,0.06)",
                            border:
                                "1px solid #e5e7eb"
                        }}
                    >

                        <h2
                            style={{
                                margin:
                                    "0 0 6px",
                                fontSize: "20px",
                                color: "#111827"
                            }}
                        >
                            Payment Methods
                        </h2>

                        <p
                            style={{
                                margin:
                                    "0 0 22px",
                                color: "#6b7280",
                                fontSize: "14px"
                            }}
                        >
                            Enable or disable the
                            payment methods customers
                            can use during checkout.
                        </p>


                        {/* COD */}

                        <PaymentMethodToggle
                            title="Cash on Delivery"
                            description="Customers can place orders and pay when the product is delivered."
                            enabled={
                                formData.cod_enabled
                            }
                            onClick={() =>
                                handleToggle(
                                    "cod_enabled"
                                )
                            }
                        />


                        {/* UPI */}

                        <PaymentMethodToggle
                            title="UPI ID Payment"
                            description="Customers can manually pay using the configured UPI ID and upload their payment screenshot."
                            enabled={
                                formData.upi_id_enabled
                            }
                            onClick={() =>
                                handleToggle(
                                    "upi_id_enabled"
                                )
                            }
                        />


                        {/* QR */}

                        <PaymentMethodToggle
                            title="QR Code Payment"
                            description="Customers can scan a dynamically generated QR code containing the configured UPI ID and order amount."
                            enabled={
                                formData.qr_enabled
                            }
                            onClick={() =>
                                handleToggle(
                                    "qr_enabled"
                                )
                            }
                        />


                        {/* BANK */}

                        <PaymentMethodToggle
                            title="Bank Transfer"
                            description="Customers can transfer money directly to the configured bank account and upload their payment screenshot."
                            enabled={
                                formData.bank_transfer_enabled
                            }
                            onClick={() =>
                                handleToggle(
                                    "bank_transfer_enabled"
                                )
                            }
                            last
                        />

                    </section>


                    {/* ==================================================
                        UPI SETTINGS
                    ================================================== */}

                    {(formData.upi_id_enabled ||
                        formData.qr_enabled) && (

                        <section
                            style={{
                                background:
                                    "#ffffff",
                                borderRadius:
                                    "14px",
                                padding: "25px",
                                marginBottom:
                                    "22px",
                                boxShadow:
                                    "0 3px 15px rgba(0,0,0,0.06)",
                                border:
                                    "1px solid #e5e7eb"
                            }}
                        >

                            <h2
                                style={{
                                    margin:
                                        "0 0 6px",
                                    fontSize:
                                        "20px",
                                    color:
                                        "#111827"
                                }}
                            >
                                UPI Settings
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "0 0 22px",
                                    color:
                                        "#6b7280",
                                    fontSize:
                                        "14px"
                                }}
                            >
                                This UPI ID will be used
                                for manual UPI payments
                                and dynamic QR payments.
                            </p>


                            <label
                                style={
                                    labelStyle
                                }
                            >
                                UPI ID
                            </label>


                            <input
                                type="text"
                                name="upi_id"
                                value={
                                    formData.upi_id
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="example@upi"
                                autoComplete="off"
                                style={
                                    inputStyle
                                }
                            />


                            <div
                                style={{
                                    marginTop:
                                        "10px",
                                    background:
                                        "#eff6ff",
                                    border:
                                        "1px solid #bfdbfe",
                                    color:
                                        "#1e40af",
                                    padding:
                                        "12px 14px",
                                    borderRadius:
                                        "8px",
                                    fontSize:
                                        "13px"
                                }}
                            >
                                💡 Example:{" "}
                                <strong>
                                    pavan@upi
                                </strong>
                            </div>

                        </section>
                    )}


                    {/* ==================================================
                        QR SETTINGS
                    ================================================== */}

                    {formData.qr_enabled && (

                        <section
                            style={{
                                background:
                                    "#ffffff",
                                borderRadius:
                                    "14px",
                                padding: "25px",
                                marginBottom:
                                    "22px",
                                boxShadow:
                                    "0 3px 15px rgba(0,0,0,0.06)",
                                border:
                                    "1px solid #e5e7eb"
                            }}
                        >

                            <h2
                                style={{
                                    margin:
                                        "0 0 6px",
                                    fontSize:
                                        "20px",
                                    color:
                                        "#111827"
                                }}
                            >
                                QR Payment Settings
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "0 0 22px",
                                    color:
                                        "#6b7280",
                                    fontSize:
                                        "14px"
                                }}
                            >
                                A QR code will be
                                generated automatically
                                during checkout using the
                                UPI ID and exact order
                                amount.
                            </p>


                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Merchant Name
                            </label>


                            <input
                                type="text"
                                name="qr_merchant_name"
                                value={
                                    formData.qr_merchant_name
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Pavan Stores"
                                autoComplete="organization"
                                style={
                                    inputStyle
                                }
                            />


                            <div
                                style={{
                                    marginTop:
                                        "15px",
                                    background:
                                        "#f0fdf4",
                                    border:
                                        "1px solid #bbf7d0",
                                    color:
                                        "#166534",
                                    padding:
                                        "14px",
                                    borderRadius:
                                        "8px",
                                    fontSize:
                                        "13px",
                                    lineHeight:
                                        "1.6"
                                }}
                            >
                                <strong>
                                    Dynamic QR:
                                </strong>

                                <br />

                                The customer will receive
                                a QR code containing the
                                configured UPI ID, merchant
                                name and exact order amount.
                            </div>

                        </section>
                    )}


                    {/* ==================================================
                        BANK SETTINGS
                    ================================================== */}

                    {formData.bank_transfer_enabled && (

                        <section
                            style={{
                                background:
                                    "#ffffff",
                                borderRadius:
                                    "14px",
                                padding: "25px",
                                marginBottom:
                                    "22px",
                                boxShadow:
                                    "0 3px 15px rgba(0,0,0,0.06)",
                                border:
                                    "1px solid #e5e7eb"
                            }}
                        >

                            <h2
                                style={{
                                    margin:
                                        "0 0 6px",
                                    fontSize:
                                        "20px",
                                    color:
                                        "#111827"
                                }}
                            >
                                Bank Transfer Details
                            </h2>

                            <p
                                style={{
                                    margin:
                                        "0 0 22px",
                                    color:
                                        "#6b7280",
                                    fontSize:
                                        "14px"
                                }}
                            >
                                These details will be
                                displayed to customers who
                                choose Bank Transfer.
                            </p>


                            {/* ACCOUNT NAME */}

                            <div
                                style={{
                                    marginBottom:
                                        "18px"
                                }}
                            >

                                <label
                                    style={
                                        labelStyle
                                    }
                                >
                                    Account Name
                                </label>

                                <input
                                    type="text"
                                    name="account_name"
                                    value={
                                        formData.account_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Pavan"
                                    autoComplete="name"
                                    style={
                                        inputStyle
                                    }
                                />

                            </div>


                            {/* BANK NAME */}

                            <div
                                style={{
                                    marginBottom:
                                        "18px"
                                }}
                            >

                                <label
                                    style={
                                        labelStyle
                                    }
                                >
                                    Bank Name
                                </label>

                                <input
                                    type="text"
                                    name="bank_name"
                                    value={
                                        formData.bank_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="State Bank of India"
                                    autoComplete="organization"
                                    style={
                                        inputStyle
                                    }
                                />

                            </div>


                            {/* ACCOUNT NUMBER */}

                            <div
                                style={{
                                    marginBottom:
                                        "18px"
                                }}
                            >

                                <label
                                    style={
                                        labelStyle
                                    }
                                >
                                    Account Number
                                </label>

                                <input
                                    type="text"
                                    name="account_number"
                                    value={
                                        formData.account_number
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="1234567890"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    style={
                                        inputStyle
                                    }
                                />

                            </div>


                            {/* IFSC */}

                            <div>

                                <label
                                    style={
                                        labelStyle
                                    }
                                >
                                    IFSC Code
                                </label>

                                <input
                                    type="text"
                                    name="ifsc_code"
                                    value={
                                        formData.ifsc_code
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="SBIN0001234"
                                    maxLength={11}
                                    autoComplete="off"
                                    style={{
                                        ...inputStyle,
                                        textTransform:
                                            "uppercase"
                                    }}
                                />

                            </div>

                        </section>
                    )}


                    {/* ==================================================
                        PAYMENT FLOW INFORMATION
                    ================================================== */}

                    <section
                        style={{
                            background:
                                "#ffffff",
                            borderRadius:
                                "14px",
                            padding: "25px",
                            marginBottom:
                                "22px",
                            boxShadow:
                                "0 3px 15px rgba(0,0,0,0.06)",
                            border:
                                "1px solid #e5e7eb"
                        }}
                    >

                        <h2
                            style={{
                                margin:
                                    "0 0 15px",
                                fontSize:
                                    "20px",
                                color:
                                    "#111827"
                            }}
                        >
                            Payment Verification Flow
                        </h2>


                        <div
                            style={{
                                display:
                                    "grid",
                                gap: "12px"
                            }}
                        >

                            <FlowItem
                                number="1"
                                text="Customer selects UPI, QR or Bank Transfer."
                            />

                            <FlowItem
                                number="2"
                                text="Customer makes the payment manually."
                            />

                            <FlowItem
                                number="3"
                                text="Customer uploads the payment screenshot."
                            />

                            <FlowItem
                                number="4"
                                text="OCR attempts to extract the transaction ID / UTR."
                            />

                            <FlowItem
                                number="5"
                                text="Payment remains PENDING until admin verification."
                            />

                            <FlowItem
                                number="6"
                                text="Admin verifies the screenshot and approves or rejects the payment."
                            />

                            <FlowItem
                                number="7"
                                text="COD payments remain PENDING until the order is marked DELIVERED."
                            />

                        </div>

                    </section>


                    {/* ==================================================
                        BUTTONS
                    ================================================== */}

                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "flex-end",
                            gap: "12px",
                            flexWrap:
                                "wrap"
                        }}
                    >

                        <button
                            type="button"
                            onClick={
                                handleReset
                            }
                            disabled={saving}
                            style={{
                                background:
                                    "#ffffff",
                                color:
                                    "#374151",
                                border:
                                    "1px solid #d1d5db",
                                padding:
                                    "13px 22px",
                                borderRadius:
                                    "9px",
                                fontWeight:
                                    "600",
                                cursor:
                                    saving
                                        ? "not-allowed"
                                        : "pointer",
                                opacity:
                                    saving
                                        ? 0.6
                                        : 1
                            }}
                        >
                            Reset
                        </button>


                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                background:
                                    saving
                                        ? "#93c5fd"
                                        : "#2563eb",
                                color:
                                    "#ffffff",
                                border:
                                    "none",
                                padding:
                                    "13px 26px",
                                borderRadius:
                                    "9px",
                                fontWeight:
                                    "700",
                                cursor:
                                    saving
                                        ? "not-allowed"
                                        : "pointer",
                                minWidth:
                                    "180px",
                                fontSize:
                                    "15px"
                            }}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Payment Settings"}
                        </button>

                    </div>

                </form>

            </main>

        </div>
    );
};


// ======================================================
// PAYMENT METHOD TOGGLE COMPONENT
// ======================================================

const PaymentMethodToggle = ({
    title,
    description,
    enabled,
    onClick,
    last = false
}) => {

    return (

        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                    "space-between",
                gap: "20px",
                padding:
                    "18px 0",
                borderBottom:
                    last
                        ? "none"
                        : "1px solid #e5e7eb"
            }}
        >

            <div
                style={{
                    flex: 1
                }}
            >

                <div
                    style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#111827",
                        marginBottom:
                            "5px"
                    }}
                >
                    {title}
                </div>

                <div
                    style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        lineHeight:
                            "1.5"
                    }}
                >
                    {description}
                </div>

            </div>


            <button
                type="button"
                onClick={onClick}
                aria-label={
                    `Toggle ${title}`
                }
                style={{
                    width: "58px",
                    height: "32px",
                    borderRadius:
                        "20px",
                    border: "none",
                    background:
                        enabled
                            ? "#2563eb"
                            : "#9ca3af",
                    position:
                        "relative",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition:
                        "background 0.2s"
                }}
            >

                <span
                    style={{
                        position:
                            "absolute",
                        top: "4px",
                        left:
                            enabled
                                ? "30px"
                                : "4px",
                        width: "24px",
                        height: "24px",
                        borderRadius:
                            "50%",
                        background:
                            "#ffffff",
                        boxShadow:
                            "0 1px 4px rgba(0,0,0,0.25)",
                        transition:
                            "left 0.2s"
                    }}
                />

            </button>

        </div>
    );
};


// ======================================================
// FLOW ITEM COMPONENT
// ======================================================

const FlowItem = ({
    number,
    text
}) => {

    return (

        <div
            style={{
                display: "flex",
                alignItems:
                    "flex-start",
                gap: "12px",
                background:
                    "#f9fafb",
                border:
                    "1px solid #e5e7eb",
                padding:
                    "12px 14px",
                borderRadius:
                    "8px"
            }}
        >

            <div
                style={{
                    width: "28px",
                    height: "28px",
                    borderRadius:
                        "50%",
                    background:
                        "#2563eb",
                    color:
                        "#ffffff",
                    display: "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "center",
                    fontWeight:
                        "700",
                    fontSize:
                        "13px",
                    flexShrink: 0
                }}
            >
                {number}
            </div>

            <div
                style={{
                    fontSize: "14px",
                    color:
                        "#374151",
                    lineHeight:
                        "1.6",
                    paddingTop:
                        "3px"
                }}
            >
                {text}
            </div>

        </div>
    );
};


// ======================================================
// COMMON STYLES
// ======================================================

const labelStyle = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151"
};


const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border:
        "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "14px",
    outline: "none"
};


// ======================================================
// EXPORT
// ======================================================

export default AdminPaymentSettings;