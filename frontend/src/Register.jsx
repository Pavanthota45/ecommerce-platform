import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!formData.name || !formData.email || !formData.password) {
            setError("Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                formData
            );

            setMessage(response.data.message);

            setFormData({
                name: "",
                email: "",
                password: "",
                phone: ""
            });

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>

            <div style={styles.card}>

                <h1 style={styles.title}>
                    Create Account
                </h1>

                <p style={styles.subtitle}>
                    Join our e-commerce platform
                </p>

                {message && (
                    <div style={styles.success}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label style={styles.label}>
                        Full Name
                    </label>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                        style={styles.input}
                    />

                    <label style={styles.label}>
                        Email
                    </label>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}
                    />

                    <label style={styles.label}>
                        Password
                    </label>

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                    />

                    <label style={styles.label}>
                        Phone
                    </label>

                    <input
                        type="tel"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={handleChange}
                        style={styles.input}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </button>

                </form>

                <p style={styles.loginText}>
                    Already have an account?{" "}
                    <Link to="/login" style={styles.link}>
                        Login
                    </Link>
                </p>

            </div>

        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f4f6f8",
        padding: "20px"
    },

    card: {
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#ffffff",
        padding: "35px",
        borderRadius: "12px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.1)"
    },

    title: {
        textAlign: "center",
        marginBottom: "8px"
    },

    subtitle: {
        textAlign: "center",
        color: "#666",
        marginBottom: "25px"
    },

    label: {
        display: "block",
        marginBottom: "6px",
        fontWeight: "600"
    },

    input: {
        width: "100%",
        padding: "12px",
        marginBottom: "18px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        boxSizing: "border-box",
        fontSize: "15px"
    },

    button: {
        width: "100%",
        padding: "13px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer"
    },

    success: {
        backgroundColor: "#dcfce7",
        color: "#166534",
        padding: "10px",
        borderRadius: "6px",
        marginBottom: "15px"
    },

    error: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        padding: "10px",
        borderRadius: "6px",
        marginBottom: "15px"
    },

    loginText: {
        textAlign: "center",
        marginTop: "20px"
    },

    link: {
        color: "#2563eb",
        textDecoration: "none",
        fontWeight: "600"
    }
};

export default Register;