import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notify } from "../../components/ToastProvider";
import { FaArrowLeft } from "react-icons/fa";
import AuthService from "../../services/AuthService";

import logo from "../../assets/images/logo.jpeg";
import workerImage from "../../assets/images/loginportal.jpeg";

function WorkerForgotPassword() {
    const navigate = useNavigate();
    const [input, setInput] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (input.includes("@")) {
            try {
                await AuthService.forgotPassword(input);
                notify.success("Password Reset Link Sent to your Email!");
                navigate("/worker-login");
            } catch (error) {
                notify.error(error.response?.data?.message || "Email address not registered. Please try again.");
            }
        } else {
            notify.success("OTP Sent to your Registered Mobile Number!");
            navigate("/worker-login");
        }
    };

    return (
        <div className="worker-forgot-page">
            {/* LEFT */}
            <div className="forgot-left">
                <button
                    className="back-btn"
                    onClick={() => navigate("/worker-login")}
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
                    <h2>WORKER FORGOT PASSWORD</h2>
                    <p className="description">
                        Enter your Worker ID or Registered Email.
                        <br />
                        If Email is unavailable, OTP will be sent to your registered mobile number.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label>Worker ID / Email</label>
                        <input
                            type="text"
                            placeholder="Enter Worker ID or Email"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            required
                        />
                        <button
                            className="reset-btn"
                            type="submit"
                        >
                            Continue
                        </button>
                    </form>

                    <div className="demo-box">
                        <h4>Demo</h4>
                        <p>Email → Reset Link</p>
                        <p>Worker ID → Mobile OTP</p>
                    </div>
                    <p
                        className="back-login"
                        onClick={() => navigate("/worker-login")}
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
                        src={workerImage}
                        alt="Worker"
                    />
                </div>
            </div>
        </div>
    );
}

export default WorkerForgotPassword;
