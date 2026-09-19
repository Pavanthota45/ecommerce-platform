const pool = require("../config/db");

/*
    GET ALL REVIEWS
*/
const getAllReviews = async (req, res) => {
    try {
        const [reviews] = await pool.query(
            `
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,

                u.id AS customer_id,
                u.name AS customer_name,
                u.email AS customer_email,

                p.id AS product_id,
                p.name AS product_name,
                p.sku AS product_sku

            FROM reviews r

            INNER JOIN users u
                ON r.user_id = u.id

            INNER JOIN products p
                ON r.product_id = p.id

            ORDER BY r.created_at DESC
            `
        );

        return res.status(200).json({
            success: true,
            reviews
        });

    } catch (error) {
        console.error(
            "Get all reviews error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch reviews."
        });
    }
};


/*
    GET REVIEW BY ID
*/
const getReviewById = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);

        if (
            !Number.isInteger(reviewId) ||
            reviewId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID."
            });
        }

        const [reviews] = await pool.query(
            `
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,

                u.id AS customer_id,
                u.name AS customer_name,
                u.email AS customer_email,
                u.phone AS customer_phone,

                p.id AS product_id,
                p.name AS product_name,
                p.sku AS product_sku

            FROM reviews r

            INNER JOIN users u
                ON r.user_id = u.id

            INNER JOIN products p
                ON r.product_id = p.id

            WHERE r.id = ?
            `,
            [reviewId]
        );

        if (reviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found."
            });
        }

        return res.status(200).json({
            success: true,
            review: reviews[0]
        });

    } catch (error) {
        console.error(
            "Get review error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch review."
        });
    }
};


/*
    DELETE REVIEW
*/
const deleteReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);

        if (
            !Number.isInteger(reviewId) ||
            reviewId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID."
            });
        }

        const [existingReview] = await pool.query(
            `
            SELECT
                id
            FROM reviews
            WHERE id = ?
            `,
            [reviewId]
        );

        if (existingReview.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found."
            });
        }

        await pool.query(
            `
            DELETE FROM reviews
            WHERE id = ?
            `,
            [reviewId]
        );

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete review error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete review."
        });
    }
};


module.exports = {
    getAllReviews,
    getReviewById,
    deleteReview
};