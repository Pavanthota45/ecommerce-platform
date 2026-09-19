const express = require("express");

const {
    getAllReviews,
    getReviewById,
    deleteReview
} = require("../controllers/adminReviewController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

/*
    All review management routes
    require admin authentication.
*/
router.use(authMiddleware);
router.use(authorizeRoles("admin"));

/*
    GET ALL REVIEWS

    GET /api/admin/reviews
*/
router.get("/", getAllReviews);

/*
    GET REVIEW BY ID

    GET /api/admin/reviews/:id
*/
router.get("/:id", getReviewById);

/*
    DELETE REVIEW

    DELETE /api/admin/reviews/:id
*/
router.delete("/:id", deleteReview);

module.exports = router;