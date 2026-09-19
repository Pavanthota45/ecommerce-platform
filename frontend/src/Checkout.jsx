import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

const API_URL = "http://localhost:5000";

function Checkout() {
    const navigate = useNavigate();

    const [cart, setCart] = useState(null);
    const [addresses, setAddresses] = useState([]);

    const [selectedAddress, setSelectedAddress] =
        useState("");

    const [selectedPaymentMethod, setSelectedPaymentMethod] =
        useState("");

    const [paymentSettings, setPaymentSettings] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [placingOrder, setPlacingOrder] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [couponCode, setCouponCode] =
        useState("");

    const [appliedCoupon, setAppliedCoupon] =
        useState(null);

    const [createdOrder, setCreatedOrder] =
        useState(null);

    const [screenshotFile, setScreenshotFile] =
        useState(null);

    const [uploadingPayment, setUploadingPayment] =
        useState(false);

    useEffect(() => {
        loadCheckoutData();
    }, []);

    const loadCheckoutData = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const config = {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            };

            const [
                cartResponse,
                addressResponse,
                paymentSettingsResponse
            ] = await Promise.all([
                axios.get(
                    `${API_URL}/api/cart`,
                    config
                ),

                axios.get(
                    `${API_URL}/api/addresses`,
                    config
                ),

                axios.get(
                    `${API_URL}/api/payments/settings`
                )
            ]);

            if (
                cartResponse.data.success
            ) {
                setCart(
                    cartResponse.data.cart
                );
            } else {
                setError(
                    cartResponse.data.message ||
                    "Unable to load cart."
                );
            }

            if (
                addressResponse.data.success
            ) {
                const addressList =
                    addressResponse.data.addresses ||
                    [];

                setAddresses(
                    addressList
                );

                const defaultAddress =
                    addressList.find(
                        (address) =>
                            Number(
                                address.is_default
                            ) === 1
                    );

                if (defaultAddress) {
                    setSelectedAddress(
                        String(
                            defaultAddress.id
                        )
                    );
                } else if (
                    addressList.length > 0
                ) {
                    setSelectedAddress(
                        String(
                            addressList[0].id
                        )
                    );
                }
            }

            if (
                paymentSettingsResponse.data.success
            ) {
                const settings =
                    paymentSettingsResponse.data
                        .settings;

                setPaymentSettings(
                    settings
                );

                if (
                    settings.cod_enabled
                ) {
                    setSelectedPaymentMethod(
                        "COD"
                    );
                } else if (
                    settings.upi_id_enabled
                ) {
                    setSelectedPaymentMethod(
                        "UPI"
                    );
                } else if (
                    settings.qr_enabled
                ) {
                    setSelectedPaymentMethod(
                        "QR"
                    );
                } else if (
                    settings.bank_transfer_enabled
                ) {
                    setSelectedPaymentMethod(
                        "BANK_TRANSFER"
                    );
                }
            } else {
                setError(
                    paymentSettingsResponse.data
                        .message ||
                    "Unable to load payment settings."
                );
            }

        } catch (error) {
            console.error(
                "Checkout loading error:",
                error
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");

                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to load checkout."
            );

        } finally {
            setLoading(false);
        }
    };

    const getItems = () => {
        if (!cart) {
            return [];
        }

        if (Array.isArray(cart)) {
            return cart;
        }

        if (Array.isArray(cart.items)) {
            return cart.items;
        }

        if (Array.isArray(cart.cart_items)) {
            return cart.cart_items;
        }

        return [];
    };

    const getSubtotal = () => {
        if (!cart) {
            return 0;
        }

        if (
            cart.subtotal !== undefined &&
            cart.subtotal !== null
        ) {
            return Number(
                cart.subtotal || 0
            );
        }

        return getItems().reduce(
            (total, item) => {
                const price =
                    item.discount_price !== null &&
                    item.discount_price !== undefined
                        ? Number(
                            item.discount_price
                        )
                        : Number(
                            item.price || 0
                        );

                const quantity =
                    Number(
                        item.quantity || 0
                    );

                return (
                    total +
                    price * quantity
                );
            },
            0
        );
    };

    const getDiscount = () => {
        if (!appliedCoupon) {
            return 0;
        }

        return Number(
            appliedCoupon.discount ||
            appliedCoupon.discount_amount ||
            0
        );
    };

    const getDeliveryFee = () => {
        const subtotal =
            getSubtotal();

        const discount =
            getDiscount();

        const amountAfterDiscount =
            subtotal - discount;

        if (
            amountAfterDiscount <= 0
        ) {
            return 0;
        }

        return amountAfterDiscount >= 1000
            ? 0
            : 50;
    };

    const getTotal = () => {
        const subtotal =
            getSubtotal();

        const discount =
            getDiscount();

        const deliveryFee =
            getDeliveryFee();

        return Math.max(
            subtotal -
            discount +
            deliveryFee,
            0
        );
    };

    const applyCoupon = () => {
        if (!couponCode.trim()) {
            setError(
                "Please enter a coupon code."
            );

            setSuccess("");

            return;
        }

        setAppliedCoupon({
            code:
                couponCode
                    .trim()
                    .toUpperCase(),

            discount: 0
        });

        setError("");

        setSuccess(
            "Coupon code added. It will be validated when the order is placed."
        );
    };

    const removeCoupon = () => {
        setCouponCode("");
        setAppliedCoupon(null);
        setSuccess("");
    };

    const createOrder = async () => {
        if (!selectedAddress) {
            setError(
                "Please select a delivery address."
            );

            return null;
        }

        if (
            getItems().length === 0
        ) {
            setError(
                "Your cart is empty."
            );

            return null;
        }

        if (
            !selectedPaymentMethod
        ) {
            setError(
                "Please select a payment method."
            );

            return null;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            navigate("/login");

            return null;
        }

        try {
            setPlacingOrder(true);
            setError("");
            setSuccess("");

            const orderData = {
                address_id:
                    Number(
                        selectedAddress
                    ),

                payment_method:
                    selectedPaymentMethod
            };

            if (
                appliedCoupon?.code
            ) {
                orderData.coupon_code =
                    appliedCoupon.code;
            }

            const response =
                await axios.post(
                    `${API_URL}/api/orders`,
                    orderData,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (
                !response.data.success
            ) {
                setError(
                    response.data.message ||
                    "Unable to create order."
                );

                return null;
            }

            return {
                id:
                    response.data.order_id,

                subtotal:
                    response.data.subtotal,

                discount:
                    response.data.discount,

                delivery_fee:
                    response.data.delivery_fee,

                total_amount:
                    response.data.total_amount
            };

        } catch (error) {
            console.error(
                "Order creation error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to create order."
            );

            return null;

        } finally {
            setPlacingOrder(false);
        }
    };

    const getUpiQrValue = () => {
        if (
            !paymentSettings?.upi_id
        ) {
            return "";
        }

        const amount =
            createdOrder
                ? Number(
                    createdOrder.total_amount ||
                    0
                ).toFixed(2)
                : Number(
                    getTotal()
                ).toFixed(2);

        const upiId =
            paymentSettings.upi_id;

        const merchantName =
            paymentSettings.qr_merchant_name ||
            "E-Commerce Store";

        const transactionReference =
            createdOrder
                ? `ORDER${createdOrder.id}`
                : "ECOMMERCE";

        return (
            "upi://pay" +
            `?pa=${encodeURIComponent(
                upiId
            )}` +
            `&pn=${encodeURIComponent(
                merchantName
            )}` +
            `&am=${encodeURIComponent(
                amount
            )}` +
            "&cu=INR" +
            `&tr=${encodeURIComponent(
                transactionReference
            )}`
        );
    };

    const handlePlaceOrder = async () => {
        if (placingOrder) {
            return;
        }

        setError("");
        setSuccess("");

        const order =
            await createOrder();

        if (!order) {
            return;
        }

        if (
            selectedPaymentMethod ===
            "COD"
        ) {
            navigate(
                `/order-success/${order.id}`
            );

            return;
        }

        setCreatedOrder(order);

        setSuccess(
            "Order created successfully. Complete the payment and upload your payment screenshot."
        );
    };

    const handleScreenshotChange = (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            setScreenshotFile(null);
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (
            !allowedTypes.includes(
                file.type
            )
        ) {
            setError(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            );

            setScreenshotFile(null);

            return;
        }

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setError(
                "Payment screenshot must be 5 MB or smaller."
            );

            setScreenshotFile(null);

            return;
        }

        setError("");
        setSuccess("");
        setScreenshotFile(file);
    };

    const submitManualPayment = async () => {
        if (!createdOrder) {
            setError(
                "Order information is missing."
            );

            return;
        }

        if (
            selectedPaymentMethod ===
            "COD"
        ) {
            setError(
                "COD does not require manual payment submission."
            );

            return;
        }

        if (!screenshotFile) {
            setError(
                "Payment screenshot is required. Please upload a clear screenshot of your successful payment."
            );

            return;
        }

        const token =
            localStorage.getItem("token");

        if (!token) {
            navigate("/login");

            return;
        }

        try {
            setUploadingPayment(true);
            setError("");
            setSuccess("");

            const formData =
                new FormData();

            formData.append(
                "payment_screenshot",
                screenshotFile
            );

            const response =
                await axios.post(
                    `${API_URL}/api/payments/upload-screenshot/${createdOrder.id}`,
                    formData,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (
                response.data.success
            ) {
                setSuccess(
                    response.data.transaction_id
                        ? `Payment screenshot submitted successfully. OCR extracted Transaction ID: ${response.data.transaction_id}. Your payment is awaiting admin verification.`
                        : "Payment screenshot submitted successfully. Your payment is awaiting admin verification."
                );

                setTimeout(
                    () => {
                        navigate(
                            `/order-success/${createdOrder.id}`
                        );
                    },
                    2000
                );

            } else {
                setError(
                    response.data.message ||
                    "Unable to submit payment screenshot."
                );
            }

        } catch (error) {
            console.error(
                "Payment screenshot submission error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to submit payment screenshot."
            );

        } finally {
            setUploadingPayment(false);
        }
    };

    const formatCurrency = (
        value
    ) => {
        return `₹${Number(
            value || 0
        ).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )}`;
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontFamily: "Arial, sans-serif"
                }}
            >
                <h2>
                    Loading checkout...
                </h2>
            </div>
        );
    }

    const items =
        getItems();

    const subtotal =
        getSubtotal();

    const discount =
        getDiscount();

    const deliveryFee =
        getDeliveryFee();

    const total =
        getTotal();

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f6f8",
                fontFamily: "Arial, sans-serif"
            }}
        >
            <header
                style={{
                    background: "#ffffff",
                    borderBottom: "1px solid #e5e5e5",
                    padding: "16px 30px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap"
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: "25px"
                        }}
                    >
                        Checkout
                    </h1>

                    <p
                        style={{
                            margin: "5px 0 0",
                            color: "#666"
                        }}
                    >
                        Complete your order
                    </p>
                </div>

                <Link
                    to="/cart"
                    style={{
                        textDecoration: "none",
                        color: "#000",
                        fontWeight: "600"
                    }}
                >
                    ← Back to Cart
                </Link>
            </header>

            <main
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "30px",
                    display: "grid",
                    gridTemplateColumns:
                        "minmax(0, 1.5fr) minmax(300px, 0.8fr)",
                    gap: "25px"
                }}
            >
                <div>
                    {error && (
                        <div
                            style={{
                                padding: "14px",
                                marginBottom: "20px",
                                background: "#f8d7da",
                                border: "1px solid #f1b0b7",
                                borderRadius: "8px",
                                color: "#842029"
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            style={{
                                padding: "14px",
                                marginBottom: "20px",
                                background: "#d1e7dd",
                                border: "1px solid #a3cfbb",
                                borderRadius: "8px",
                                color: "#0f5132"
                            }}
                        >
                            {success}
                        </div>
                    )}

                    <section
                        style={{
                            background: "#ffffff",
                            border: "1px solid #e5e5e5",
                            borderRadius: "14px",
                            padding: "25px",
                            marginBottom: "20px"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "15px",
                                flexWrap: "wrap"
                            }}
                        >
                            <h2 style={{ margin: 0 }}>
                                Delivery Address
                            </h2>

                            <Link
                                to="/addresses"
                                style={{
                                    textDecoration: "none",
                                    fontWeight: "600"
                                }}
                            >
                                Manage Addresses
                            </Link>
                        </div>

                        {addresses.length === 0 ? (
                            <div
                                style={{
                                    marginTop: "20px",
                                    padding: "20px",
                                    border: "1px dashed #bbb",
                                    borderRadius: "10px",
                                    textAlign: "center"
                                }}
                            >
                                <p>
                                    You don't have a
                                    delivery address yet.
                                </p>

                                <Link
                                    to="/addresses"
                                    style={{
                                        display: "inline-block",
                                        padding: "11px 18px",
                                        background: "#000",
                                        color: "#fff",
                                        borderRadius: "8px",
                                        textDecoration: "none"
                                    }}
                                >
                                    Add Address
                                </Link>
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: "20px",
                                    display: "grid",
                                    gap: "12px"
                                }}
                            >
                                {addresses.map(
                                    (address) => (
                                        <label
                                            key={address.id}
                                            style={{
                                                display: "block",
                                                border:
                                                    selectedAddress ===
                                                    String(address.id)
                                                        ? "2px solid #000"
                                                        : "1px solid #ddd",
                                                borderRadius: "10px",
                                                padding: "16px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "10px",
                                                    alignItems: "flex-start"
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="address"
                                                    value={address.id}
                                                    checked={
                                                        selectedAddress ===
                                                        String(address.id)
                                                    }
                                                    onChange={() =>
                                                        setSelectedAddress(
                                                            String(
                                                                address.id
                                                            )
                                                        )
                                                    }
                                                />

                                                <div>
                                                    <strong>
                                                        {
                                                            address.full_name
                                                        }
                                                    </strong>

                                                    <div
                                                        style={{
                                                            marginTop: "5px",
                                                            color: "#555",
                                                            lineHeight: "1.5"
                                                        }}
                                                    >
                                                        {address.phone}
                                                        <br />

                                                        {
                                                            address.address_line1
                                                        }

                                                        {address.address_line2 && (
                                                            <>
                                                                <br />
                                                                {
                                                                    address.address_line2
                                                                }
                                                            </>
                                                        )}

                                                        <br />

                                                        {
                                                            address.city
                                                        }
                                                        ,{" "}
                                                        {
                                                            address.state
                                                        }{" "}
                                                        -{" "}
                                                        {
                                                            address.postal_code
                                                        }

                                                        <br />

                                                        {
                                                            address.country
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    )
                                )}
                            </div>
                        )}
                    </section>

                    <section
                        style={{
                            background: "#ffffff",
                            border: "1px solid #e5e5e5",
                            borderRadius: "14px",
                            padding: "25px",
                            marginBottom: "20px"
                        }}
                    >
                        <h2>
                            Payment Method
                        </h2>

                        {paymentSettings?.cod_enabled && (
                            <PaymentOption
                                value="COD"
                                selected={
                                    selectedPaymentMethod
                                }
                                onChange={
                                    setSelectedPaymentMethod
                                }
                                title="Cash on Delivery"
                                description="Pay when your order is delivered."
                            />
                        )}

                        {paymentSettings?.upi_id_enabled && (
                            <PaymentOption
                                value="UPI"
                                selected={
                                    selectedPaymentMethod
                                }
                                onChange={
                                    setSelectedPaymentMethod
                                }
                                title="UPI ID"
                                description={
                                    paymentSettings.upi_id
                                        ? `Pay to ${paymentSettings.upi_id}`
                                        : "Pay using UPI."
                                }
                            />
                        )}

                        {paymentSettings?.qr_enabled && (
                            <PaymentOption
                                value="QR"
                                selected={
                                    selectedPaymentMethod
                                }
                                onChange={
                                    setSelectedPaymentMethod
                                }
                                title="Scan QR Code"
                                description="Scan a QR code containing your exact order amount."
                            />
                        )}

                        {paymentSettings?.bank_transfer_enabled && (
                            <PaymentOption
                                value="BANK_TRANSFER"
                                selected={
                                    selectedPaymentMethod
                                }
                                onChange={
                                    setSelectedPaymentMethod
                                }
                                title="Bank Transfer"
                                description="Transfer the amount directly to our bank account."
                            />
                        )}

                        {!paymentSettings?.cod_enabled &&
                            !paymentSettings?.upi_id_enabled &&
                            !paymentSettings?.qr_enabled &&
                            !paymentSettings?.bank_transfer_enabled && (
                                <div
                                    style={{
                                        padding: "15px",
                                        marginTop: "15px",
                                        background: "#fff3cd",
                                        border: "1px solid #ffecb5",
                                        borderRadius: "8px",
                                        color: "#664d03"
                                    }}
                                >
                                    No payment methods are
                                    currently available.
                                    Please contact the store.
                                </div>
                            )}
                    </section>

                    {createdOrder && (
                        <section
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e5e5e5",
                                borderRadius: "14px",
                                padding: "25px",
                                marginBottom: "20px"
                            }}
                        >
                            <h2>
                                Complete Payment
                            </h2>

                            <p
                                style={{
                                    color: "#555"
                                }}
                            >
                                Order #
                                <strong>
                                    {createdOrder.id}
                                </strong>
                            </p>

                            <div
                                style={{
                                    padding: "15px",
                                    background: "#f5f6f8",
                                    borderRadius: "10px",
                                    marginTop: "15px"
                                }}
                            >
                                <strong>
                                    Amount to Pay:
                                </strong>

                                <span
                                    style={{
                                        fontSize: "22px",
                                        fontWeight: "700",
                                        marginLeft: "10px"
                                    }}
                                >
                                    {formatCurrency(
                                        createdOrder.total_amount
                                    )}
                                </span>
                            </div>

                            {selectedPaymentMethod ===
                                "UPI" && (
                                <div
                                    style={{
                                        marginTop: "20px"
                                    }}
                                >
                                    <h3>
                                        UPI Payment
                                    </h3>

                                    <p>
                                        Send exactly{" "}
                                        <strong>
                                            {formatCurrency(
                                                createdOrder.total_amount
                                            )}
                                        </strong>{" "}
                                        to:
                                    </p>

                                    <div
                                        style={{
                                            padding: "15px",
                                            background: "#f5f6f8",
                                            borderRadius: "8px",
                                            fontSize: "18px",
                                            fontWeight: "700"
                                        }}
                                    >
                                        {
                                            paymentSettings?.upi_id ||
                                            "UPI ID not configured"
                                        }
                                    </div>
                                </div>
                            )}

                            {selectedPaymentMethod ===
                                "QR" && (
                                <div
                                    style={{
                                        marginTop: "20px",
                                        textAlign: "center"
                                    }}
                                >
                                    <h3>
                                        Scan & Pay
                                    </h3>

                                    <p>
                                        Scan this QR code
                                        and pay exactly{" "}
                                        <strong>
                                            {formatCurrency(
                                                createdOrder.total_amount
                                            )}
                                        </strong>
                                    </p>

                                    {getUpiQrValue() ? (
                                        <div
                                            style={{
                                                display: "inline-block",
                                                background: "#ffffff",
                                                padding: "18px",
                                                border: "1px solid #ddd",
                                                borderRadius: "10px"
                                            }}
                                        >
                                            <QRCodeSVG
                                                value={
                                                    getUpiQrValue()
                                                }
                                                size={250}
                                                level="M"
                                            />
                                        </div>
                                    ) : (
                                        <p
                                            style={{
                                                color: "#842029"
                                            }}
                                        >
                                            UPI ID has not been
                                            configured by the
                                            administrator.
                                        </p>
                                    )}

                                    {paymentSettings?.qr_merchant_name && (
                                        <p
                                            style={{
                                                color: "#666"
                                            }}
                                        >
                                            {
                                                paymentSettings.qr_merchant_name
                                            }
                                        </p>
                                    )}
                                </div>
                            )}

                            {selectedPaymentMethod ===
                                "BANK_TRANSFER" && (
                                <div
                                    style={{
                                        marginTop: "20px"
                                    }}
                                >
                                    <h3>
                                        Bank Transfer
                                    </h3>

                                    <BankDetail
                                        label="Account Holder"
                                        value={
                                            paymentSettings?.account_name
                                        }
                                    />

                                    <BankDetail
                                        label="Bank Name"
                                        value={
                                            paymentSettings?.bank_name
                                        }
                                    />

                                    <BankDetail
                                        label="Account Number"
                                        value={
                                            paymentSettings?.account_number
                                        }
                                    />

                                    <BankDetail
                                        label="IFSC Code"
                                        value={
                                            paymentSettings?.ifsc_code
                                        }
                                    />
                                </div>
                            )}

                            {selectedPaymentMethod !==
                                "COD" && (
                                <div
                                    style={{
                                        marginTop: "25px",
                                        paddingTop: "20px",
                                        borderTop: "1px solid #eee"
                                    }}
                                >
                                    <h3>
                                        Payment Confirmation
                                    </h3>

                                    <p
                                        style={{
                                            color: "#555",
                                            fontSize: "14px",
                                            lineHeight: "1.6"
                                        }}
                                    >
                                        Complete your payment
                                        using the selected
                                        payment method.
                                    </p>

                                    <div
                                        style={{
                                            padding: "15px",
                                            marginTop: "15px",
                                            background: "#fff3cd",
                                            border: "1px solid #ffecb5",
                                            borderRadius: "8px",
                                            color: "#664d03"
                                        }}
                                    >
                                        <strong>
                                            Important:
                                        </strong>

                                        <div
                                            style={{
                                                marginTop: "6px"
                                            }}
                                        >
                                            After completing your
                                            payment, upload a clear
                                            screenshot of the
                                            successful payment.
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "6px"
                                            }}
                                        >
                                            The system will use OCR
                                            to automatically extract
                                            your Transaction ID /
                                            UTR ID from the
                                            screenshot.
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "6px"
                                            }}
                                        >
                                            You do not need to
                                            manually enter the
                                            Transaction ID / UTR ID.
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "25px"
                                        }}
                                    >
                                        <h3>
                                            Payment Screenshot
                                            <span
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    color: "#b42318",
                                                    marginLeft: "8px"
                                                }}
                                            >
                                                (Required)
                                            </span>
                                        </h3>

                                        <p
                                            style={{
                                                color: "#666",
                                                fontSize: "14px",
                                                lineHeight: "1.5"
                                            }}
                                        >
                                            Upload a clear
                                            screenshot showing
                                            the successful payment.
                                            The OCR system will
                                            automatically attempt
                                            to extract the
                                            Transaction ID / UTR
                                            ID.
                                        </p>

                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={
                                                handleScreenshotChange
                                            }
                                        />

                                        {screenshotFile && (
                                            <div
                                                style={{
                                                    marginTop: "12px",
                                                    padding: "12px",
                                                    background: "#e8f7ed",
                                                    border: "1px solid #b9e4c7",
                                                    borderRadius: "8px",
                                                    color: "#1f7a3f"
                                                }}
                                            >
                                                <strong>
                                                    Screenshot selected:
                                                </strong>

                                                <div
                                                    style={{
                                                        marginTop: "5px"
                                                    }}
                                                >
                                                    {
                                                        screenshotFile.name
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            submitManualPayment
                                        }
                                        disabled={
                                            uploadingPayment ||
                                            !screenshotFile
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "20px",
                                            padding: "14px",
                                            border: "none",
                                            borderRadius: "8px",
                                            background:
                                                uploadingPayment ||
                                                !screenshotFile
                                                    ? "#999"
                                                    : "#000",
                                            color: "#fff",
                                            cursor:
                                                uploadingPayment ||
                                                !screenshotFile
                                                    ? "not-allowed"
                                                    : "pointer",
                                            fontWeight: "700",
                                            fontSize: "16px"
                                        }}
                                    >
                                        {uploadingPayment
                                            ? "Processing Screenshot..."
                                            : "Submit Payment Screenshot"}
                                    </button>

                                    <p
                                        style={{
                                            marginTop: "12px",
                                            fontSize: "13px",
                                            color: "#666",
                                            textAlign: "center"
                                        }}
                                    >
                                        OCR will extract the
                                        Transaction ID / UTR ID
                                        automatically. Your payment
                                        will remain pending until an
                                        admin verifies it.
                                    </p>
                                </div>
                            )}
                        </section>
                    )}

                    {!createdOrder && (
                        <section
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e5e5e5",
                                borderRadius: "14px",
                                padding: "25px"
                            }}
                        >
                            <h2>
                                Coupon
                            </h2>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    marginTop: "15px"
                                }}
                            >
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(event) =>
                                        setCouponCode(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter coupon code"
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        border: "1px solid #ccc",
                                        borderRadius: "8px"
                                    }}
                                />

                                {!appliedCoupon ? (
                                    <button
                                        type="button"
                                        onClick={
                                            applyCoupon
                                        }
                                        style={{
                                            padding: "12px 18px",
                                            border: "none",
                                            borderRadius: "8px",
                                            background: "#000",
                                            color: "#fff",
                                            cursor: "pointer",
                                            fontWeight: "600"
                                        }}
                                    >
                                        Apply
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={
                                            removeCoupon
                                        }
                                        style={{
                                            padding: "12px 18px",
                                            border: "1px solid #ccc",
                                            borderRadius: "8px",
                                            background: "#fff",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            {appliedCoupon && (
                                <p
                                    style={{
                                        color: "#0f5132"
                                    }}
                                >
                                    Coupon{" "}
                                    <strong>
                                        {
                                            appliedCoupon.code
                                        }
                                    </strong>{" "}
                                    will be validated during
                                    order creation.
                                </p>
                            )}
                        </section>
                    )}
                </div>

                <aside
                    style={{
                        background: "#ffffff",
                        border: "1px solid #e5e5e5",
                        borderRadius: "14px",
                        padding: "25px",
                        height: "fit-content",
                        position: "sticky",
                        top: "20px"
                    }}
                >
                    <h2>
                        Order Summary
                    </h2>

                    <div
                        style={{
                            marginTop: "20px"
                        }}
                    >
                        {items.map(
                            (item) => {
                                const price =
                                    item.discount_price !==
                                        null &&
                                    item.discount_price !==
                                        undefined
                                        ? Number(
                                            item.discount_price
                                        )
                                        : Number(
                                            item.price || 0
                                        );

                                return (
                                    <div
                                        key={
                                            item.product_id ||
                                            item.id
                                        }
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            gap: "10px",
                                            padding: "10px 0",
                                            borderBottom:
                                                "1px solid #eee"
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "600"
                                                }}
                                            >
                                                {item.name}
                                            </div>

                                            <small
                                                style={{
                                                    color: "#666"
                                                }}
                                            >
                                                Qty:{" "}
                                                {
                                                    item.quantity
                                                }
                                            </small>
                                        </div>

                                        <strong>
                                            {formatCurrency(
                                                price *
                                                Number(
                                                    item.quantity ||
                                                    0
                                                )
                                            )}
                                        </strong>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    <div
                        style={{
                            marginTop: "20px"
                        }}
                    >
                        <SummaryRow
                            label="Subtotal"
                            value={formatCurrency(
                                subtotal
                            )}
                        />

                        <SummaryRow
                            label="Discount"
                            value={`-${formatCurrency(
                                discount
                            )}`}
                        />

                        <SummaryRow
                            label="Delivery"
                            value={
                                deliveryFee === 0
                                    ? "FREE"
                                    : formatCurrency(
                                        deliveryFee
                                    )
                            }
                        />

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                marginTop: "18px",
                                paddingTop: "18px",
                                borderTop: "2px solid #222",
                                fontSize: "20px",
                                fontWeight: "700"
                            }}
                        >
                            <span>
                                Total
                            </span>

                            <span>
                                {formatCurrency(
                                    total
                                )}
                            </span>
                        </div>
                    </div>

                    {!createdOrder && (
                        <button
                            type="button"
                            onClick={
                                handlePlaceOrder
                            }
                            disabled={
                                placingOrder ||
                                addresses.length === 0 ||
                                items.length === 0 ||
                                !selectedPaymentMethod
                            }
                            style={{
                                width: "100%",
                                marginTop: "25px",
                                padding: "15px",
                                border: "none",
                                borderRadius: "10px",
                                background:
                                    placingOrder
                                        ? "#777"
                                        : "#000",
                                color: "#fff",
                                cursor:
                                    placingOrder
                                        ? "not-allowed"
                                        : "pointer",
                                fontWeight: "700",
                                fontSize: "16px"
                            }}
                        >
                            {placingOrder
                                ? "Creating Order..."
                                : selectedPaymentMethod ===
                                    "COD"
                                    ? `Place COD Order • ${formatCurrency(
                                        total
                                    )}`
                                    : `Create Order • ${formatCurrency(
                                        total
                                    )}`}
                        </button>
                    )}

                    {createdOrder && (
                        <div
                            style={{
                                marginTop: "20px",
                                padding: "15px",
                                background: "#e8f7ed",
                                border: "1px solid #b9e4c7",
                                borderRadius: "8px",
                                color: "#1f7a3f"
                            }}
                        >
                            Order #
                            <strong>
                                {createdOrder.id}
                            </strong>{" "}
                            created.

                            <div
                                style={{
                                    marginTop: "8px"
                                }}
                            >
                                Complete the payment and
                                upload your payment screenshot
                                above.
                            </div>
                        </div>
                    )}

                    {addresses.length === 0 && (
                        <p
                            style={{
                                color: "#842029",
                                fontSize: "13px",
                                marginTop: "10px",
                                textAlign: "center"
                            }}
                        >
                            Add a delivery address before
                            placing an order.
                        </p>
                    )}
                </aside>
            </main>
        </div>
    );
}

function PaymentOption({
    value,
    selected,
    onChange,
    title,
    description
}) {
    return (
        <label
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "15px",
                marginTop: "12px",
                border:
                    selected === value
                        ? "2px solid #000"
                        : "1px solid #ddd",
                borderRadius: "10px",
                cursor: "pointer"
            }}
        >
            <input
                type="radio"
                name="payment"
                value={value}
                checked={
                    selected === value
                }
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
            />

            <div>
                <strong>
                    {title}
                </strong>

                <div
                    style={{
                        color: "#666",
                        fontSize: "14px",
                        marginTop: "4px"
                    }}
                >
                    {description}
                </div>
            </div>
        </label>
    );
}

function BankDetail({
    label,
    value
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
                padding: "12px 0",
                borderBottom: "1px solid #eee"
            }}
        >
            <strong>
                {label}
            </strong>

            <span>
                {value || "Not configured"}
            </span>
        </div>
    );
}

function SummaryRow({
    label,
    value
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
                marginBottom: "10px",
                color: "#555"
            }}
        >
            <span>
                {label}
            </span>

            <span>
                {value}
            </span>
        </div>
    );
}

export default Checkout;