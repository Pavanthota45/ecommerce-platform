const express = require("express");

const {
    getDashboardStats
} = require("../controllers/adminDashboardController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.use(
    authorizeRoles("admin")
);

router.get(
    "/",
    getDashboardStats
);

module.exports = router;