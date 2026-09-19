const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const db = require("./config/db");


// ======================================================
// CUSTOMER ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");


// ======================================================
// ADMIN ROUTES
// ======================================================

const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoutes");
const adminInventoryRoutes = require("./routes/adminInventoryRoutes");
const adminCustomerRoutes = require("./routes/adminCustomerRoutes");
const adminCouponRoutes = require("./routes/adminCouponRoutes");
const adminReviewRoutes = require("./routes/adminReviewRoutes");
const adminPaymentSettingsRoutes = require("./routes/adminPaymentSettingsRoutes");


// ======================================================
// CREATE APP
// ======================================================

const app = express();

const PORT =
    process.env.PORT || 5000;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);


// ======================================================
// STATIC UPLOADS
// ======================================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// ======================================================
// ROOT API
// ======================================================

app.get(
    "/",
    (req, res) => {

        return res.status(200).json({
            success: true,
            message:
                "E-commerce API is running successfully."
        });
    }
);


// ======================================================
// CUSTOMER API ROUTES
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/cart",
    cartRoutes
);

app.use(
    "/api/wishlist",
    wishlistRoutes
);

app.use(
    "/api/addresses",
    addressRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/reviews",
    reviewRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);


// ======================================================
// ADMIN API ROUTES
// ======================================================

app.use(
    "/api/admin/orders",
    adminOrderRoutes
);

app.use(
    "/api/admin/analytics",
    adminAnalyticsRoutes
);

app.use(
    "/api/admin/inventory",
    adminInventoryRoutes
);

app.use(
    "/api/admin/customers",
    adminCustomerRoutes
);

app.use(
    "/api/admin/coupons",
    adminCouponRoutes
);

app.use(
    "/api/admin/reviews",
    adminReviewRoutes
);

app.use(
    "/api/admin/payment-settings",
    adminPaymentSettingsRoutes
);


// ======================================================
// API 404 HANDLER
// ======================================================

app.use(
    (req, res) => {

        return res.status(404).json({
            success: false,
            message:
                "API route not found.",
            path: req.originalUrl
        });
    }
);


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Global server error:",
            error
        );

        return res.status(
            error.status || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Internal server error."
        });
    }
);


// ======================================================
// DATABASE TEST
// ======================================================

const testDatabaseConnection = async () => {

    try {

        await db.query(
            "SELECT 1"
        );

        console.log(
            "MySQL database connected successfully!"
        );

    } catch (error) {

        console.error(
            "MySQL database connection failed:",
            error.message
        );
    }
};


// ======================================================
// START SERVER
// ======================================================

app.listen(
    PORT,
    async () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        await testDatabaseConnection();
    }
);