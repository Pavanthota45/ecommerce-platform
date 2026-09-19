import React from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./Login";
import Register from "./Register";

import CustomerHome from "./CustomerHome";
import ProductDetails from "./ProductDetails";
import Cart from "./Cart";
import Checkout from "./Checkout";
import Addresses from "./Addresses";
import Orders from "./Orders";
import OrderDetails from "./OrderDetails";
import OrderSuccess from "./OrderSuccess";
import Wishlist from "./Wishlist";
import Notifications from "./Notifications";
import Profile from "./Profile";

import AdminDashboard from "./AdminDashboard";
import AdminAnalytics from "./AdminAnalytics";
import AdminCategories from "./AdminCategories";
import AdminCoupons from "./AdminCoupons";
import AdminCustomers from "./AdminCustomers";
import AdminInventory from "./AdminInventory";
import AdminOrders from "./AdminOrders";
import AdminOrderDetails from "./AdminOrderDetails";
import AdminPaymentSettings from "./AdminPaymentSettings";
import AdminPaymentVerification from "./AdminPaymentVerification";
import AdminProducts from "./AdminProducts";
import AdminReviews from "./AdminReviews";


// ============================================================
// GET STORED USER
// ============================================================

function getStoredUser() {
    try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser);
    } catch (error) {
        console.error(
            "Unable to read stored user:",
            error
        );

        return null;
    }
}


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {
    return localStorage.getItem("token");
}


// ============================================================
// ROOT REDIRECT
// ============================================================

function RootRedirect() {
    const user = getStoredUser();
    const token = getToken();

    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (user.role === "admin") {
        return (
            <Navigate
                to="/admin"
                replace
            />
        );
    }

    if (user.role === "customer") {
        return (
            <Navigate
                to="/home"
                replace
            />
        );
    }

    return (
        <Navigate
            to="/login"
            replace
        />
    );
}


// ============================================================
// CUSTOMER ROUTE
// ============================================================

function CustomerRoute({ children }) {
    const user = getStoredUser();
    const token = getToken();

    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (user.role !== "customer") {
        if (user.role === "admin") {
            return (
                <Navigate
                    to="/admin"
                    replace
                />
            );
        }

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}


// ============================================================
// ADMIN ROUTE
// ============================================================

function AdminRoute({ children }) {
    const user = getStoredUser();
    const token = getToken();

    if (!token || !user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (user.role !== "admin") {
        if (user.role === "customer") {
            return (
                <Navigate
                    to="/home"
                    replace
                />
            );
        }

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}


// ============================================================
// LOGIN ROUTE
// ============================================================

function LoginRoute() {
    const user = getStoredUser();
    const token = getToken();

    if (token && user) {
        if (user.role === "admin") {
            return (
                <Navigate
                    to="/admin"
                    replace
                />
            );
        }

        if (user.role === "customer") {
            return (
                <Navigate
                    to="/home"
                    replace
                />
            );
        }
    }

    return <Login />;
}


// ============================================================
// REGISTER ROUTE
// ============================================================

function RegisterRoute() {
    const user = getStoredUser();
    const token = getToken();

    if (token && user) {
        if (user.role === "admin") {
            return (
                <Navigate
                    to="/admin"
                    replace
                />
            );
        }

        if (user.role === "customer") {
            return (
                <Navigate
                    to="/home"
                    replace
                />
            );
        }
    }

    return <Register />;
}


// ============================================================
// APP
// ============================================================

function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* ==================================================
                    ROOT
                ================================================== */}

                <Route
                    path="/"
                    element={
                        <RootRedirect />
                    }
                />


                {/* ==================================================
                    AUTH
                ================================================== */}

                <Route
                    path="/login"
                    element={
                        <LoginRoute />
                    }
                />

                <Route
                    path="/register"
                    element={
                        <RegisterRoute />
                    }
                />


                {/* ==================================================
                    CUSTOMER ROUTES
                ================================================== */}

                <Route
                    path="/home"
                    element={
                        <CustomerRoute>
                            <CustomerHome />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/product/:id"
                    element={
                        <CustomerRoute>
                            <ProductDetails />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/cart"
                    element={
                        <CustomerRoute>
                            <Cart />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/checkout"
                    element={
                        <CustomerRoute>
                            <Checkout />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/addresses"
                    element={
                        <CustomerRoute>
                            <Addresses />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/orders"
                    element={
                        <CustomerRoute>
                            <Orders />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/orders/:id"
                    element={
                        <CustomerRoute>
                            <OrderDetails />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/order-success/:orderId"
                    element={
                        <CustomerRoute>
                            <OrderSuccess />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/wishlist"
                    element={
                        <CustomerRoute>
                            <Wishlist />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/notifications"
                    element={
                        <CustomerRoute>
                            <Notifications />
                        </CustomerRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <CustomerRoute>
                            <Profile />
                        </CustomerRoute>
                    }
                />


                {/* ==================================================
                    ADMIN DASHBOARD
                ================================================== */}

                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN ANALYTICS
                ================================================== */}

                <Route
                    path="/admin/analytics"
                    element={
                        <AdminRoute>
                            <AdminAnalytics />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN CATEGORIES
                ================================================== */}

                <Route
                    path="/admin/categories"
                    element={
                        <AdminRoute>
                            <AdminCategories />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN PRODUCTS
                ================================================== */}

                <Route
                    path="/admin/products"
                    element={
                        <AdminRoute>
                            <AdminProducts />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN INVENTORY
                ================================================== */}

                <Route
                    path="/admin/inventory"
                    element={
                        <AdminRoute>
                            <AdminInventory />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN CUSTOMERS
                ================================================== */}

                <Route
                    path="/admin/customers"
                    element={
                        <AdminRoute>
                            <AdminCustomers />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN ORDERS
                ================================================== */}

                <Route
                    path="/admin/orders"
                    element={
                        <AdminRoute>
                            <AdminOrders />
                        </AdminRoute>
                    }
                />

                <Route
                    path="/admin/orders/:id"
                    element={
                        <AdminRoute>
                            <AdminOrderDetails />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN COUPONS
                ================================================== */}

                <Route
                    path="/admin/coupons"
                    element={
                        <AdminRoute>
                            <AdminCoupons />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN REVIEWS
                ================================================== */}

                <Route
                    path="/admin/reviews"
                    element={
                        <AdminRoute>
                            <AdminReviews />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN PAYMENT SETTINGS
                ================================================== */}

                <Route
                    path="/admin/payment-settings"
                    element={
                        <AdminRoute>
                            <AdminPaymentSettings />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN PAYMENT VERIFICATION
                ================================================== */}

                <Route
                    path="/admin/payment-verification"
                    element={
                        <AdminRoute>
                            <AdminPaymentVerification />
                        </AdminRoute>
                    }
                />


                {/* ==================================================
                    ADMIN FALLBACK
                ================================================== */}

                <Route
                    path="/admin/*"
                    element={
                        <Navigate
                            to="/admin"
                            replace
                        />
                    }
                />


                {/* ==================================================
                    GLOBAL FALLBACK
                ================================================== */}

                <Route
                    path="*"
                    element={
                        <RootRedirect />
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;