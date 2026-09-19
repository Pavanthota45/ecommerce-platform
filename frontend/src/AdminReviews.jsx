import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000";

function AdminReviews() {
    const navigate = useNavigate();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");

    const [selectedReview, setSelectedReview] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const [deletingId, setDeletingId] = useState(null);

    /*
        ==============================
        CHECK ADMIN LOGIN
        ==============================
    */

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
                return;
            }

            loadReviews();

        } catch (error) {
            console.error("User data error:", error);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigate("/login");
        }
    }, [navigate]);


    /*
        ==============================
        LOAD REVIEWS
        ==============================
    */

    const loadReviews = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${API_URL}/api/admin/reviews`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setReviews(response.data.reviews || []);
            } else {
                setError(
                    response.data.message ||
                    "Failed to load reviews."
                );
            }

        } catch (error) {
            console.error(
                "Load reviews error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load reviews."
            );

        } finally {
            setLoading(false);
        }
    };


    /*
        ==============================
        VIEW REVIEW DETAILS
        ==============================
    */

    const viewReview = async (reviewId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${API_URL}/api/admin/reviews/${reviewId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setSelectedReview(
                    response.data.review
                );

                setShowDetails(true);
            }

        } catch (error) {
            console.error(
                "View review error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to load review details."
            );
        }
    };


    /*
        ==============================
        DELETE REVIEW
        ==============================
    */

    const deleteReview = async (reviewId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this review?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(reviewId);

            const token = localStorage.getItem("token");

            const response = await axios.delete(
                `${API_URL}/api/admin/reviews/${reviewId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                alert(
                    "Review deleted successfully."
                );

                setReviews((previousReviews) =>
                    previousReviews.filter(
                        (review) =>
                            review.id !== reviewId
                    )
                );

                if (
                    selectedReview &&
                    selectedReview.id === reviewId
                ) {
                    setSelectedReview(null);
                    setShowDetails(false);
                }
            }

        } catch (error) {
            console.error(
                "Delete review error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to delete review."
            );

        } finally {
            setDeletingId(null);
        }
    };


    /*
        ==============================
        FILTER REVIEWS
        ==============================
    */

    const filteredReviews = reviews.filter(
        (review) => {
            const searchText =
                search.trim().toLowerCase();

            const matchesSearch =
                !searchText ||
                String(review.id)
                    .toLowerCase()
                    .includes(searchText) ||
                String(review.customer_name || "")
                    .toLowerCase()
                    .includes(searchText) ||
                String(review.customer_email || "")
                    .toLowerCase()
                    .includes(searchText) ||
                String(review.product_name || "")
                    .toLowerCase()
                    .includes(searchText) ||
                String(review.product_sku || "")
                    .toLowerCase()
                    .includes(searchText);

            const matchesRating =
                ratingFilter === "all" ||
                Number(review.rating) ===
                    Number(ratingFilter);

            return (
                matchesSearch &&
                matchesRating
            );
        }
    );


    /*
        ==============================
        RATING DISPLAY
        ==============================
    */

    const renderStars = (rating) => {
        const value = Number(rating) || 0;

        return (
            <span style={styles.stars}>
                {[1, 2, 3, 4, 5].map(
                    (star) => (
                        <span
                            key={star}
                            style={
                                star <= value
                                    ? styles.starActive
                                    : styles.starInactive
                            }
                        >
                            ★
                        </span>
                    )
                )}
            </span>
        );
    };


    /*
        ==============================
        DATE FORMAT
        ==============================
    */

    const formatDate = (date) => {
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


    /*
        ==============================
        REVIEW STATISTICS
        ==============================
    */

    const totalReviews = reviews.length;

    const fiveStarReviews = reviews.filter(
        (review) =>
            Number(review.rating) === 5
    ).length;

    const fourStarReviews = reviews.filter(
        (review) =>
            Number(review.rating) === 4
    ).length;

    const threeStarReviews = reviews.filter(
        (review) =>
            Number(review.rating) === 3
    ).length;

    const twoStarReviews = reviews.filter(
        (review) =>
            Number(review.rating) === 2
    ).length;

    const oneStarReviews = reviews.filter(
        (review) =>
            Number(review.rating) === 1
    ).length;

    const averageRating =
        totalReviews > 0
            ? (
                  reviews.reduce(
                      (sum, review) =>
                          sum +
                          Number(review.rating || 0),
                      0
                  ) / totalReviews
              ).toFixed(1)
            : "0.0";


    /*
        ==============================
        LOADING
        ==============================
    */

    if (loading) {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.loadingBox}>
                    <div style={styles.loadingSpinner}>
                        ⟳
                    </div>

                    <h2>
                        Loading Reviews...
                    </h2>

                    <p>
                        Please wait while reviews
                        are being loaded.
                    </p>
                </div>
            </div>
        );
    }


    /*
        ==============================
        PAGE
        ==============================
    */

    return (
        <div style={styles.page}>

            {/* ================= HEADER ================= */}

            <header style={styles.header}>

                <div>
                    <h1 style={styles.headerTitle}>
                        Review Management
                    </h1>

                    <p style={styles.headerSubtitle}>
                        Manage customer reviews
                        and ratings
                    </p>
                </div>

                <div style={styles.headerActions}>

                    <Link
                        to="/admin"
                        style={styles.dashboardButton}
                    >
                        ← Admin Dashboard
                    </Link>

                    <button
                        onClick={loadReviews}
                        style={styles.refreshButton}
                    >
                        ↻ Refresh
                    </button>

                </div>

            </header>


            {/* ================= ERROR ================= */}

            {error && (
                <div style={styles.errorBox}>
                    {error}
                </div>
            )}


            {/* ================= STATISTICS ================= */}

            <div style={styles.statsGrid}>

                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        📝
                    </div>

                    <div>
                        <div style={styles.statLabel}>
                            Total Reviews
                        </div>

                        <div style={styles.statValue}>
                            {totalReviews}
                        </div>
                    </div>
                </div>


                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        ⭐
                    </div>

                    <div>
                        <div style={styles.statLabel}>
                            Average Rating
                        </div>

                        <div style={styles.statValue}>
                            {averageRating}
                        </div>
                    </div>
                </div>


                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        🌟
                    </div>

                    <div>
                        <div style={styles.statLabel}>
                            5 Star Reviews
                        </div>

                        <div style={styles.statValue}>
                            {fiveStarReviews}
                        </div>
                    </div>
                </div>


                <div style={styles.statCard}>
                    <div style={styles.statIcon}>
                        👍
                    </div>

                    <div>
                        <div style={styles.statLabel}>
                            4 Star Reviews
                        </div>

                        <div style={styles.statValue}>
                            {fourStarReviews}
                        </div>
                    </div>
                </div>

            </div>


            {/* ================= RATING SUMMARY ================= */}

            <div style={styles.ratingSummary}>

                <h2 style={styles.sectionTitle}>
                    Rating Summary
                </h2>

                <div style={styles.ratingRows}>

                    <div style={styles.ratingRow}>
                        <span>5 Stars</span>

                        <div style={styles.ratingBarBackground}>
                            <div
                                style={{
                                    ...styles.ratingBar,
                                    width:
                                        totalReviews > 0
                                            ? `${
                                                  (fiveStarReviews /
                                                      totalReviews) *
                                                  100
                                              }%`
                                            : "0%"
                                }}
                            />
                        </div>

                        <span>
                            {fiveStarReviews}
                        </span>
                    </div>


                    <div style={styles.ratingRow}>
                        <span>4 Stars</span>

                        <div style={styles.ratingBarBackground}>
                            <div
                                style={{
                                    ...styles.ratingBar,
                                    width:
                                        totalReviews > 0
                                            ? `${
                                                  (fourStarReviews /
                                                      totalReviews) *
                                                  100
                                              }%`
                                            : "0%"
                                }}
                            />
                        </div>

                        <span>
                            {fourStarReviews}
                        </span>
                    </div>


                    <div style={styles.ratingRow}>
                        <span>3 Stars</span>

                        <div style={styles.ratingBarBackground}>
                            <div
                                style={{
                                    ...styles.ratingBar,
                                    width:
                                        totalReviews > 0
                                            ? `${
                                                  (threeStarReviews /
                                                      totalReviews) *
                                                  100
                                              }%`
                                            : "0%"
                                }}
                            />
                        </div>

                        <span>
                            {threeStarReviews}
                        </span>
                    </div>


                    <div style={styles.ratingRow}>
                        <span>2 Stars</span>

                        <div style={styles.ratingBarBackground}>
                            <div
                                style={{
                                    ...styles.ratingBar,
                                    width:
                                        totalReviews > 0
                                            ? `${
                                                  (twoStarReviews /
                                                      totalReviews) *
                                                  100
                                              }%`
                                            : "0%"
                                }}
                            />
                        </div>

                        <span>
                            {twoStarReviews}
                        </span>
                    </div>


                    <div style={styles.ratingRow}>
                        <span>1 Star</span>

                        <div style={styles.ratingBarBackground}>
                            <div
                                style={{
                                    ...styles.ratingBar,
                                    width:
                                        totalReviews > 0
                                            ? `${
                                                  (oneStarReviews /
                                                      totalReviews) *
                                                  100
                                              }%`
                                            : "0%"
                                }}
                            />
                        </div>

                        <span>
                            {oneStarReviews}
                        </span>
                    </div>

                </div>

            </div>


            {/* ================= FILTERS ================= */}

            <div style={styles.filterCard}>

                <div style={styles.searchContainer}>

                    <span style={styles.searchIcon}>
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder="Search by customer, email, product, SKU or review ID..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        style={styles.searchInput}
                    />

                </div>


                <select
                    value={ratingFilter}
                    onChange={(event) =>
                        setRatingFilter(
                            event.target.value
                        )
                    }
                    style={styles.ratingSelect}
                >
                    <option value="all">
                        All Ratings
                    </option>

                    <option value="5">
                        5 Stars
                    </option>

                    <option value="4">
                        4 Stars
                    </option>

                    <option value="3">
                        3 Stars
                    </option>

                    <option value="2">
                        2 Stars
                    </option>

                    <option value="1">
                        1 Star
                    </option>
                </select>

            </div>


            {/* ================= TABLE ================= */}

            <div style={styles.tableCard}>

                <div style={styles.tableHeader}>

                    <h2 style={styles.sectionTitle}>
                        Customer Reviews
                    </h2>

                    <span style={styles.resultCount}>
                        Showing{" "}
                        {filteredReviews.length}{" "}
                        of {reviews.length}
                    </span>

                </div>


                {filteredReviews.length === 0 ? (

                    <div style={styles.emptyState}>

                        <div style={styles.emptyIcon}>
                            📝
                        </div>

                        <h3>
                            No reviews found
                        </h3>

                        <p>
                            No reviews match your
                            current search or filter.
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
                                        Customer
                                    </th>

                                    <th style={styles.th}>
                                        Product
                                    </th>

                                    <th style={styles.th}>
                                        Rating
                                    </th>

                                    <th style={styles.th}>
                                        Comment
                                    </th>

                                    <th style={styles.th}>
                                        Date
                                    </th>

                                    <th style={styles.th}>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredReviews.map(
                                    (review) => (

                                        <tr
                                            key={review.id}
                                            style={
                                                styles.tableRow
                                            }
                                        >

                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                #{review.id}
                                            </td>


                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >

                                                <div
                                                    style={
                                                        styles.customerName
                                                    }
                                                >
                                                    {
                                                        review.customer_name ||
                                                        "-"
                                                    }
                                                </div>

                                                <div
                                                    style={
                                                        styles.customerEmail
                                                    }
                                                >
                                                    {
                                                        review.customer_email ||
                                                        "-"
                                                    }
                                                </div>

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
                                                        review.product_name ||
                                                        "-"
                                                    }
                                                </div>

                                                <div
                                                    style={
                                                        styles.productSku
                                                    }
                                                >
                                                    SKU:{" "}
                                                    {
                                                        review.product_sku ||
                                                        "-"
                                                    }
                                                </div>

                                            </td>


                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                <div>
                                                    {renderStars(
                                                        review.rating
                                                    )}
                                                </div>

                                                <div
                                                    style={
                                                        styles.ratingNumber
                                                    }
                                                >
                                                    {
                                                        review.rating
                                                    }{" "}
                                                    / 5
                                                </div>
                                            </td>


                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >

                                                <div
                                                    style={
                                                        styles.comment
                                                    }
                                                >
                                                    {
                                                        review.comment
                                                            ? review
                                                                  .comment
                                                                  .length >
                                                              80
                                                                ? `${review.comment.substring(
                                                                      0,
                                                                      80
                                                                  )}...`
                                                                : review.comment
                                                            : "No comment"
                                                    }
                                                </div>

                                            </td>


                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                {
                                                    formatDate(
                                                        review.created_at
                                                    )
                                                }
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
                                                            viewReview(
                                                                review.id
                                                            )
                                                        }
                                                        style={
                                                            styles.viewButton
                                                        }
                                                    >
                                                        View
                                                    </button>


                                                    <button
                                                        onClick={() =>
                                                            deleteReview(
                                                                review.id
                                                            )
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            review.id
                                                        }
                                                        style={
                                                            styles.deleteButton
                                                        }
                                                    >
                                                        {deletingId ===
                                                        review.id
                                                            ? "Deleting..."
                                                            : "Delete"}
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

            </div>


            {/* ================= DETAILS MODAL ================= */}

            {showDetails &&
                selectedReview && (

                    <div
                        style={
                            styles.modalOverlay
                        }
                        onClick={() =>
                            setShowDetails(false)
                        }
                    >

                        <div
                            style={
                                styles.modal
                            }
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div
                                style={
                                    styles.modalHeader
                                }
                            >

                                <div>
                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Review Details
                                    </h2>

                                    <p
                                        style={
                                            styles.modalSubtitle
                                        }
                                    >
                                        Review #
                                        {
                                            selectedReview.id
                                        }
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setShowDetails(
                                            false
                                        )
                                    }
                                    style={
                                        styles.closeButton
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <div
                                style={
                                    styles.modalBody
                                }
                            >

                                {/* CUSTOMER */}

                                <div
                                    style={
                                        styles.detailSection
                                    }
                                >

                                    <h3
                                        style={
                                            styles.detailTitle
                                        }
                                    >
                                        Customer
                                    </h3>

                                    <div
                                        style={
                                            styles.detailGrid
                                        }
                                    >

                                        <div>
                                            <span
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Name
                                            </span>

                                            <strong>
                                                {
                                                    selectedReview.customer_name ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Email
                                            </span>

                                            <strong>
                                                {
                                                    selectedReview.customer_email ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Phone
                                            </span>

                                            <strong>
                                                {
                                                    selectedReview.customer_phone ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                    </div>

                                </div>


                                {/* PRODUCT */}

                                <div
                                    style={
                                        styles.detailSection
                                    }
                                >

                                    <h3
                                        style={
                                            styles.detailTitle
                                        }
                                    >
                                        Product
                                    </h3>

                                    <div
                                        style={
                                            styles.detailGrid
                                        }
                                    >

                                        <div>
                                            <span
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Product
                                            </span>

                                            <strong>
                                                {
                                                    selectedReview.product_name ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                Product ID
                                            </span>

                                            <strong>
                                                #
                                                {
                                                    selectedReview.product_id
                                                }
                                            </strong>
                                        </div>


                                        <div>
                                            <span
                                                style={
                                                    styles.detailLabel
                                                }
                                            >
                                                SKU
                                            </span>

                                            <strong>
                                                {
                                                    selectedReview.product_sku ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                    </div>

                                </div>


                                {/* RATING */}

                                <div
                                    style={
                                        styles.detailSection
                                    }
                                >

                                    <h3
                                        style={
                                            styles.detailTitle
                                        }
                                    >
                                        Rating
                                    </h3>

                                    <div
                                        style={
                                            styles.largeRating
                                        }
                                    >
                                        {renderStars(
                                            selectedReview.rating
                                        )}

                                        <strong>
                                            {
                                                selectedReview.rating
                                            }{" "}
                                            / 5
                                        </strong>
                                    </div>

                                </div>


                                {/* COMMENT */}

                                <div
                                    style={
                                        styles.detailSection
                                    }
                                >

                                    <h3
                                        style={
                                            styles.detailTitle
                                        }
                                    >
                                        Customer Comment
                                    </h3>

                                    <div
                                        style={
                                            styles.commentBox
                                        }
                                    >
                                        {
                                            selectedReview.comment ||
                                            "No comment provided."
                                        }
                                    </div>

                                </div>


                                {/* DATE */}

                                <div
                                    style={
                                        styles.detailSection
                                    }
                                >

                                    <h3
                                        style={
                                            styles.detailTitle
                                        }
                                    >
                                        Review Date
                                    </h3>

                                    <p>
                                        {
                                            formatDate(
                                                selectedReview.created_at
                                            )
                                        }
                                    </p>

                                </div>

                            </div>


                            <div
                                style={
                                    styles.modalFooter
                                }
                            >

                                <button
                                    onClick={() =>
                                        deleteReview(
                                            selectedReview.id
                                        )
                                    }
                                    disabled={
                                        deletingId ===
                                        selectedReview.id
                                    }
                                    style={
                                        styles.modalDeleteButton
                                    }
                                >
                                    {deletingId ===
                                    selectedReview.id
                                        ? "Deleting..."
                                        : "Delete Review"}
                                </button>


                                <button
                                    onClick={() =>
                                        setShowDetails(
                                            false
                                        )
                                    }
                                    style={
                                        styles.closeModalButton
                                    }
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}


/*
    ==============================
    STYLES
    ==============================
*/

const styles = {

    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        paddingBottom: "50px",
        fontFamily:
            "Arial, Helvetica, sans-serif"
    },

    header: {
        background: "#ffffff",
        borderBottom:
            "1px solid #e5e7eb",
        padding: "24px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px"
    },

    headerTitle: {
        margin: 0,
        fontSize: "28px",
        color: "#111827"
    },

    headerSubtitle: {
        margin:
            "6px 0 0 0",
        color: "#6b7280",
        fontSize: "14px"
    },

    headerActions: {
        display: "flex",
        gap: "10px",
        alignItems: "center"
    },

    dashboardButton: {
        textDecoration: "none",
        background: "#111827",
        color: "#ffffff",
        padding: "10px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600"
    },

    refreshButton: {
        border: "none",
        background: "#2563eb",
        color: "#ffffff",
        padding: "10px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600"
    },

    errorBox: {
        margin: "24px 32px 0",
        background: "#fee2e2",
        color: "#991b1b",
        padding: "14px 18px",
        borderRadius: "8px",
        border:
            "1px solid #fecaca"
    },

    statsGrid: {
        padding: "24px 32px 0",
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "18px"
    },

    statCard: {
        background: "#ffffff",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)"
    },

    statIcon: {
        fontSize: "28px",
        width: "48px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        borderRadius: "10px"
    },

    statLabel: {
        fontSize: "13px",
        color: "#6b7280",
        marginBottom: "4px"
    },

    statValue: {
        fontSize: "24px",
        fontWeight: "700",
        color: "#111827"
    },

    ratingSummary: {
        margin: "24px 32px 0",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "22px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)"
    },

    sectionTitle: {
        margin: 0,
        fontSize: "19px",
        color: "#111827"
    },

    ratingRows: {
        marginTop: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },

    ratingRow: {
        display: "grid",
        gridTemplateColumns:
            "70px 1fr 40px",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        color: "#374151"
    },

    ratingBarBackground: {
        height: "9px",
        background: "#e5e7eb",
        borderRadius: "20px",
        overflow: "hidden"
    },

    ratingBar: {
        height: "100%",
        background: "#f59e0b",
        borderRadius: "20px"
    },

    filterCard: {
        margin: "24px 32px 0",
        background: "#ffffff",
        padding: "18px",
        borderRadius: "12px",
        display: "flex",
        gap: "14px",
        alignItems: "center",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)"
    },

    searchContainer: {
        flex: 1,
        position: "relative"
    },

    searchIcon: {
        position: "absolute",
        left: "14px",
        top: "50%",
        transform:
            "translateY(-50%)",
        fontSize: "16px"
    },

    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        padding:
            "12px 14px 12px 42px",
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "14px",
        outline: "none"
    },

    ratingSelect: {
        padding: "12px 14px",
        border:
            "1px solid #d1d5db",
        borderRadius: "8px",
        background: "#ffffff",
        fontSize: "14px",
        minWidth: "150px"
    },

    tableCard: {
        margin: "24px 32px 0",
        background: "#ffffff",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.05)"
    },

    tableHeader: {
        padding: "20px",
        borderBottom:
            "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },

    resultCount: {
        color: "#6b7280",
        fontSize: "14px"
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
        background: "#f9fafb",
        padding: "14px 16px",
        textAlign: "left",
        fontSize: "12px",
        color: "#6b7280",
        textTransform: "uppercase",
        borderBottom:
            "1px solid #e5e7eb"
    },

    td: {
        padding: "16px",
        borderBottom:
            "1px solid #f0f0f0",
        verticalAlign: "top",
        fontSize: "14px",
        color: "#374151"
    },

    tableRow: {
        transition:
            "background 0.2s"
    },

    customerName: {
        fontWeight: "600",
        color: "#111827",
        marginBottom: "4px"
    },

    customerEmail: {
        fontSize: "12px",
        color: "#6b7280"
    },

    productName: {
        fontWeight: "600",
        color: "#111827",
        marginBottom: "4px"
    },

    productSku: {
        fontSize: "12px",
        color: "#6b7280"
    },

    stars: {
        whiteSpace: "nowrap",
        letterSpacing: "2px"
    },

    starActive: {
        color: "#f59e0b"
    },

    starInactive: {
        color: "#d1d5db"
    },

    ratingNumber: {
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "3px"
    },

    comment: {
        maxWidth: "260px",
        lineHeight: "1.5",
        color: "#4b5563"
    },

    actionButtons: {
        display: "flex",
        gap: "8px"
    },

    viewButton: {
        border: "none",
        background: "#2563eb",
        color: "#ffffff",
        padding: "8px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600"
    },

    deleteButton: {
        border: "none",
        background: "#dc2626",
        color: "#ffffff",
        padding: "8px 12px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "600"
    },

    emptyState: {
        padding: "70px 20px",
        textAlign: "center"
    },

    emptyIcon: {
        fontSize: "50px",
        marginBottom: "12px"
    },

    loadingPage: {
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
            "Arial, Helvetica, sans-serif"
    },

    loadingBox: {
        textAlign: "center",
        background: "#ffffff",
        padding: "40px",
        borderRadius: "12px",
        boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)"
    },

    loadingSpinner: {
        fontSize: "40px",
        marginBottom: "10px"
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        zIndex: 1000
    },

    modal: {
        width: "100%",
        maxWidth: "750px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#ffffff",
        borderRadius: "14px",
        boxShadow:
            "0 20px 50px rgba(0,0,0,0.25)"
    },

    modalHeader: {
        padding: "20px 24px",
        borderBottom:
            "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },

    modalTitle: {
        margin: 0,
        fontSize: "22px",
        color: "#111827"
    },

    modalSubtitle: {
        margin: "5px 0 0",
        color: "#6b7280",
        fontSize: "13px"
    },

    closeButton: {
        border: "none",
        background: "transparent",
        fontSize: "30px",
        color: "#6b7280",
        cursor: "pointer",
        lineHeight: 1
    },

    modalBody: {
        padding: "24px"
    },

    detailSection: {
        marginBottom: "24px",
        paddingBottom: "20px",
        borderBottom:
            "1px solid #e5e7eb"
    },

    detailTitle: {
        margin:
            "0 0 14px 0",
        fontSize: "16px",
        color: "#111827"
    },

    detailGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, 1fr)",
        gap: "18px"
    },

    detailLabel: {
        display: "block",
        fontSize: "12px",
        color: "#6b7280",
        marginBottom: "5px"
    },

    largeRating: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
        fontSize: "20px"
    },

    commentBox: {
        background: "#f9fafb",
        border:
            "1px solid #e5e7eb",
        padding: "16px",
        borderRadius: "8px",
        lineHeight: "1.7",
        color: "#374151"
    },

    modalFooter: {
        padding: "18px 24px",
        borderTop:
            "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px"
    },

    modalDeleteButton: {
        border: "none",
        background: "#dc2626",
        color: "#ffffff",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600"
    },

    closeModalButton: {
        border: "1px solid #d1d5db",
        background: "#ffffff",
        color: "#374151",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600"
    }
};


export default AdminReviews;