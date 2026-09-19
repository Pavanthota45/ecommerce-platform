import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

const API_URL = "http://localhost:5000";

function AdminAnalytics() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==================================================
    // LOAD ANALYTICS
    // ==================================================

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("token");

            if (!token) {
                setError("Admin login session not found. Please login again.");
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `${API_URL}/api/admin/analytics`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setAnalytics(response.data);
            } else {
                setError(
                    response.data.message ||
                    "Unable to load analytics."
                );
            }
        } catch (err) {
            console.error("Analytics error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load analytics."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    // ==================================================
    // FORMAT CURRENCY
    // ==================================================

    const formatCurrency = (value) => {
        return `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )}`;
    };

    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
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

    // ==================================================
    // DAILY SALES
    // Backend:
    // date
    // orders
    // sales
    // ==================================================

    const dailySales = useMemo(() => {
        if (!analytics?.daily_sales) {
            return [];
        }

        return analytics.daily_sales.map((item) => ({
            ...item,
            orders: Number(item.orders || 0),
            sales: Number(item.sales || 0),
            displayDate: item.date
                ? new Date(item.date).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short"
                    }
                )
                : "-"
        }));
    }, [analytics]);

    // ==================================================
    // MONTHLY SALES
    //
    // Backend returns:
    // month: "2026-09"
    // orders
    // sales
    // ==================================================

    const monthlySales = useMemo(() => {
        if (!analytics?.monthly_sales) {
            return [];
        }

        return analytics.monthly_sales.map((item) => {
            let displayMonth = item.month || "-";

            if (item.month) {
                const parts = String(item.month).split("-");

                if (parts.length === 2) {
                    const year = Number(parts[0]);
                    const month = Number(parts[1]);

                    if (
                        !Number.isNaN(year) &&
                        !Number.isNaN(month)
                    ) {
                        const date = new Date(
                            year,
                            month - 1,
                            1
                        );

                        displayMonth =
                            date.toLocaleDateString(
                                "en-IN",
                                {
                                    month: "short",
                                    year: "2-digit"
                                }
                            );
                    }
                }
            }

            return {
                ...item,
                orders: Number(item.orders || 0),
                sales: Number(item.sales || 0),
                displayMonth
            };
        });
    }, [analytics]);

    // ==================================================
    // ORDER STATUS DATA
    // ==================================================

    const statusData = useMemo(() => {
        if (!analytics?.orders_by_status) {
            return [];
        }

        return analytics.orders_by_status.map((item) => ({
            name: item.status,
            value: Number(item.count || 0)
        }));
    }, [analytics]);

    // ==================================================
    // STATUS LABEL
    // ==================================================

    const formatStatus = (status) => {
        if (!status) {
            return "";
        }

        return String(status)
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    padding: "50px 20px",
                    textAlign: "center",
                    background: "#f7f8fa"
                }}
            >
                <h2>Loading analytics...</h2>
                <p style={{ color: "#666" }}>
                    Please wait while sales data is being loaded.
                </p>
            </div>
        );
    }

    // ==================================================
    // ERROR
    // ==================================================

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    padding: "40px 20px",
                    background: "#f7f8fa"
                }}
            >
                <div
                    style={{
                        maxWidth: "700px",
                        margin: "0 auto",
                        padding: "25px",
                        borderRadius: "12px",
                        border: "1px solid #f5c2c7",
                        background: "#f8d7da"
                    }}
                >
                    <h2>
                        Unable to load analytics
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={loadAnalytics}
                        style={{
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            background: "#fff"
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return null;
    }

    const summary = analytics.summary || {};

    return (
        <div
            style={{
                padding: "30px",
                maxWidth: "1500px",
                margin: "0 auto",
                fontFamily: "Arial, sans-serif",
                background: "#f7f8fa",
                minHeight: "100vh",
                boxSizing: "border-box"
            }}
        >
            {/* ==================================================
                HEADER
            ================================================== */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    marginBottom: "30px",
                    flexWrap: "wrap"
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "32px"
                        }}
                    >
                        Sales & Analytics
                    </h1>

                    <p
                        style={{
                            marginTop: "8px",
                            color: "#666"
                        }}
                    >
                        Monitor your store performance,
                        sales and inventory.
                    </p>
                </div>

                <button
                    onClick={loadAnalytics}
                    style={{
                        padding: "11px 18px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "#fff",
                        cursor: "pointer",
                        fontWeight: "600"
                    }}
                >
                    Refresh Data
                </button>
            </div>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px"
                }}
            >
                {/* TOTAL SALES */}

                <SummaryCard
                    title="Total Sales"
                    value={formatCurrency(summary.total_sales)}
                />

                {/* TOTAL ORDERS */}

                <SummaryCard
                    title="Total Orders"
                    value={summary.total_orders || 0}
                />

                {/* CUSTOMERS */}

                <SummaryCard
                    title="Customers"
                    value={summary.total_customers || 0}
                />

                {/* PRODUCTS */}

                <SummaryCard
                    title="Active Products"
                    value={summary.total_products || 0}
                />

                {/* TODAY */}

                <SummaryCard
                    title="Today's Sales"
                    value={formatCurrency(summary.sales_today)}
                    subtitle={`${summary.orders_today || 0} orders`}
                />

                {/* MONTH */}

                <SummaryCard
                    title="This Month"
                    value={formatCurrency(summary.sales_this_month)}
                    subtitle={`${summary.orders_this_month || 0} orders`}
                />
            </div>

            {/* ==================================================
                DAILY SALES
            ================================================== */}

            <AnalyticsCard>
                <h2>
                    Sales — Last 7 Days
                </h2>

                <p
                    style={{
                        color: "#666",
                        marginTop: "-5px"
                    }}
                >
                    Daily sales generated from your orders.
                </p>

                <div
                    style={{
                        width: "100%",
                        height: "350px"
                    }}
                >
                    {dailySales.length === 0 ? (
                        <EmptyMessage text="No sales data available for the last 7 days." />
                    ) : (
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <LineChart
                                data={dailySales}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 10,
                                    bottom: 10
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                />

                                <XAxis
                                    dataKey="displayDate"
                                />

                                <YAxis />

                                <Tooltip
                                    formatter={(value, name) => [
                                        formatCurrency(value),
                                        name === "sales"
                                            ? "Sales"
                                            : name
                                    ]}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    strokeWidth={3}
                                    dot
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </AnalyticsCard>

            {/* ==================================================
                MONTHLY SALES + STATUS
            ================================================== */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "minmax(0, 2fr) minmax(300px, 1fr)",
                    gap: "30px",
                    marginBottom: "30px"
                }}
            >
                {/* MONTHLY SALES */}

                <AnalyticsCard>
                    <h2>
                        Monthly Sales
                    </h2>

                    <p
                        style={{
                            color: "#666",
                            marginTop: "-5px"
                        }}
                    >
                        Sales performance over the last 12 months.
                    </p>

                    <div
                        style={{
                            width: "100%",
                            height: "350px"
                        }}
                    >
                        {monthlySales.length === 0 ? (
                            <EmptyMessage text="No monthly sales data available." />
                        ) : (
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <BarChart
                                    data={monthlySales}
                                    margin={{
                                        top: 10,
                                        right: 20,
                                        left: 10,
                                        bottom: 10
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="displayMonth"
                                    />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(value) =>
                                            formatCurrency(value)
                                        }
                                    />

                                    <Bar
                                        dataKey="sales"
                                        barSize={35}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </AnalyticsCard>

                {/* ORDER STATUS */}

                <AnalyticsCard>
                    <h2>
                        Orders by Status
                    </h2>

                    <p
                        style={{
                            color: "#666",
                            marginTop: "-5px"
                        }}
                    >
                        Current order distribution.
                    </p>

                    <div
                        style={{
                            width: "100%",
                            height: "350px"
                        }}
                    >
                        {statusData.length === 0 ? (
                            <EmptyMessage text="No order status data available." />
                        ) : (
                            <ResponsiveContainer
                                width="100%"
                                height="100%"
                            >
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={100}
                                        label
                                    >
                                        {statusData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`${entry.name}-${index}`}
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip />

                                    <Legend
                                        formatter={formatStatus}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </AnalyticsCard>
            </div>

            {/* ==================================================
                TOP PRODUCTS
            ================================================== */}

            <AnalyticsCard>
                <h2>
                    Top Selling Products
                </h2>

                {analytics.top_products?.length === 0 ? (
                    <EmptyMessage text="No product sales available yet." />
                ) : (
                    <div
                        style={{
                            overflowX: "auto"
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: "700px"
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={tableHeader}>
                                        Product
                                    </th>

                                    <th style={tableHeader}>
                                        Brand
                                    </th>

                                    <th style={tableHeader}>
                                        SKU
                                    </th>

                                    <th style={tableHeader}>
                                        Units Sold
                                    </th>

                                    <th style={tableHeader}>
                                        Revenue
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {analytics.top_products.map(
                                    (product) => (
                                        <tr
                                            key={
                                                product.product_id
                                            }
                                        >
                                            <td style={tableCell}>
                                                {product.name || "-"}
                                            </td>

                                            <td style={tableCell}>
                                                {product.brand || "-"}
                                            </td>

                                            <td style={tableCell}>
                                                {product.sku || "-"}
                                            </td>

                                            <td style={tableCell}>
                                                {product.quantity_sold || 0}
                                            </td>

                                            <td style={tableCell}>
                                                {formatCurrency(
                                                    product.revenue
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AnalyticsCard>

            {/* ==================================================
                TOP CATEGORIES
            ================================================== */}

            <AnalyticsCard>
                <h2>
                    Top Categories
                </h2>

                {analytics.top_categories?.length === 0 ? (
                    <EmptyMessage text="No category sales available yet." />
                ) : (
                    <div
                        style={{
                            overflowX: "auto"
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: "600px"
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={tableHeader}>
                                        Category
                                    </th>

                                    <th style={tableHeader}>
                                        Units Sold
                                    </th>

                                    <th style={tableHeader}>
                                        Revenue
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {analytics.top_categories.map(
                                    (category) => (
                                        <tr
                                            key={
                                                category.category_id
                                            }
                                        >
                                            <td style={tableCell}>
                                                {category.category_name ||
                                                    "Uncategorized"}
                                            </td>

                                            <td style={tableCell}>
                                                {category.quantity_sold || 0}
                                            </td>

                                            <td style={tableCell}>
                                                {formatCurrency(
                                                    category.revenue
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AnalyticsCard>

            {/* ==================================================
                LOW STOCK
            ================================================== */}

            <AnalyticsCard>
                <h2>
                    Low Stock Products
                </h2>

                {analytics.low_stock?.length === 0 ? (
                    <EmptyMessage text="No low-stock products." />
                ) : (
                    <div
                        style={{
                            overflowX: "auto"
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: "700px"
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={tableHeader}>
                                        Product
                                    </th>

                                    <th style={tableHeader}>
                                        SKU
                                    </th>

                                    <th style={tableHeader}>
                                        Stock
                                    </th>

                                    <th style={tableHeader}>
                                        Reserved
                                    </th>

                                    <th style={tableHeader}>
                                        Available
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {analytics.low_stock.map(
                                    (product) => (
                                        <tr
                                            key={
                                                product.product_id
                                            }
                                        >
                                            <td style={tableCell}>
                                                {product.name || "-"}
                                            </td>

                                            <td style={tableCell}>
                                                {product.sku || "-"}
                                            </td>

                                            <td style={tableCell}>
                                                {product.stock_quantity || 0}
                                            </td>

                                            <td style={tableCell}>
                                                {product.reserved_quantity || 0}
                                            </td>

                                            <td
                                                style={{
                                                    ...tableCell,
                                                    fontWeight: "700"
                                                }}
                                            >
                                                {
                                                    product.available_quantity
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AnalyticsCard>

            {/* ==================================================
                RECENT ORDERS
            ================================================== */}

            <AnalyticsCard>
                <h2>
                    Recent Orders
                </h2>

                {analytics.recent_orders?.length === 0 ? (
                    <EmptyMessage text="No orders available." />
                ) : (
                    <div
                        style={{
                            overflowX: "auto"
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: "850px"
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={tableHeader}>
                                        Order ID
                                    </th>

                                    <th style={tableHeader}>
                                        Customer
                                    </th>

                                    <th style={tableHeader}>
                                        Email
                                    </th>

                                    <th style={tableHeader}>
                                        Amount
                                    </th>

                                    <th style={tableHeader}>
                                        Status
                                    </th>

                                    <th style={tableHeader}>
                                        Date
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {analytics.recent_orders.map(
                                    (order) => (
                                        <tr
                                            key={order.id}
                                        >
                                            <td style={tableCell}>
                                                #{order.id}
                                            </td>

                                            <td style={tableCell}>
                                                {order.customer_name ||
                                                    "-"}
                                            </td>

                                            <td style={tableCell}>
                                                {order.customer_email ||
                                                    "-"}
                                            </td>

                                            <td style={tableCell}>
                                                {formatCurrency(
                                                    order.total_amount
                                                )}
                                            </td>

                                            <td style={tableCell}>
                                                {formatStatus(
                                                    order.status
                                                )}
                                            </td>

                                            <td style={tableCell}>
                                                {formatDate(
                                                    order.created_at
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AnalyticsCard>
        </div>
    );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
    title,
    value,
    subtitle
}) {
    return (
        <div
            style={{
                padding: "22px",
                borderRadius: "14px",
                background: "#fff",
                border: "1px solid #e5e5e5",
                boxShadow:
                    "0 2px 8px rgba(0,0,0,0.05)"
            }}
        >
            <p
                style={{
                    margin: 0,
                    color: "#666",
                    fontSize: "14px"
                }}
            >
                {title}
            </p>

            <h2
                style={{
                    margin: "10px 0 5px",
                    fontSize: "25px"
                }}
            >
                {value}
            </h2>

            {subtitle && (
                <small
                    style={{
                        color: "#777"
                    }}
                >
                    {subtitle}
                </small>
            )}
        </div>
    );
}

// ======================================================
// ANALYTICS CARD
// ======================================================

function AnalyticsCard({ children }) {
    return (
        <div
            style={{
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "30px",
                boxShadow:
                    "0 2px 8px rgba(0,0,0,0.03)",
                overflow: "hidden"
            }}
        >
            {children}
        </div>
    );
}

// ======================================================
// EMPTY MESSAGE
// ======================================================

function EmptyMessage({ text }) {
    return (
        <div
            style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#777",
                textAlign: "center"
            }}
        >
            <p>{text}</p>
        </div>
    );
}

// ======================================================
// TABLE STYLES
// ======================================================

const tableHeader = {
    textAlign: "left",
    padding: "13px",
    borderBottom: "2px solid #e5e5e5",
    fontSize: "14px",
    whiteSpace: "nowrap"
};

const tableCell = {
    padding: "13px",
    borderBottom: "1px solid #eeeeee",
    fontSize: "14px"
};

export default AdminAnalytics;