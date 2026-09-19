import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
        phone: ""
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const getToken = () => {
        return localStorage.getItem("token");
    };

    const getAuthHeaders = () => {
        const token = getToken();

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            const token = getToken();

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${API_URL}/auth/profile`,
                getAuthHeaders()
            );

            if (!response.data.success) {
                setError(
                    response.data.message ||
                    "Failed to load profile."
                );
                return;
            }

            const profile = response.data.user;

            setUser(profile);

            setProfileForm({
                name: profile.name || "",
                email: profile.email || "",
                phone: profile.phone || ""
            });

            const storedUser = localStorage.getItem("user");

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);

                    localStorage.setItem(
                        "user",
                        JSON.stringify({
                            ...parsedUser,
                            id: profile.id,
                            name: profile.name,
                            email: profile.email,
                            phone: profile.phone,
                            role: profile.role
                        })
                    );
                } catch (storageError) {
                    console.error(
                        "Local storage parsing error:",
                        storageError
                    );
                }
            }
        } catch (error) {
            console.error(
                "Load profile error:",
                error
            );

            if (
                error.response &&
                (
                    error.response.status === 401 ||
                    error.response.status === 403
                )
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to load profile."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleProfileChange = (event) => {
        const { name, value } = event.target;

        setProfileForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage("");
        setError("");
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;

        setPasswordForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setMessage("");
        setError("");
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const name = profileForm.name.trim();
        const email = profileForm.email.trim().toLowerCase();
        const phone = profileForm.phone.trim();

        if (!name) {
            setError("Name is required.");
            return;
        }

        if (name.length < 2) {
            setError(
                "Name must contain at least 2 characters."
            );
            return;
        }

        if (!email) {
            setError("Email is required.");
            return;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            setError(
                "Please enter a valid email address."
            );
            return;
        }

        if (phone) {
            const phonePattern = /^[0-9+\-\s()]{7,20}$/;

            if (!phonePattern.test(phone)) {
                setError(
                    "Please enter a valid phone number."
                );
                return;
            }
        }

        try {
            setSavingProfile(true);

            const token = getToken();

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.put(
                `${API_URL}/auth/profile`,
                {
                    name,
                    email,
                    phone
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.data.success) {
                setError(
                    response.data.message ||
                    "Failed to update profile."
                );
                return;
            }

            const updatedUser = response.data.user;

            setUser(updatedUser);

            setProfileForm({
                name: updatedUser.name || "",
                email: updatedUser.email || "",
                phone: updatedUser.phone || ""
            });

            if (response.data.token) {
                localStorage.setItem(
                    "token",
                    response.data.token
                );
            }

            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone,
                    role: updatedUser.role
                })
            );

            setMessage(
                "Profile updated successfully."
            );
        } catch (error) {
            console.error(
                "Update profile error:",
                error
            );

            if (
                error.response &&
                (
                    error.response.status === 401 ||
                    error.response.status === 403
                )
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to update profile."
            );
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        const currentPassword =
            passwordForm.currentPassword;

        const newPassword =
            passwordForm.newPassword;

        const confirmPassword =
            passwordForm.confirmPassword;

        if (!currentPassword) {
            setError(
                "Enter your current password."
            );
            return;
        }

        if (!newPassword) {
            setError(
                "Enter a new password."
            );
            return;
        }

        if (newPassword.length < 6) {
            setError(
                "New password must contain at least 6 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(
                "New passwords do not match."
            );
            return;
        }

        if (currentPassword === newPassword) {
            setError(
                "New password must be different from the current password."
            );
            return;
        }

        try {
            setChangingPassword(true);

            const token = getToken();

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.put(
                `${API_URL}/auth/change-password`,
                {
                    currentPassword,
                    newPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.data.success) {
                setError(
                    response.data.message ||
                    "Failed to change password."
                );
                return;
            }

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            setMessage(
                response.data.message ||
                "Password changed successfully."
            );
        } catch (error) {
            console.error(
                "Change password error:",
                error
            );

            if (
                error.response &&
                (
                    error.response.status === 401 ||
                    error.response.status === 403
                )
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Failed to change password."
            );
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    const formatJoinedDate = (dateValue) => {
        if (!dateValue) {
            return "N/A";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "N/A";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#f5f7fb",
                    fontSize: "20px",
                    color: "#374151"
                }}
            >
                Loading profile...
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                fontFamily:
                    "Arial, Helvetica, sans-serif"
            }}
        >
            {/* HEADER */}
            <header
                style={{
                    background: "#111827",
                    color: "#ffffff",
                    padding: "15px 30px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px"
                }}
            >
                <h2
                    style={{
                        margin: 0
                    }}
                >
                    E-Commerce Store
                </h2>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        onClick={() =>
                            navigate("/home")
                        }
                        style={headerButtonStyle}
                    >
                        Home
                    </button>

                    <button
                        onClick={() =>
                            navigate("/orders")
                        }
                        style={headerButtonStyle}
                    >
                        My Orders
                    </button>

                    <button
                        onClick={() =>
                            navigate("/addresses")
                        }
                        style={headerButtonStyle}
                    >
                        Addresses
                    </button>

                    <button
                        onClick={() =>
                            navigate("/wishlist")
                        }
                        style={headerButtonStyle}
                    >
                        Wishlist
                    </button>

                    <button
                        onClick={() =>
                            navigate("/notifications")
                        }
                        style={headerButtonStyle}
                    >
                        Notifications
                    </button>

                    <button
                        onClick={() =>
                            navigate("/cart")
                        }
                        style={headerButtonStyle}
                    >
                        Cart
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            ...headerButtonStyle,
                            background: "#dc2626"
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* MAIN */}
            <main
                style={{
                    maxWidth: "1000px",
                    margin: "0 auto",
                    padding: "30px 20px"
                }}
            >
                <h1
                    style={{
                        marginTop: 0,
                        marginBottom: "8px",
                        color: "#111827"
                    }}
                >
                    My Profile
                </h1>

                <p
                    style={{
                        color: "#6b7280",
                        marginTop: 0,
                        marginBottom: "25px"
                    }}
                >
                    Manage your account information
                    and password.
                </p>

                {/* MESSAGES */}
                {message && (
                    <div
                        style={{
                            background: "#dcfce7",
                            color: "#166534",
                            border:
                                "1px solid #86efac",
                            padding: "12px 15px",
                            borderRadius: "8px",
                            marginBottom: "20px"
                        }}
                    >
                        ✓ {message}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            border:
                                "1px solid #fca5a5",
                            padding: "12px 15px",
                            borderRadius: "8px",
                            marginBottom: "20px"
                        }}
                    >
                        ⚠ {error}
                    </div>
                )}

                {/* ACCOUNT INFORMATION */}
                <section style={sectionStyle}>
                    <h2
                        style={{
                            marginTop: 0,
                            color: "#111827"
                        }}
                    >
                        Account Information
                    </h2>

                    {user && (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "15px",
                                marginBottom: "30px"
                            }}
                        >
                            <div
                                style={
                                    informationBoxStyle
                                }
                            >
                                <strong>
                                    Account ID
                                </strong>

                                <span>
                                    #{user.id}
                                </span>
                            </div>

                            <div
                                style={
                                    informationBoxStyle
                                }
                            >
                                <strong>
                                    Email
                                </strong>

                                <span
                                    style={{
                                        wordBreak:
                                            "break-word"
                                    }}
                                >
                                    {user.email}
                                </span>
                            </div>

                            <div
                                style={
                                    informationBoxStyle
                                }
                            >
                                <strong>
                                    Account Type
                                </strong>

                                <span
                                    style={{
                                        textTransform:
                                            "capitalize"
                                    }}
                                >
                                    {user.role}
                                </span>
                            </div>

                            <div
                                style={
                                    informationBoxStyle
                                }
                            >
                                <strong>
                                    Joined
                                </strong>

                                <span>
                                    {formatJoinedDate(
                                        user.created_at
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    <h3
                        style={{
                            color: "#111827"
                        }}
                    >
                        Edit Profile
                    </h3>

                    <form
                        onSubmit={
                            handleProfileSubmit
                        }
                    >
                        <div
                            style={
                                formGroupStyle
                            }
                        >
                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={
                                    profileForm.name
                                }
                                onChange={
                                    handleProfileChange
                                }
                                placeholder="Enter your name"
                                style={
                                    inputStyle
                                }
                            />
                        </div>

                        <div
                            style={
                                formGroupStyle
                            }
                        >
                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={
                                    profileForm.email
                                }
                                onChange={
                                    handleProfileChange
                                }
                                placeholder="Enter your email"
                                style={
                                    inputStyle
                                }
                            />

                            <small
                                style={{
                                    color: "#6b7280"
                                }}
                            >
                                Changing your email may
                                generate a new login
                                token.
                            </small>
                        </div>

                        <div
                            style={
                                formGroupStyle
                            }
                        >
                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Phone
                            </label>

                            <input
                                type="tel"
                                name="phone"
                                value={
                                    profileForm.phone
                                }
                                onChange={
                                    handleProfileChange
                                }
                                placeholder="Enter phone number"
                                style={
                                    inputStyle
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={
                                savingProfile
                            }
                            style={{
                                ...primaryButtonStyle,
                                opacity:
                                    savingProfile
                                        ? 0.7
                                        : 1,
                                cursor:
                                    savingProfile
                                        ? "not-allowed"
                                        : "pointer"
                            }}
                        >
                            {savingProfile
                                ? "Saving..."
                                : "Save Profile"}
                        </button>
                    </form>
                </section>

                {/* CHANGE PASSWORD */}
                <section style={sectionStyle}>
                    <h2
                        style={{
                            marginTop: 0,
                            color: "#111827"
                        }}
                    >
                        Change Password
                    </h2>

                    <p
                        style={{
                            color: "#6b7280"
                        }}
                    >
                        Update your password to keep
                        your account secure.
                    </p>

                    <form
                        onSubmit={
                            handlePasswordSubmit
                        }
                    >
                        <div
                            style={
                                formGroupStyle
                            }
                        >
                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Current Password
                            </label>

                            <input
                                type="password"
                                name="currentPassword"
                                value={
                                    passwordForm.currentPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                placeholder="Enter current password"
                                style={
                                    inputStyle
                                }
                            />
                        </div>

                        <div
                            style={
                                formGroupStyle
                            }
                        >
                            <label
                                style={
                                    labelStyle
                                }
                            >
                                New Password
                            </label>

                            <input
                                type="password"
                                name="newPassword"
                                value={
                                    passwordForm.newPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                placeholder="Enter new password"
                                style={
                                    inputStyle
                                }
                            />

                            <small
                                style={{
                                    color: "#6b7280"
                                }}
                            >
                                Minimum 6 characters.
                            </small>
                        </div>

                        <div
                            style={
                                formGroupStyle
                            }
                        >
                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Confirm New Password
                            </label>

                            <input
                                type="password"
                                name="confirmPassword"
                                value={
                                    passwordForm.confirmPassword
                                }
                                onChange={
                                    handlePasswordChange
                                }
                                placeholder="Confirm new password"
                                style={
                                    inputStyle
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={
                                changingPassword
                            }
                            style={{
                                ...primaryButtonStyle,
                                opacity:
                                    changingPassword
                                        ? 0.7
                                        : 1,
                                cursor:
                                    changingPassword
                                        ? "not-allowed"
                                        : "pointer"
                            }}
                        >
                            {changingPassword
                                ? "Changing..."
                                : "Change Password"}
                        </button>
                    </form>
                </section>

                {/* QUICK LINKS */}
                <section style={sectionStyle}>
                    <h2
                        style={{
                            marginTop: 0,
                            color: "#111827"
                        }}
                    >
                        Quick Links
                    </h2>

                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px"
                        }}
                    >
                        <button
                            onClick={() =>
                                navigate("/orders")
                            }
                            style={
                                secondaryButtonStyle
                            }
                        >
                            📦 My Orders
                        </button>

                        <button
                            onClick={() =>
                                navigate("/addresses")
                            }
                            style={
                                secondaryButtonStyle
                            }
                        >
                            📍 My Addresses
                        </button>

                        <button
                            onClick={() =>
                                navigate("/wishlist")
                            }
                            style={
                                secondaryButtonStyle
                            }
                        >
                            ❤️ My Wishlist
                        </button>

                        <button
                            onClick={() =>
                                navigate(
                                    "/notifications"
                                )
                            }
                            style={
                                secondaryButtonStyle
                            }
                        >
                            🔔 Notifications
                        </button>

                        <button
                            onClick={() =>
                                navigate("/cart")
                            }
                            style={
                                secondaryButtonStyle
                            }
                        >
                            🛒 My Cart
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}

const headerButtonStyle = {
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    background: "#374151",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px"
};

const sectionStyle = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "25px",
    marginBottom: "25px",
    boxShadow:
        "0 2px 10px rgba(0,0,0,0.06)"
};

const informationBoxStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "15px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    color: "#374151"
};

const formGroupStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "18px"
};

const labelStyle = {
    fontWeight: "600",
    color: "#374151"
};

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    fontSize: "15px",
    outline: "none"
};

const primaryButtonStyle = {
    padding: "11px 20px",
    border: "none",
    borderRadius: "7px",
    background: "#111827",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600"
};

const secondaryButtonStyle = {
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    fontSize: "14px"
};

export default Profile;