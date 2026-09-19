const express = require("express");

const {
    getProductReviews,
    getMyProductReview,
    createReview,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


/*
    ==============================
    PUBLIC PRODUCT REVIEWS
    ==============================
*/

router.get(
    "/product/:productId",
    getProductReviews
);


/*
    ==============================
    CUSTOMER REVIEW
    ==============================
*/

router.get(
    "/product/:productId/my",
    authMiddleware,
    authorizeRoles("customer"),
    getMyProductReview
);


router.post(
    "/product/:productId",
    authMiddleware,
    authorizeRoles("customer"),
    createReview
);


router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("customer"),
    updateReview
);


router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("customer"),
    deleteReview
);


module.exports = router;