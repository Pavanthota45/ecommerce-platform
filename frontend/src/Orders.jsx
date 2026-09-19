import React, {
    useEffect,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import axios from "axios";


// ==========================================
// API URL
// ==========================================

const API_URL =
    "http://localhost:5000";


// ==========================================
// ORDERS COMPONENT
// ==========================================

function Orders() {

    const navigate = useNavigate();

    // ==========================================
    // STATE
    // ==========================================

    const [orders, setOrders] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(null);

    const [message, setMessage] =
        useState("");


    // ==========================================
    // AUTH CONFIG
    // ==========================================

    const getAuthConfig = () => {

        const token =
            localStorage.getItem("token");

        return {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        };
    };


    // ==========================================
    // CHECK CUSTOMER LOGIN
    // ==========================================

    const checkAuthentication = () => {

        const token =
            localStorage.getItem("token");

        const storedUser =
            localStorage.getItem("user");

        let user = null;

        try {

            user =
                JSON.parse(
                    storedUser || "null"
                );

        } catch (parseError) {

            console.error(
                "User data parsing error:",
                parseError
            );

            user = null;
        }

        if (
            !token ||
            !user ||
            user.role !== "customer"
        ) {

            navigate("/login");

            return false;
        }

        return true;
    };


    // ==========================================
    // LOAD ORDERS
    // ==========================================

    const loadOrders = async (
        showRefreshLoader = false
    ) => {

        try {

            if (
                !checkAuthentication()
            ) {
                return;
            }

            if (showRefreshLoader) {

                setRefreshing(true);

            } else {

                setLoading(true);

            }

            setError("");
            setMessage("");

            const response =
                await axios.get(
                    `${API_URL}/api/orders`,
                    getAuthConfig()
                );

            if (
                response.data.success
            ) {

                setOrders(
                    response.data.orders || []
                );

            } else {

                setError(
                    response.data.message ||
                    "Unable to load orders."
                );
            }

        } catch (error) {

            console.error(
                "Orders loading error:",
                error
            );

            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                navigate("/login");

                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to load orders."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        loadOrders();

    }, []);


    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (
        date
    ) => {

        if (!date) {
            return "N/A";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "N/A";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // ==========================================
    // FORMAT DATE + TIME
    // ==========================================

    const formatDateTime = (
        date
    ) => {

        if (!date) {
            return "N/A";
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "N/A";
        }

        return parsedDate.toLocaleString(
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


    // ==========================================
    // FORMAT STATUS
    // ==========================================

    const formatStatus = (
        status
    ) => {

        if (!status) {
            return "Unknown";
        }

        return String(status)
            .replaceAll(
                "_",
                " "
            )
            .toLowerCase()
            .replace(
                /\b\w/g,
                (letter) =>
                    letter.toUpperCase()
            );
    };


    // ==========================================
    // ORDER STATUS STYLE
    // ==========================================

    const getStatusStyle = (
        status
    ) => {

        switch (
            String(
                status || ""
            ).toUpperCase()
        ) {

            case "PLACED":
                return styles.statusPlaced;

            case "PENDING":
                return styles.statusPlaced;

            case "CONFIRMED":
                return styles.statusConfirmed;

            case "PACKED":
                return styles.statusPacked;

            case "PROCESSING":
                return styles.statusProcessing;

            case "SHIPPED":
                return styles.statusShipped;

            case "OUT_FOR_DELIVERY":
                return styles.statusDelivery;

            case "DELIVERED":
                return styles.statusDelivered;

            case "CANCELLED":
                return styles.statusCancelled;

            case "RETURN_REQUESTED":
                return styles.statusReturn;

            case "RETURNED":
                return styles.statusReturned;

            case "REFUNDED":
                return styles.statusRefunded;

            default:
                return styles.statusDefault;
        }
    };


    // ==========================================
    // PAYMENT STATUS STYLE
    // ==========================================

    const getPaymentStatusStyle = (
        status
    ) => {

        switch (
            String(
                status || ""
            ).toUpperCase()
        ) {

            case "SUCCESS":
                return styles.paymentSuccess;

            case "PENDING":
                return styles.paymentPending;

            case "FAILED":
                return styles.paymentFailed;

            case "REFUNDED":
                return styles.paymentRefunded;

            default:
                return styles.paymentDefault;
        }
    };


    // ==========================================
    // VERIFICATION STATUS STYLE
    // ==========================================

    const getVerificationStatusStyle = (
        status
    ) => {

        switch (
            String(
                status || ""
            ).toUpperCase()
        ) {

            case "SUCCESS":
                return styles.verificationApproved;

            case "APPROVED":
                return styles.verificationApproved;

            case "VERIFIED":
                return styles.verificationApproved;

            case "PENDING":
                return styles.verificationPending;

            case "FAILED":
                return styles.verificationRejected;

            case "REJECTED":
                return styles.verificationRejected;

            default:
                return styles.verificationDefault;
        }
    };


    // ==========================================
    // GET PAYMENT VERIFICATION STATUS
    // ==========================================

    const getVerificationStatus = (
        order
    ) => {

        return (
            order.payment_verification_status ||
            order.verification_status ||
            order.paymentVerificationStatus ||
            "PENDING"
        );
    };


    // ==========================================
    // GET TRANSACTION ID
    // ==========================================

    const getTransactionId = (
        order
    ) => {

        return (
            order.transaction_id ||
            order.transactionId ||
            order.utr ||
            order.utr_id ||
            ""
        );
    };


    // ==========================================
    // GET PAYMENT METHOD
    // ==========================================

    const getPaymentMethod = (
        order
    ) => {

        const method =
            order.payment_method ||
            order.paymentMethod ||
            "COD";

        return String(method)
            .replaceAll(
                "_",
                " "
            )
            .toUpperCase();
    };


    // ==========================================
    // IS MANUAL PAYMENT
    // ==========================================

    const isManualPayment = (
        order
    ) => {

        const method =
            getPaymentMethod(order);

        return [
            "UPI",
            "QR",
            "BANK TRANSFER",
            "BANK_TRANSFER"
        ].includes(
            method
        );
    };


    // ==========================================
    // PAYMENT EXPLANATION
    // ==========================================

    const getPaymentExplanation = (
        order
    ) => {

        const paymentStatus =
            String(
                order.payment_status ||
                "PENDING"
            ).toUpperCase();

        const verificationStatus =
            String(
                getVerificationStatus(order)
            ).toUpperCase();

        if (
            isManualPayment(order)
        ) {

            if (
                verificationStatus ===
                    "APPROVED" ||
                verificationStatus ===
                    "VERIFIED" ||
                paymentStatus ===
                    "SUCCESS"
            ) {

                return "Payment verified successfully.";

            }

            if (
                verificationStatus ===
                    "REJECTED" ||
                paymentStatus ===
                    "FAILED"
            ) {

                return "Payment was rejected by the administrator.";

            }

            return "Payment screenshot is waiting for administrator verification.";
        }

        if (
            paymentStatus ===
            "SUCCESS"
        ) {

            return "Payment completed successfully.";
        }

        return "Cash on Delivery selected.";
    };


    // ==========================================
    // CANCEL ORDER
    // ==========================================

    const handleCancelOrder = async (
        orderId
    ) => {

        const confirmed =
            window.confirm(
                `Are you sure you want to cancel order #${orderId}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            setActionLoading(
                orderId
            );

            setError("");
            setMessage("");

            const response =
                await axios.put(
                    `${API_URL}/api/orders/${orderId}/cancel`,
                    {},
                    getAuthConfig()
                );

            if (
                response.data.success
            ) {

                setMessage(
                    response.data.message ||
                    "Order cancelled successfully."
                );

                await loadOrders();

            } else {

                setError(
                    response.data.message ||
                    "Unable to cancel order."
                );
            }

        } catch (error) {

            console.error(
                "Cancel order error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to cancel order."
            );

        } finally {

            setActionLoading(
                null
            );
        }
    };


    // ==========================================
    // REQUEST RETURN
    // ==========================================

    const handleReturnRequest =
        async (
            orderId
        ) => {

            const confirmed =
                window.confirm(
                    `Are you sure you want to request a return for order #${orderId}?`
                );

            if (!confirmed) {
                return;
            }

            try {

                setActionLoading(
                    orderId
                );

                setError("");
                setMessage("");

                const response =
                    await axios.put(
                        `${API_URL}/api/orders/${orderId}/return`,
                        {},
                        getAuthConfig()
                    );

                if (
                    response.data.success
                ) {

                    setMessage(
                        response.data.message ||
                        "Return request submitted successfully."
                    );

                    await loadOrders();

                } else {

                    setError(
                        response.data.message ||
                        "Unable to request return."
                    );
                }

            } catch (error) {

                console.error(
                    "Return request error:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to request return."
                );

            } finally {

                setActionLoading(
                    null
                );
            }
        };


    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        navigate("/login");
    };


    // ==========================================
    // LOADING SCREEN
    // ==========================================

    if (loading) {

        return (

            <div
                style={
                    styles.loadingPage
                }
            >

                <div
                    style={
                        styles.loadingCard
                    }
                >

                    <div
                        style={
                            styles.loadingIcon
                        }
                    >
                        📦
                    </div>

                    <h2>
                        Loading your orders...
                    </h2>

                    <p>
                        Please wait while we fetch
                        your order history.
                    </p>

                </div>

            </div>
        );
    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <div
            style={
                styles.page
            }
        >

            {/* ==================================
                HEADER
            ================================== */}

            <header
                style={
                    styles.header
                }
            >

                <div>

                    <Link
                        to="/"
                        style={
                            styles.logo
                        }
                    >
                        E-Commerce Store
                    </Link>

                    <div
                        style={
                            styles.subtitle
                        }
                    >
                        My Orders
                    </div>

                </div>


                <div
                    style={
                        styles.headerActions
                    }
                >

                    <Link
                        to="/"
                        style={
                            styles.headerButton
                        }
                    >
                        Home
                    </Link>

                    <Link
                        to="/wishlist"
                        style={
                            styles.headerButton
                        }
                    >
                        Wishlist
                    </Link>

                    <Link
                        to="/cart"
                        style={
                            styles.headerButton
                        }
                    >
                        Cart
                    </Link>

                    <Link
                        to="/profile"
                        style={
                            styles.headerButton
                        }
                    >
                        Profile
                    </Link>

                    <button
                        onClick={
                            handleLogout
                        }
                        style={
                            styles.logoutButton
                        }
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ==================================
                MAIN
            ================================== */}

            <main
                style={
                    styles.container
                }
            >

                {/* ==================================
                    TITLE
                ================================== */}

                <div
                    style={
                        styles.titleRow
                    }
                >

                    <div>

                        <h1
                            style={
                                styles.title
                            }
                        >
                            My Orders
                        </h1>

                        <p
                            style={
                                styles.description
                            }
                        >
                            Track your orders, payment
                            verification and delivery status.
                        </p>

                    </div>


                    <button
                        onClick={() =>
                            loadOrders(true)
                        }
                        disabled={
                            refreshing
                        }
                        style={
                            styles.refreshButton
                        }
                    >

                        {refreshing
                            ? "Refreshing..."
                            : "↻ Refresh"}

                    </button>

                </div>


                {/* ==================================
                    SUCCESS MESSAGE
                ================================== */}

                {message && (

                    <div
                        style={
                            styles.successBox
                        }
                    >
                        ✓ {message}
                    </div>

                )}


                {/* ==================================
                    ERROR MESSAGE
                ================================== */}

                {error && (

                    <div
                        style={
                            styles.errorBox
                        }
                    >
                        {error}
                    </div>

                )}


                {/* ==================================
                    ORDER SUMMARY
                ================================== */}

                {orders.length > 0 && (

                    <div
                        style={
                            styles.summaryCards
                        }
                    >

                        <div
                            style={
                                styles.summaryCard
                            }
                        >

                            <span
                                style={
                                    styles.summaryLabel
                                }
                            >
                                Total Orders
                            </span>

                            <strong
                                style={
                                    styles.summaryValue
                                }
                            >
                                {orders.length}
                            </strong>

                        </div>


                        <div
                            style={
                                styles.summaryCard
                            }
                        >

                            <span
                                style={
                                    styles.summaryLabel
                                }
                            >
                                Active Orders
                            </span>

                            <strong
                                style={
                                    styles.summaryValue
                                }
                            >
                                {
                                    orders.filter(
                                        order =>
                                            ![
                                                "DELIVERED",
                                                "CANCELLED",
                                                "RETURNED",
                                                "REFUNDED"
                                            ].includes(
                                                String(
                                                    order.status ||
                                                    ""
                                                ).toUpperCase()
                                            )
                                    ).length
                                }
                            </strong>

                        </div>


                        <div
                            style={
                                styles.summaryCard
                            }
                        >

                            <span
                                style={
                                    styles.summaryLabel
                                }
                            >
                                Delivered
                            </span>

                            <strong
                                style={
                                    styles.summaryValue
                                }
                            >
                                {
                                    orders.filter(
                                        order =>
                                            String(
                                                order.status ||
                                                ""
                                            ).toUpperCase() ===
                                            "DELIVERED"
                                    ).length
                                }
                            </strong>

                        </div>


                        <div
                            style={
                                styles.summaryCard
                            }
                        >

                            <span
                                style={
                                    styles.summaryLabel
                                }
                            >
                                Cancelled
                            </span>

                            <strong
                                style={
                                    styles.summaryValue
                                }
                            >
                                {
                                    orders.filter(
                                        order =>
                                            String(
                                                order.status ||
                                                ""
                                            ).toUpperCase() ===
                                            "CANCELLED"
                                    ).length
                                }
                            </strong>

                        </div>

                    </div>

                )}


                {/* ==================================
                    EMPTY ORDERS
                ================================== */}

                {!error &&
                    orders.length === 0 && (

                    <div
                        style={
                            styles.emptyBox
                        }
                    >

                        <div
                            style={
                                styles.emptyIcon
                            }
                        >
                            📦
                        </div>

                        <h2>
                            No orders yet
                        </h2>

                        <p>
                            You haven't placed any
                            orders yet.
                        </p>

                        <Link
                            to="/"
                            style={
                                styles.shopButton
                            }
                        >
                            Start Shopping
                        </Link>

                    </div>

                )}


                {/* ==================================
                    ORDERS LIST
                ================================== */}

                {orders.length > 0 && (

                    <div
                        style={
                            styles.ordersList
                        }
                    >

                        {orders.map(
                            (order) => {

                                const orderStatus =
                                    String(
                                        order.status ||
                                        ""
                                    ).toUpperCase();

                                const paymentStatus =
                                    String(
                                        order.payment_status ||
                                        "PENDING"
                                    ).toUpperCase();

                                const verificationStatus =
                                    String(
                                        getVerificationStatus(
                                            order
                                        )
                                    ).toUpperCase();

                                const transactionId =
                                    getTransactionId(
                                        order
                                    );

                                const paymentMethod =
                                    getPaymentMethod(
                                        order
                                    );

                                const canCancel =
                                    [
                                        "PLACED",
                                        "PENDING",
                                        "CONFIRMED",
                                        "PACKED"
                                    ].includes(
                                        orderStatus
                                    );

                                const canReturn =
                                    orderStatus ===
                                    "DELIVERED";

                                const itemCount =
                                    order.items?.length ||
                                    order.item_count ||
                                    0;


                                return (

                                    <div
                                        key={
                                            order.id
                                        }
                                        style={
                                            styles.orderCard
                                        }
                                    >

                                        {/* ==============================
                                            ORDER HEADER
                                        ============================== */}

                                        <div
                                            style={
                                                styles.orderHeader
                                            }
                                        >

                                            <div>

                                                <span
                                                    style={
                                                        styles.orderLabel
                                                    }
                                                >
                                                    Order ID
                                                </span>

                                                <h2
                                                    style={
                                                        styles.orderId
                                                    }
                                                >
                                                    #
                                                    {
                                                        order.id
                                                    }
                                                </h2>

                                                <span
                                                    style={
                                                        styles.orderDate
                                                    }
                                                >
                                                    Placed on{" "}
                                                    {
                                                        formatDate(
                                                            order.created_at
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            <div
                                                style={
                                                    styles.statusArea
                                                }
                                            >

                                                <span
                                                    style={
                                                        getStatusStyle(
                                                            orderStatus
                                                        )
                                                    }
                                                >
                                                    {
                                                        formatStatus(
                                                            orderStatus
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        {/* ==============================
                                            ORDER INFORMATION
                                        ============================== */}

                                        <div
                                            style={
                                                styles.orderInfo
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.infoItem
                                                }
                                            >

                                                <span
                                                    style={
                                                        styles.infoLabel
                                                    }
                                                >
                                                    Total Amount
                                                </span>

                                                <strong
                                                    style={
                                                        styles.amount
                                                    }
                                                >
                                                    ₹
                                                    {Number(
                                                        order.total_amount ||
                                                        0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </strong>

                                            </div>


                                            <div
                                                style={
                                                    styles.infoItem
                                                }
                                            >

                                                <span
                                                    style={
                                                        styles.infoLabel
                                                    }
                                                >
                                                    Products
                                                </span>

                                                <strong>
                                                    {
                                                        itemCount
                                                    }{" "}
                                                    {
                                                        itemCount ===
                                                        1
                                                            ? "item"
                                                            : "items"
                                                    }
                                                </strong>

                                            </div>


                                            <div
                                                style={
                                                    styles.infoItem
                                                }
                                            >

                                                <span
                                                    style={
                                                        styles.infoLabel
                                                    }
                                                >
                                                    Payment Method
                                                </span>

                                                <strong>
                                                    {
                                                        paymentMethod
                                                    }
                                                </strong>

                                            </div>


                                            <div
                                                style={
                                                    styles.infoItem
                                                }
                                            >

                                                <span
                                                    style={
                                                        styles.infoLabel
                                                    }
                                                >
                                                    Payment Status
                                                </span>

                                                <span
                                                    style={
                                                        getPaymentStatusStyle(
                                                            paymentStatus
                                                        )
                                                    }
                                                >
                                                    {
                                                        formatStatus(
                                                            paymentStatus
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        {/* ==============================
                                            PAYMENT VERIFICATION
                                        ============================== */}

                                        <div
                                            style={
                                                styles.paymentVerification
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.paymentVerificationHeader
                                                }
                                            >

                                                <div>

                                                    <h3
                                                        style={
                                                            styles.paymentTitle
                                                        }
                                                    >
                                                        💳 Payment Verification
                                                    </h3>

                                                    <p
                                                        style={
                                                            styles.paymentDescription
                                                        }
                                                    >
                                                        {
                                                            getPaymentExplanation(
                                                                order
                                                            )
                                                        }
                                                    </p>

                                                </div>

                                                <span
                                                    style={
                                                        getVerificationStatusStyle(
                                                            verificationStatus
                                                        )
                                                    }
                                                >
                                                    {
                                                        formatStatus(
                                                            verificationStatus
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            {/* TRANSACTION ID */}

                                            {transactionId && (

                                                <div
                                                    style={
                                                        styles.transactionBox
                                                    }
                                                >

                                                    <span
                                                        style={
                                                            styles.transactionLabel
                                                        }
                                                    >
                                                        Transaction / UTR ID
                                                    </span>

                                                    <strong
                                                        style={
                                                            styles.transactionValue
                                                        }
                                                    >
                                                        {
                                                            transactionId
                                                        }
                                                    </strong>

                                                </div>

                                            )}


                                            {/* PENDING MANUAL PAYMENT */}

                                            {isManualPayment(order) &&
                                                verificationStatus ===
                                                    "PENDING" && (

                                                <div
                                                    style={
                                                        styles.pendingPaymentNotice
                                                    }
                                                >

                                                    <strong>
                                                        Payment verification pending
                                                    </strong>

                                                    <span>
                                                        Your screenshot has been
                                                        submitted. The administrator
                                                        will verify the payment before
                                                        confirming the order.
                                                    </span>

                                                </div>

                                            )}


                                            {/* APPROVED */}

                                            {(
                                                verificationStatus ===
                                                    "APPROVED" ||
                                                verificationStatus ===
                                                    "VERIFIED" ||
                                                paymentStatus ===
                                                    "SUCCESS"
                                            ) && (

                                                <div
                                                    style={
                                                        styles.approvedPaymentNotice
                                                    }
                                                >

                                                    ✓ Payment verified successfully

                                                </div>

                                            )}


                                            {/* REJECTED */}

                                            {(
                                                verificationStatus ===
                                                    "REJECTED" ||
                                                paymentStatus ===
                                                    "FAILED"
                                            ) && (

                                                <div
                                                    style={
                                                        styles.rejectedPaymentNotice
                                                    }
                                                >

                                                    <strong>
                                                        Payment verification rejected
                                                    </strong>

                                                    {(
                                                        order.payment_rejection_reason ||
                                                        order.rejection_reason ||
                                                        order.paymentRejectionReason
                                                    ) && (

                                                        <span>
                                                            Reason:{" "}
                                                            {
                                                                order.payment_rejection_reason ||
                                                                order.rejection_reason ||
                                                                order.paymentRejectionReason
                                                            }
                                                        </span>

                                                    )}

                                                </div>

                                            )}

                                        </div>


                                        {/* ==============================
                                            DELIVERY ADDRESS
                                        ============================== */}

                                        {(order.full_name ||
                                            order.city ||
                                            order.address_line1) && (

                                            <div
                                                style={
                                                    styles.address
                                                }
                                            >

                                                <div
                                                    style={
                                                        styles.addressTitle
                                                    }
                                                >
                                                    🚚 Delivery Address
                                                </div>

                                                <div
                                                    style={
                                                        styles.addressText
                                                    }
                                                >

                                                    <strong>
                                                        {
                                                            order.full_name ||
                                                            "Customer"
                                                        }
                                                    </strong>

                                                    {order.phone && (
                                                        <span>
                                                            {" · "}
                                                            {
                                                                order.phone
                                                            }
                                                        </span>
                                                    )}

                                                    <br />

                                                    {
                                                        order.address_line1 ||
                                                        ""
                                                    }

                                                    {order.address_line2 && (
                                                        <>
                                                            {" · "}
                                                            {
                                                                order.address_line2
                                                            }
                                                        </>
                                                    )}

                                                    {order.city && (
                                                        <>
                                                            {" · "}
                                                            {
                                                                order.city
                                                            }
                                                        </>
                                                    )}

                                                    {order.state && (
                                                        <>
                                                            {", "}
                                                            {
                                                                order.state
                                                            }
                                                        </>
                                                    )}

                                                    {order.pincode && (
                                                        <>
                                                            {" - "}
                                                            {
                                                                order.pincode
                                                            }
                                                        </>
                                                    )}

                                                </div>

                                            </div>

                                        )}


                                        {/* ==============================
                                            ORDER TIMELINE
                                        ============================== */}

                                        <div
                                            style={
                                                styles.timeline
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.timelineTitle
                                                }
                                            >
                                                📍 Order Progress
                                            </div>

                                            <div
                                                style={
                                                    styles.timelineItems
                                                }
                                            >

                                                <div
                                                    style={
                                                        orderStatus !==
                                                        "CANCELLED"
                                                            ? styles.timelineItemActive
                                                            : styles.timelineItemInactive
                                                    }
                                                >
                                                    <span>
                                                        ✓
                                                    </span>

                                                    <small>
                                                        Order Placed
                                                    </small>
                                                </div>


                                                <div
                                                    style={
                                                        [
                                                            "CONFIRMED",
                                                            "PACKED",
                                                            "PROCESSING",
                                                            "SHIPPED",
                                                            "OUT_FOR_DELIVERY",
                                                            "DELIVERED"
                                                        ].includes(
                                                            orderStatus
                                                        )
                                                            ? styles.timelineItemActive
                                                            : styles.timelineItemInactive
                                                    }
                                                >
                                                    <span>
                                                        ✓
                                                    </span>

                                                    <small>
                                                        Confirmed
                                                    </small>
                                                </div>


                                                <div
                                                    style={
                                                        [
                                                            "PACKED",
                                                            "PROCESSING",
                                                            "SHIPPED",
                                                            "OUT_FOR_DELIVERY",
                                                            "DELIVERED"
                                                        ].includes(
                                                            orderStatus
                                                        )
                                                            ? styles.timelineItemActive
                                                            : styles.timelineItemInactive
                                                    }
                                                >
                                                    <span>
                                                        ✓
                                                    </span>

                                                    <small>
                                                        Packed
                                                    </small>
                                                </div>


                                                <div
                                                    style={
                                                        [
                                                            "SHIPPED",
                                                            "OUT_FOR_DELIVERY",
                                                            "DELIVERED"
                                                        ].includes(
                                                            orderStatus
                                                        )
                                                            ? styles.timelineItemActive
                                                            : styles.timelineItemInactive
                                                    }
                                                >
                                                    <span>
                                                        ✓
                                                    </span>

                                                    <small>
                                                        Shipped
                                                    </small>
                                                </div>


                                                <div
                                                    style={
                                                        [
                                                            "OUT_FOR_DELIVERY",
                                                            "DELIVERED"
                                                        ].includes(
                                                            orderStatus
                                                        )
                                                            ? styles.timelineItemActive
                                                            : styles.timelineItemInactive
                                                    }
                                                >
                                                    <span>
                                                        ✓
                                                    </span>

                                                    <small>
                                                        Out for Delivery
                                                    </small>
                                                </div>


                                                <div
                                                    style={
                                                        orderStatus ===
                                                        "DELIVERED"
                                                            ? styles.timelineItemActive
                                                            : styles.timelineItemInactive
                                                    }
                                                >
                                                    <span>
                                                        ✓
                                                    </span>

                                                    <small>
                                                        Delivered
                                                    </small>
                                                </div>

                                            </div>

                                        </div>


                                        {/* ==============================
                                            ORDER DATE INFORMATION
                                        ============================== */}

                                        <div
                                            style={
                                                styles.dateInformation
                                            }
                                        >

                                            <span>
                                                Order created:{" "}
                                                {
                                                    formatDateTime(
                                                        order.created_at
                                                    )
                                                }
                                            </span>

                                            {order.updated_at && (
                                                <span>
                                                    Last updated:{" "}
                                                    {
                                                        formatDateTime(
                                                            order.updated_at
                                                        )
                                                    }
                                                </span>
                                            )}

                                        </div>


                                        {/* ==============================
                                            ACTIONS
                                        ============================== */}

                                        <div
                                            style={
                                                styles.orderFooter
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.leftActions
                                                }
                                            >

                                                <Link
                                                    to={`/orders/${order.id}`}
                                                    style={
                                                        styles.viewButton
                                                    }
                                                >
                                                    View Details
                                                </Link>

                                            </div>


                                            <div
                                                style={
                                                    styles.rightActions
                                                }
                                            >

                                                {canCancel && (

                                                    <button
                                                        onClick={() =>
                                                            handleCancelOrder(
                                                                order.id
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading ===
                                                            order.id
                                                        }
                                                        style={
                                                            styles.cancelButton
                                                        }
                                                    >

                                                        {
                                                            actionLoading ===
                                                            order.id
                                                                ? "Processing..."
                                                                : "Cancel Order"
                                                        }

                                                    </button>

                                                )}


                                                {canReturn && (

                                                    <button
                                                        onClick={() =>
                                                            handleReturnRequest(
                                                                order.id
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading ===
                                                            order.id
                                                        }
                                                        style={
                                                            styles.returnButton
                                                        }
                                                    >

                                                        {
                                                            actionLoading ===
                                                            order.id
                                                                ? "Processing..."
                                                                : "Request Return"
                                                        }

                                                    </button>

                                                )}

                                            </div>

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </div>

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
        background: "#f5f7fb",
        color: "#111827",
        paddingBottom: "50px"
    },


    loadingPage: {
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
    },


    loadingCard: {
        background: "#ffffff",
        padding: "40px",
        borderRadius: "14px",
        textAlign: "center",
        boxShadow:
            "0 4px 20px rgba(0,0,0,0.06)"
    },


    loadingIcon: {
        fontSize: "50px",
        marginBottom: "10px"
    },


    header: {
        background: "#ffffff",
        padding: "18px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom:
            "1px solid #e5e7eb",
        gap: "20px",
        flexWrap: "wrap"
    },


    logo: {
        fontSize: "24px",
        fontWeight: "700",
        textDecoration: "none",
        color: "#111827"
    },


    subtitle: {
        marginTop: "5px",
        color: "#6b7280",
        fontSize: "14px"
    },


    headerActions: {
        display: "flex",
        gap: "9px",
        alignItems: "center",
        flexWrap: "wrap"
    },


    headerButton: {
        textDecoration: "none",
        padding: "9px 14px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        color: "#374151",
        background: "#ffffff",
        fontSize: "14px"
    },


    logoutButton: {
        padding: "9px 14px",
        border: "none",
        borderRadius: "8px",
        background: "#dc2626",
        color: "#ffffff",
        cursor: "pointer",
        fontSize: "14px"
    },


    container: {
        width: "min(1050px, 92%)",
        margin: "0 auto",
        padding: "35px 0"
    },


    titleRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "25px",
        flexWrap: "wrap"
    },


    title: {
        margin: "0 0 7px",
        fontSize: "34px"
    },


    description: {
        margin: 0,
        color: "#6b7280",
        lineHeight: "1.5"
    },


    refreshButton: {
        padding: "11px 18px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        background: "#ffffff",
        cursor: "pointer",
        fontWeight: "600"
    },


    successBox: {
        padding: "14px 17px",
        background: "#dcfce7",
        color: "#166534",
        border:
            "1px solid #86efac",
        borderRadius: "9px",
        marginBottom: "20px"
    },


    errorBox: {
        padding: "14px 17px",
        background: "#fee2e2",
        color: "#991b1b",
        border:
            "1px solid #fca5a5",
        borderRadius: "9px",
        marginBottom: "20px"
    },


    summaryCards: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "15px",
        marginBottom: "25px"
    },


    summaryCard: {
        background: "#ffffff",
        borderRadius: "11px",
        padding: "20px",
        boxShadow:
            "0 3px 15px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },


    summaryLabel: {
        color: "#6b7280",
        fontSize: "13px"
    },


    summaryValue: {
        fontSize: "25px"
    },


    emptyBox: {
        background: "#ffffff",
        borderRadius: "14px",
        padding: "75px 30px",
        textAlign: "center",
        boxShadow:
            "0 4px 20px rgba(0,0,0,0.05)"
    },


    emptyIcon: {
        fontSize: "65px",
        marginBottom: "15px"
    },


    shopButton: {
        display: "inline-block",
        marginTop: "20px",
        padding: "12px 23px",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: "600"
    },


    ordersList: {
        display: "flex",
        flexDirection: "column",
        gap: "20px"
    },


    orderCard: {
        background: "#ffffff",
        borderRadius: "13px",
        padding: "25px",
        boxShadow:
            "0 4px 20px rgba(0,0,0,0.05)"
    },


    orderHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        paddingBottom: "18px",
        borderBottom:
            "1px solid #e5e7eb",
        flexWrap: "wrap"
    },


    orderLabel: {
        display: "block",
        color: "#6b7280",
        fontSize: "12px",
        marginBottom: "3px"
    },


    orderId: {
        margin: 0,
        fontSize: "23px"
    },


    orderDate: {
        display: "block",
        marginTop: "5px",
        color: "#6b7280",
        fontSize: "13px"
    },


    statusArea: {
        display: "flex",
        alignItems: "center"
    },


    statusPlaced: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#dbeafe",
        color: "#1d4ed8",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusConfirmed: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#e0e7ff",
        color: "#4338ca",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusPacked: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#fef3c7",
        color: "#92400e",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusProcessing: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#fef3c7",
        color: "#92400e",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusShipped: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#cffafe",
        color: "#155e75",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusDelivery: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#ede9fe",
        color: "#6d28d9",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusDelivered: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#dcfce7",
        color: "#166534",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusCancelled: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#fee2e2",
        color: "#991b1b",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusReturn: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#fef3c7",
        color: "#92400e",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusReturned: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#f3f4f6",
        color: "#374151",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusRefunded: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#dcfce7",
        color: "#166534",
        fontSize: "13px",
        fontWeight: "600"
    },


    statusDefault: {
        padding: "7px 13px",
        borderRadius: "20px",
        background: "#f3f4f6",
        color: "#374151",
        fontSize: "13px",
        fontWeight: "600"
    },


    orderInfo: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "20px",
        padding: "22px 0"
    },


    infoItem: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },


    infoLabel: {
        color: "#6b7280",
        fontSize: "13px"
    },


    amount: {
        fontSize: "18px"
    },


    paymentSuccess: {
        display: "inline-block",
        width: "fit-content",
        padding: "5px 9px",
        borderRadius: "15px",
        background: "#dcfce7",
        color: "#166534",
        fontSize: "12px",
        fontWeight: "600"
    },


    paymentPending: {
        display: "inline-block",
        width: "fit-content",
        padding: "5px 9px",
        borderRadius: "15px",
        background: "#fef3c7",
        color: "#92400e",
        fontSize: "12px",
        fontWeight: "600"
    },


    paymentFailed: {
        display: "inline-block",
        width: "fit-content",
        padding: "5px 9px",
        borderRadius: "15px",
        background: "#fee2e2",
        color: "#991b1b",
        fontSize: "12px",
        fontWeight: "600"
    },


    paymentRefunded: {
        display: "inline-block",
        width: "fit-content",
        padding: "5px 9px",
        borderRadius: "15px",
        background: "#dcfce7",
        color: "#166534",
        fontSize: "12px",
        fontWeight: "600"
    },


    paymentDefault: {
        display: "inline-block",
        width: "fit-content",
        padding: "5px 9px",
        borderRadius: "15px",
        background: "#f3f4f6",
        color: "#374151",
        fontSize: "12px",
        fontWeight: "600"
    },


    paymentVerification: {
        marginTop: "4px",
        marginBottom: "20px",
        padding: "18px",
        background: "#f8fafc",
        border:
            "1px solid #e2e8f0",
        borderRadius: "10px"
    },


    paymentVerificationHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "15px",
        flexWrap: "wrap"
    },


    paymentTitle: {
        margin: 0,
        fontSize: "17px",
        color: "#1f2937"
    },


    paymentDescription: {
        margin: "6px 0 0",
        color: "#64748b",
        fontSize: "13px",
        lineHeight: "1.5"
    },


    verificationApproved: {
        display: "inline-block",
        padding: "7px 12px",
        borderRadius: "20px",
        background: "#dcfce7",
        color: "#166534",
        fontSize: "12px",
        fontWeight: "700"
    },


    verificationPending: {
        display: "inline-block",
        padding: "7px 12px",
        borderRadius: "20px",
        background: "#fef3c7",
        color: "#92400e",
        fontSize: "12px",
        fontWeight: "700"
    },


    verificationRejected: {
        display: "inline-block",
        padding: "7px 12px",
        borderRadius: "20px",
        background: "#fee2e2",
        color: "#991b1b",
        fontSize: "12px",
        fontWeight: "700"
    },


    verificationDefault: {
        display: "inline-block",
        padding: "7px 12px",
        borderRadius: "20px",
        background: "#e5e7eb",
        color: "#374151",
        fontSize: "12px",
        fontWeight: "700"
    },


    transactionBox: {
        marginTop: "15px",
        padding: "13px",
        background: "#ffffff",
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },


    transactionLabel: {
        color: "#6b7280",
        fontSize: "12px",
        textTransform: "uppercase"
    },


    transactionValue: {
        color: "#166534",
        fontFamily: "monospace",
        fontSize: "15px",
        wordBreak: "break-all"
    },


    pendingPaymentNotice: {
        marginTop: "15px",
        padding: "12px 14px",
        background: "#fffbeb",
        border:
            "1px solid #fde68a",
        color: "#92400e",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontSize: "13px",
        lineHeight: "1.5"
    },


    approvedPaymentNotice: {
        marginTop: "15px",
        padding: "12px 14px",
        background: "#f0fdf4",
        border:
            "1px solid #bbf7d0",
        color: "#166534",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "600"
    },


    rejectedPaymentNotice: {
        marginTop: "15px",
        padding: "12px 14px",
        background: "#fef2f2",
        border:
            "1px solid #fecaca",
        color: "#991b1b",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        fontSize: "13px",
        lineHeight: "1.5"
    },


    address: {
        padding: "15px",
        background: "#f9fafb",
        borderRadius: "9px",
        marginBottom: "20px"
    },


    addressTitle: {
        fontWeight: "700",
        marginBottom: "6px"
    },


    addressText: {
        color: "#4b5563",
        fontSize: "14px",
        lineHeight: "1.6"
    },


    timeline: {
        padding: "18px 0",
        borderTop:
            "1px solid #e5e7eb",
        borderBottom:
            "1px solid #e5e7eb",
        marginBottom: "15px"
    },


    timelineTitle: {
        fontWeight: "700",
        marginBottom: "15px",
        color: "#374151"
    },


    timelineItems: {
        display: "grid",
        gridTemplateColumns:
            "repeat(6, 1fr)",
        gap: "8px"
    },


    timelineItemActive: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        textAlign: "center",
        color: "#166534",
        fontSize: "12px"
    },


    timelineItemActiveSpan: {
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#dcfce7",
        fontWeight: "700"
    },


    timelineItemInactive: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "12px"
    },


    dateInformation: {
        display: "flex",
        justifyContent: "space-between",
        gap: "10px",
        flexWrap: "wrap",
        color: "#9ca3af",
        fontSize: "12px",
        marginBottom: "5px"
    },


    orderFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        paddingTop: "18px",
        flexWrap: "wrap"
    },


    leftActions: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap"
    },


    rightActions: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap"
    },


    viewButton: {
        display: "inline-block",
        padding: "10px 18px",
        borderRadius: "8px",
        background: "#2563eb",
        color: "#ffffff",
        textDecoration: "none",
        fontWeight: "600"
    },


    cancelButton: {
        padding: "10px 17px",
        border: "none",
        borderRadius: "8px",
        background: "#dc2626",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "600"
    },


    returnButton: {
        padding: "10px 17px",
        border: "none",
        borderRadius: "8px",
        background: "#d97706",
        color: "#ffffff",
        cursor: "pointer",
        fontWeight: "600"
    }

};


// ==========================================
// FIX TIMELINE CIRCLE STYLING
// ==========================================

styles.timelineItemActive = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    textAlign: "center",
    color: "#166534",
    fontSize: "12px"
};


styles.timelineItemInactive = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "12px"
};


export default Orders;