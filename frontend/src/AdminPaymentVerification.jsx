import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const AdminPaymentVerification = () => {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);

    const [loadingPending, setLoadingPending] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const [processingId, setProcessingId] = useState(null);

    const [rejectingPaymentId, setRejectingPaymentId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");

        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    };

    useEffect(() => {
        loadPendingPayments();
        loadPaymentHistory();
    }, []);

    const loadPendingPayments = async () => {
        try {
            setLoadingPending(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/payments/admin/pending`,
                getAuthHeaders()
            );

            if (response.data.success) {
                setPendingPayments(response.data.payments || []);
            } else {
                setError(
                    response.data.message ||
                        "Unable to load pending payments."
                );
            }
        } catch (err) {
            console.error(
                "Load pending payments error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Unable to load pending payments."
            );
        } finally {
            setLoadingPending(false);
        }
    };

    const loadPaymentHistory = async () => {
        try {
            setLoadingHistory(true);

            const response = await axios.get(
                `${API_URL}/payments/admin/all`,
                getAuthHeaders()
            );

            if (response.data.success) {
                setPaymentHistory(response.data.payments || []);
            }
        } catch (err) {
            console.error(
                "Load payment history error:",
                err.response?.data || err
            );
        } finally {
            setLoadingHistory(false);
        }
    };

    const refreshPayments = async () => {
        await Promise.all([
            loadPendingPayments(),
            loadPaymentHistory(),
        ]);
    };

    const approvePayment = async (paymentId) => {
        if (!paymentId) {
            setError("Payment ID is missing.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to approve this payment?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(paymentId);
            setError("");
            setSuccessMessage("");

            console.log("Approving payment ID:", paymentId);

            const response = await axios.put(
                `${API_URL}/payments/admin/${paymentId}/approve`,
                {},
                getAuthHeaders()
            );

            if (response.data.success) {
                setSuccessMessage(
                    response.data.message ||
                        "Payment approved successfully."
                );

                await refreshPayments();
            } else {
                setError(
                    response.data.message ||
                        "Unable to approve payment."
                );
            }
        } catch (err) {
            console.error(
                "Approve payment error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Unable to approve payment."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectBox = (paymentId) => {
        if (!paymentId) {
            setError("Payment ID is missing.");
            return;
        }

        setRejectingPaymentId(paymentId);
        setRejectReason("");
        setError("");
        setSuccessMessage("");
    };

    const cancelReject = () => {
        setRejectingPaymentId(null);
        setRejectReason("");
    };

    const rejectPayment = async () => {
        if (!rejectingPaymentId) {
            setError("Payment ID is missing.");
            return;
        }

        if (!rejectReason.trim()) {
            setError("Please enter a rejection reason.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to reject this payment?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(rejectingPaymentId);
            setError("");
            setSuccessMessage("");

            console.log(
                "Rejecting payment ID:",
                rejectingPaymentId
            );

            const response = await axios.put(
                `${API_URL}/payments/admin/${rejectingPaymentId}/reject`,
                {
                    reason: rejectReason.trim(),
                },
                getAuthHeaders()
            );

            if (response.data.success) {
                setSuccessMessage(
                    response.data.message ||
                        "Payment rejected successfully."
                );

                setRejectingPaymentId(null);
                setRejectReason("");

                await refreshPayments();
            } else {
                setError(
                    response.data.message ||
                        "Unable to reject payment."
                );
            }
        } catch (err) {
            console.error(
                "Reject payment error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.message ||
                    "Unable to reject payment."
            );
        } finally {
            setProcessingId(null);
        }
    };

    const getScreenshotUrl = (screenshot) => {
        if (!screenshot) {
            return "";
        }

        if (
            screenshot.startsWith("http://") ||
            screenshot.startsWith("https://")
        ) {
            return screenshot;
        }

        let cleanedPath = screenshot
            .replace(/\\/g, "/")
            .replace(/^\/+/, "");

        if (cleanedPath.startsWith("uploads/")) {
            return `http://localhost:5000/${cleanedPath}`;
        }

        return `http://localhost:5000/uploads/${cleanedPath}`;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "N/A";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleString();
    };

    const formatAmount = (amount) => {
        const numericAmount = Number(amount);

        if (Number.isNaN(numericAmount)) {
            return amount || "0";
        }

        return numericAmount.toFixed(2);
    };

    const getStatusClass = (status) => {
        const normalizedStatus = String(
            status || ""
        ).toUpperCase();

        if (
            normalizedStatus === "SUCCESS" ||
            normalizedStatus === "PAID" ||
            normalizedStatus === "APPROVED"
        ) {
            return "status-success";
        }

        if (
            normalizedStatus === "PENDING" ||
            normalizedStatus === "PROCESSING"
        ) {
            return "status-pending";
        }

        if (
            normalizedStatus === "FAILED" ||
            normalizedStatus === "REJECTED"
        ) {
            return "status-failed";
        }

        return "status-default";
    };

    return (
        <div className="admin-payment-page">

            <style>{`
                .admin-payment-page {
                    min-height: 100vh;
                    background: #f5f7fb;
                    padding: 30px;
                    box-sizing: border-box;
                    font-family: Arial, Helvetica, sans-serif;
                }

                .payment-container {
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .page-header {
                    background: white;
                    border-radius: 14px;
                    padding: 24px;
                    margin-bottom: 24px;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
                }

                .page-header h1 {
                    margin: 0 0 8px 0;
                    font-size: 30px;
                    color: #1f2937;
                }

                .page-header p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 15px;
                }

                .message {
                    padding: 14px 18px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    font-weight: 600;
                }

                .error-message {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                }

                .success-message {
                    background: #dcfce7;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }

                .section {
                    background: white;
                    border-radius: 14px;
                    padding: 24px;
                    margin-bottom: 28px;
                    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }

                .section-header h2 {
                    margin: 0;
                    color: #1f2937;
                    font-size: 22px;
                }

                .count-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 32px;
                    height: 32px;
                    padding: 0 10px;
                    background: #2563eb;
                    color: white;
                    border-radius: 20px;
                    font-weight: bold;
                }

                .refresh-button {
                    border: none;
                    background: #2563eb;
                    color: white;
                    padding: 10px 18px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .refresh-button:hover {
                    background: #1d4ed8;
                }

                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                }

                .empty-state {
                    text-align: center;
                    padding: 50px 20px;
                    color: #6b7280;
                }

                .empty-state h3 {
                    margin-bottom: 8px;
                    color: #374151;
                }

                .payment-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    padding: 20px;
                    margin-bottom: 18px;
                    background: #ffffff;
                }

                .payment-card:last-child {
                    margin-bottom: 0;
                }

                .payment-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-bottom: 18px;
                    flex-wrap: wrap;
                }

                .payment-title h3 {
                    margin: 0 0 6px 0;
                    color: #111827;
                    font-size: 19px;
                }

                .payment-title p {
                    margin: 4px 0;
                    color: #6b7280;
                    font-size: 14px;
                }

                .amount {
                    font-size: 24px;
                    font-weight: bold;
                    color: #111827;
                }

                .payment-grid {
                    display: grid;
                    grid-template-columns: repeat(
                        auto-fit,
                        minmax(220px, 1fr)
                    );
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .info-box {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 13px;
                }

                .info-label {
                    font-size: 12px;
                    color: #6b7280;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }

                .info-value {
                    color: #111827;
                    font-size: 14px;
                    font-weight: 600;
                    word-break: break-word;
                }

                .transaction-id {
                    font-family: monospace;
                    font-size: 15px;
                    color: #166534;
                }

                .screenshot-section {
                    margin-top: 18px;
                    padding-top: 18px;
                    border-top: 1px solid #e5e7eb;
                }

                .screenshot-section h4 {
                    margin: 0 0 12px 0;
                    color: #374151;
                }

                .screenshot-link {
                    display: inline-block;
                    color: #2563eb;
                    font-weight: 600;
                    text-decoration: none;
                    margin-bottom: 12px;
                }

                .screenshot-link:hover {
                    text-decoration: underline;
                }

                .screenshot-image {
                    display: block;
                    max-width: 420px;
                    max-height: 520px;
                    width: auto;
                    height: auto;
                    border-radius: 10px;
                    border: 1px solid #d1d5db;
                    object-fit: contain;
                    background: #f9fafb;
                }

                .actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 20px;
                }

                .approve-button,
                .reject-button {
                    border: none;
                    border-radius: 8px;
                    padding: 11px 18px;
                    cursor: pointer;
                    font-weight: 700;
                }

                .approve-button {
                    background: #16a34a;
                    color: white;
                }

                .approve-button:hover {
                    background: #15803d;
                }

                .reject-button {
                    background: #dc2626;
                    color: white;
                }

                .reject-button:hover {
                    background: #b91c1c;
                }

                .approve-button:disabled,
                .reject-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .reject-box {
                    margin-top: 18px;
                    padding: 18px;
                    background: #fff7ed;
                    border: 1px solid #fed7aa;
                    border-radius: 10px;
                }

                .reject-box h4 {
                    margin: 0 0 10px 0;
                    color: #9a3412;
                }

                .reject-textarea {
                    width: 100%;
                    min-height: 100px;
                    resize: vertical;
                    padding: 11px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    box-sizing: border-box;
                    font-family: inherit;
                    margin-bottom: 12px;
                }

                .reject-textarea:focus {
                    outline: none;
                    border-color: #f97316;
                }

                .reject-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .confirm-reject-button,
                .cancel-reject-button {
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                }

                .confirm-reject-button {
                    background: #dc2626;
                    color: white;
                }

                .cancel-reject-button {
                    background: #e5e7eb;
                    color: #374151;
                }

                .history-table-wrapper {
                    width: 100%;
                    overflow-x: auto;
                }

                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 900px;
                }

                .history-table th {
                    background: #f9fafb;
                    color: #374151;
                    font-size: 13px;
                    text-align: left;
                    padding: 13px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .history-table td {
                    padding: 13px;
                    border-bottom: 1px solid #e5e7eb;
                    color: #4b5563;
                    font-size: 14px;
                    vertical-align: top;
                }

                .status {
                    display: inline-flex;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 700;
                }

                .status-success {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-pending {
                    background: #fef3c7;
                    color: #92400e;
                }

                .status-failed {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .status-default {
                    background: #e5e7eb;
                    color: #374151;
                }

                .history-transaction {
                    font-family: monospace;
                    color: #166534;
                    word-break: break-all;
                }

                @media (max-width: 768px) {
                    .admin-payment-page {
                        padding: 15px;
                    }

                    .section,
                    .page-header {
                        padding: 18px;
                    }

                    .page-header h1 {
                        font-size: 24px;
                    }

                    .screenshot-image {
                        max-width: 100%;
                    }
                }
            `}</style>

            <div className="payment-container">

                <div className="page-header">
                    <h1>Payment Verification</h1>
                    <p>
                        Review customer payment screenshots,
                        verify OCR-extracted transaction IDs,
                        and approve or reject manual payments.
                    </p>
                </div>

                {error && (
                    <div className="message error-message">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="message success-message">
                        {successMessage}
                    </div>
                )}

                <div className="section">

                    <div className="section-header">
                        <div>
                            <h2>
                                Pending Manual Payments{" "}
                                <span className="count-badge">
                                    {pendingPayments.length}
                                </span>
                            </h2>
                        </div>

                        <button
                            className="refresh-button"
                            onClick={refreshPayments}
                            disabled={
                                loadingPending ||
                                loadingHistory
                            }
                        >
                            Refresh
                        </button>
                    </div>

                    {loadingPending ? (
                        <div className="loading">
                            Loading pending payments...
                        </div>
                    ) : pendingPayments.length === 0 ? (
                        <div className="empty-state">
                            <h3>
                                No pending payments
                            </h3>
                            <p>
                                There are currently no manual
                                payments waiting for verification.
                            </p>
                        </div>
                    ) : (
                        pendingPayments.map((payment) => {

                            const paymentId = payment.id;

                            const screenshotUrl =
                                getScreenshotUrl(
                                    payment.payment_screenshot
                                );

                            return (
                                <div
                                    className="payment-card"
                                    key={paymentId}
                                >

                                    <div className="payment-top">

                                        <div className="payment-title">
                                            <h3>
                                                Payment #{paymentId}
                                            </h3>

                                            <p>
                                                Order ID:{" "}
                                                {payment.order_id}
                                            </p>

                                            <p>
                                                Customer:{" "}
                                                {payment.customer_name ||
                                                    payment.user_name ||
                                                    payment.name ||
                                                    "N/A"}
                                            </p>

                                            <p>
                                                Email:{" "}
                                                {payment.customer_email ||
                                                    payment.user_email ||
                                                    payment.email ||
                                                    "N/A"}
                                            </p>
                                        </div>

                                        <div className="amount">
                                            ₹
                                            {formatAmount(
                                                payment.amount
                                            )}
                                        </div>

                                    </div>

                                    <div className="payment-grid">

                                        <div className="info-box">
                                            <div className="info-label">
                                                Payment Method
                                            </div>

                                            <div className="info-value">
                                                {payment.payment_method ||
                                                    payment.method ||
                                                    "N/A"}
                                            </div>
                                        </div>

                                        <div className="info-box">
                                            <div className="info-label">
                                                Payment Status
                                            </div>

                                            <div className="info-value">
                                                <span
                                                    className={`status ${getStatusClass(
                                                        payment.status
                                                    )}`}
                                                >
                                                    {payment.status ||
                                                        "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="info-box">
                                            <div className="info-label">
                                                Verification Status
                                            </div>

                                            <div className="info-value">
                                                <span
                                                    className={`status ${getStatusClass(
                                                        payment.verification_status
                                                    )}`}
                                                >
                                                    {payment.verification_status ||
                                                        "N/A"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="info-box">
                                            <div className="info-label">
                                                Created At
                                            </div>

                                            <div className="info-value">
                                                {formatDate(
                                                    payment.created_at
                                                )}
                                            </div>
                                        </div>

                                        <div className="info-box">
                                            <div className="info-label">
                                                OCR Transaction ID
                                            </div>

                                            <div className="info-value transaction-id">
                                                {payment.transaction_id ||
                                                    payment.utr ||
                                                    "Not extracted"}
                                            </div>
                                        </div>

                                    </div>

                                    <div className="screenshot-section">

                                        <h4>
                                            Payment Screenshot
                                        </h4>

                                        {screenshotUrl ? (
                                            <>
                                                <a
                                                    className="screenshot-link"
                                                    href={screenshotUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Open Screenshot
                                                </a>

                                                <img
                                                    className="screenshot-image"
                                                    src={screenshotUrl}
                                                    alt="Payment screenshot"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display =
                                                            "none";
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <p>
                                                No payment screenshot
                                                available.
                                            </p>
                                        )}

                                    </div>

                                    {rejectingPaymentId ===
                                        paymentId && (
                                        <div className="reject-box">

                                            <h4>
                                                Reject Payment
                                            </h4>

                                            <textarea
                                                className="reject-textarea"
                                                value={rejectReason}
                                                onChange={(event) =>
                                                    setRejectReason(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Enter the reason for rejecting this payment..."
                                            />

                                            <div className="reject-actions">

                                                <button
                                                    className="confirm-reject-button"
                                                    onClick={
                                                        rejectPayment
                                                    }
                                                    disabled={
                                                        processingId ===
                                                        paymentId
                                                    }
                                                >
                                                    {processingId ===
                                                    paymentId
                                                        ? "Rejecting..."
                                                        : "Confirm Rejection"}
                                                </button>

                                                <button
                                                    className="cancel-reject-button"
                                                    onClick={
                                                        cancelReject
                                                    }
                                                    disabled={
                                                        processingId ===
                                                        paymentId
                                                    }
                                                >
                                                    Cancel
                                                </button>

                                            </div>

                                        </div>
                                    )}

                                    <div className="actions">

                                        <button
                                            className="approve-button"
                                            onClick={() =>
                                                approvePayment(
                                                    paymentId
                                                )
                                            }
                                            disabled={
                                                processingId ===
                                                paymentId
                                            }
                                        >
                                            {processingId ===
                                            paymentId
                                                ? "Processing..."
                                                : "Approve Payment"}
                                        </button>

                                        <button
                                            className="reject-button"
                                            onClick={() =>
                                                openRejectBox(
                                                    paymentId
                                                )
                                            }
                                            disabled={
                                                processingId ===
                                                paymentId
                                            }
                                        >
                                            Reject Payment
                                        </button>

                                    </div>

                                </div>
                            );
                        })
                    )}

                </div>

                <div className="section">

                    <div className="section-header">
                        <h2>
                            Payment History
                        </h2>
                    </div>

                    {loadingHistory ? (
                        <div className="loading">
                            Loading payment history...
                        </div>
                    ) : paymentHistory.length === 0 ? (
                        <div className="empty-state">
                            <h3>
                                No payment history
                            </h3>

                            <p>
                                No manual payment records are
                                available yet.
                            </p>
                        </div>
                    ) : (
                        <div className="history-table-wrapper">

                            <table className="history-table">

                                <thead>
                                    <tr>
                                        <th>
                                            Payment ID
                                        </th>

                                        <th>
                                            Order ID
                                        </th>

                                        <th>
                                            Customer
                                        </th>

                                        <th>
                                            Method
                                        </th>

                                        <th>
                                            Amount
                                        </th>

                                        <th>
                                            Transaction ID
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Verification
                                        </th>

                                        <th>
                                            Date
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {paymentHistory.map(
                                        (payment) => {

                                            const paymentId =
                                                payment.id;

                                            return (
                                                <tr
                                                    key={
                                                        paymentId
                                                    }
                                                >

                                                    <td>
                                                        #
                                                        {
                                                            paymentId
                                                        }
                                                    </td>

                                                    <td>
                                                        #
                                                        {
                                                            payment.order_id
                                                        }
                                                    </td>

                                                    <td>
                                                        {payment.customer_name ||
                                                            payment.user_name ||
                                                            payment.name ||
                                                            "N/A"}

                                                        <br />

                                                        <small>
                                                            {payment.customer_email ||
                                                                payment.user_email ||
                                                                payment.email ||
                                                                ""}
                                                        </small>
                                                    </td>

                                                    <td>
                                                        {payment.payment_method ||
                                                            payment.method ||
                                                            "N/A"}
                                                    </td>

                                                    <td>
                                                        ₹
                                                        {formatAmount(
                                                            payment.amount
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className="history-transaction">
                                                            {payment.transaction_id ||
                                                                payment.utr ||
                                                                "N/A"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`status ${getStatusClass(
                                                                payment.status
                                                            )}`}
                                                        >
                                                            {payment.status ||
                                                                "N/A"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`status ${getStatusClass(
                                                                payment.verification_status
                                                            )}`}
                                                        >
                                                            {payment.verification_status ||
                                                                "N/A"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {formatDate(
                                                            payment.created_at
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

                </div>

            </div>

        </div>
    );
};

export default AdminPaymentVerification;