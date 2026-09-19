const pool = require("../config/db");


/*
    ==============================
    GET ALL REVIEWS FOR A PRODUCT
    ==============================
*/

const getProductReviews = async (req, res) => {
    try {
        const productId = Number(req.params.productId);

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }


        /*
            Check whether product exists
        */

        const [products] = await pool.query(
            `
            SELECT
                id,
                name
            FROM products
            WHERE id = ?
            `,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }


        /*
            Get reviews
        */

        const [reviews] = await pool.query(
            `
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,

                u.id AS customer_id,
                u.name AS customer_name

            FROM reviews r

            INNER JOIN users u
                ON r.user_id = u.id

            WHERE r.product_id = ?

            ORDER BY r.created_at DESC
            `,
            [productId]
        );


        /*
            Get rating summary
        */

        const [summaryRows] = await pool.query(
            `
            SELECT
                COUNT(*) AS total_reviews,

                COALESCE(
                    ROUND(AVG(rating), 1),
                    0
                ) AS average_rating,

                COALESCE(
                    SUM(
                        CASE
                            WHEN rating = 5 THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS five_star,

                COALESCE(
                    SUM(
                        CASE
                            WHEN rating = 4 THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS four_star,

                COALESCE(
                    SUM(
                        CASE
                            WHEN rating = 3 THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS three_star,

                COALESCE(
                    SUM(
                        CASE
                            WHEN rating = 2 THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS two_star,

                COALESCE(
                    SUM(
                        CASE
                            WHEN rating = 1 THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS one_star

            FROM reviews

            WHERE product_id = ?
            `,
            [productId]
        );


        /*
            Convert summary values to numbers
        */

        const summary = summaryRows[0] || {};

        const totalReviews =
            Number(summary.total_reviews || 0);

        const averageRating =
            Number(summary.average_rating || 0);

        const fiveStar =
            Number(summary.five_star || 0);

        const fourStar =
            Number(summary.four_star || 0);

        const threeStar =
            Number(summary.three_star || 0);

        const twoStar =
            Number(summary.two_star || 0);

        const oneStar =
            Number(summary.one_star || 0);


        /*
            Return response
        */

        return res.status(200).json({
            success: true,

            product: products[0],

            average_rating: averageRating,

            total_reviews: totalReviews,

            five_star: fiveStar,

            four_star: fourStar,

            three_star: threeStar,

            two_star: twoStar,

            one_star: oneStar,

            summary: {
                total_reviews: totalReviews,

                average_rating: averageRating,

                five_star: fiveStar,

                four_star: fourStar,

                three_star: threeStar,

                two_star: twoStar,

                one_star: oneStar
            },

            reviews
        });

    } catch (error) {

        console.error(
            "Get product reviews error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product reviews."
        });
    }
};


/*
    ==============================
    GET MY REVIEW FOR PRODUCT
    ==============================
*/

const getMyProductReview = async (req, res) => {
    try {
        const productId = Number(req.params.productId);

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }


        const [reviews] = await pool.query(
            `
            SELECT
                id,
                rating,
                comment,
                created_at
            FROM reviews
            WHERE user_id = ?
            AND product_id = ?
            `,
            [
                req.user.id,
                productId
            ]
        );


        return res.status(200).json({
            success: true,

            review:
                reviews.length > 0
                    ? reviews[0]
                    : null
        });

    } catch (error) {

        console.error(
            "Get my review error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your review."
        });
    }
};


/*
    ==============================
    CREATE REVIEW
    ==============================
*/

const createReview = async (req, res) => {
    try {
        const productId = Number(req.params.productId);

        const {
            rating,
            comment
        } = req.body;


        /*
            Validate product ID
        */

        if (
            !Number.isInteger(productId) ||
            productId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }


        /*
            Validate rating
        */

        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rating must be an integer between 1 and 5."
            });
        }


        /*
            Validate comment
        */

        const reviewComment =
            comment === undefined ||
            comment === null
                ? ""
                : String(comment).trim();


        if (reviewComment.length > 1000) {
            return res.status(400).json({
                success: false,
                message:
                    "Comment cannot exceed 1000 characters."
            });
        }


        /*
            Check product
        */

        const [products] = await pool.query(
            `
            SELECT
                id,
                name
            FROM products
            WHERE id = ?
            `,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }


        /*
            ==================================================
            PURCHASE VERIFICATION
            ==================================================

            Customer must have purchased this product.

            We check:

            users
                ↓
            orders
                ↓
            order_items
                ↓
            product
        */

        const [purchases] = await pool.query(
            `
            SELECT
                oi.id,
                o.id AS order_id,
                o.status AS order_status

            FROM order_items oi

            INNER JOIN orders o
                ON oi.order_id = o.id

            WHERE o.user_id = ?
            AND oi.product_id = ?

            AND o.status IN (
                'PLACED',
                'CONFIRMED',
                'PACKED',
                'SHIPPED',
                'OUT_FOR_DELIVERY',
                'DELIVERED'
            )

            LIMIT 1
            `,
            [
                req.user.id,
                productId
            ]
        );


        /*
            Customer has not purchased product
        */

        if (purchases.length === 0) {

            return res.status(403).json({
                success: false,
                message:
                    "You can review this product only after purchasing it."
            });
        }


        /*
            Check whether customer already reviewed
        */

        const [existingReviews] = await pool.query(
            `
            SELECT
                id
            FROM reviews
            WHERE user_id = ?
            AND product_id = ?
            `,
            [
                req.user.id,
                productId
            ]
        );


        if (existingReviews.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "You have already reviewed this product. You can update your existing review."
            });
        }


        /*
            Insert review
        */

        const [result] = await pool.query(
            `
            INSERT INTO reviews
            (
                user_id,
                product_id,
                rating,
                comment
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                req.user.id,
                productId,
                numericRating,
                reviewComment
            ]
        );


        /*
            Get created review
        */

        const [reviews] = await pool.query(
            `
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,

                u.id AS customer_id,
                u.name AS customer_name,

                r.product_id

            FROM reviews r

            INNER JOIN users u
                ON r.user_id = u.id

            WHERE r.id = ?
            `,
            [result.insertId]
        );


        return res.status(201).json({
            success: true,
            message: "Review added successfully.",
            review: reviews[0]
        });

    } catch (error) {

        console.error(
            "Create review error:",
            error
        );


        /*
            Handle duplicate unique constraint
        */

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "You have already reviewed this product."
            });
        }


        return res.status(500).json({
            success: false,
            message: "Failed to add review."
        });
    }
};


/*
    ==============================
    UPDATE MY REVIEW
    ==============================
*/

const updateReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);

        const {
            rating,
            comment
        } = req.body;


        /*
            Validate review ID
        */

        if (
            !Number.isInteger(reviewId) ||
            reviewId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID."
            });
        }


        /*
            Validate rating
        */

        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rating must be an integer between 1 and 5."
            });
        }


        /*
            Validate comment
        */

        const reviewComment =
            comment === undefined ||
            comment === null
                ? ""
                : String(comment).trim();


        if (reviewComment.length > 1000) {
            return res.status(400).json({
                success: false,
                message:
                    "Comment cannot exceed 1000 characters."
            });
        }


        /*
            Check ownership
        */

        const [existingReviews] = await pool.query(
            `
            SELECT
                id
            FROM reviews
            WHERE id = ?
            AND user_id = ?
            `,
            [
                reviewId,
                req.user.id
            ]
        );


        if (existingReviews.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Review not found or you do not have permission to update it."
            });
        }


        /*
            Update review
        */

        await pool.query(
            `
            UPDATE reviews

            SET
                rating = ?,
                comment = ?

            WHERE id = ?
            AND user_id = ?
            `,
            [
                numericRating,
                reviewComment,
                reviewId,
                req.user.id
            ]
        );


        /*
            Get updated review
        */

        const [reviews] = await pool.query(
            `
            SELECT
                r.id,
                r.rating,
                r.comment,
                r.created_at,

                u.id AS customer_id,
                u.name AS customer_name,

                r.product_id

            FROM reviews r

            INNER JOIN users u
                ON r.user_id = u.id

            WHERE r.id = ?
            `,
            [reviewId]
        );


        return res.status(200).json({
            success: true,
            message:
                "Review updated successfully.",
            review: reviews[0]
        });

    } catch (error) {

        console.error(
            "Update review error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update review."
        });
    }
};


/*
    ==============================
    DELETE MY REVIEW
    ==============================
*/

const deleteReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);


        /*
            Validate review ID
        */

        if (
            !Number.isInteger(reviewId) ||
            reviewId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID."
            });
        }


        /*
            Check ownership
        */

        const [existingReviews] = await pool.query(
            `
            SELECT
                id
            FROM reviews
            WHERE id = ?
            AND user_id = ?
            `,
            [
                reviewId,
                req.user.id
            ]
        );


        if (existingReviews.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Review not found or you do not have permission to delete it."
            });
        }


        /*
            Delete review
        */

        await pool.query(
            `
            DELETE FROM reviews
            WHERE id = ?
            AND user_id = ?
            `,
            [
                reviewId,
                req.user.id
            ]
        );


        return res.status(200).json({
            success: true,
            message:
                "Review deleted successfully."
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
    getProductReviews,
    getMyProductReview,
    createReview,
    updateReview,
    deleteReview
};