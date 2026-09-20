import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "../../components/ToastProvider";
import { FaArrowLeft } from "react-icons/fa";
import AuthService from "../../services/AuthService";

import logo from "../../assets/images/logo.jpeg";
import forgotImage from "../../assets/images/loginportal.jpeg";

function AdminForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await AuthService.forgotPassword(email);
            notify.success("Password Reset Link Sent Successfully!");
            navigate("/admin-login");
        } catch (error) {
            notify.error(error.response?.data?.message || "Email address not registered. Please try again.");
        }
    };

    return (
        <div className="forgot-page">
            {/* LEFT */}
            <div className="forgot-left">
                <button
                    className="back-btn"
                    onClick={() => navigate("/admin-login")}
                >
                    <FaArrowLeft />
                </button>

                <div className="logo-section">
                    <img src={logo} alt="logo" />
                    <div>
                        <h1>HealthSync</h1>
                        <p>Healthy Records, Stronger Lives</p>
                    </div>
                </div>

                <div className="forgot-card">
                    <h2>Forgot Password?</h2>
                    <p className="description">
                        Enter your registered email address and
                        we'll send you a password reset link.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter Registered Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <button
                            className="reset-btn"
                            type="submit"
                        >
                            Send Reset Link
                        </button>
                    </form>

                    <p
                        className="back-login"
                        onClick={() => navigate("/admin-login")}
                    >
                        Back to Login
                    </p>
                </div>
            </div>

            {/* RIGHT */}
            <div className="forgot-right">
                <div className="circle"></div>
                <div className="image-card">
                    <img
                        src={forgotImage}
                        alt="Forgot Password"
                    />
                </div>
            </div>
        </div>
    );
}

export default AdminForgotPassword;
