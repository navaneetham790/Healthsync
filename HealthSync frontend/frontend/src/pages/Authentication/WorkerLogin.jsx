import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { notify } from "../../components/ToastProvider";

import logo from "../../assets/images/logo.jpeg";
import workerImage from "../../assets/images/loginportal.jpeg";

function WorkerLogin() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        worker: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const workerInput = formData.worker.trim().toLowerCase();
        const passwordInput = formData.password.trim();

        if (
            (workerInput === "717824f108@gmail.com" || workerInput === "bavana@gmail.com" || workerInput === "mw001" || workerInput === "worker001" || workerInput === "worker@healthsync.com") &&
            (passwordInput === "workerbavana" || passwordInput === "worker123")
        ) {
            const localRegistry = JSON.parse(localStorage.getItem("healthsync_registered_workers") || "{}");
            const registered = localRegistry["MW001"] || localRegistry["717824f108@gmail.com"] || {};

            const userObj = {
                id: 15,
                email: "717824f108@gmail.com",
                fullName: "Bavana",
                workerCode: "MW001",
                role: "worker",
                phone: "9876543210",
                age: 25,
                riskLevel: "LOW",
                healthHistory: "Viral fever treated with Paracetamol",
                address: "Viral fever treated with Paracetamol",
                diseases: "Acute Upper Respiratory Tract Infection",
                ...registered
            };
            const token = "worker-token-" + Date.now();
            localStorage.setItem("user", JSON.stringify(userObj));
            localStorage.setItem("role", "worker");
            localStorage.setItem("token", token);
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            notify.success("Login Successful");
            navigate("/worker/dashboard");
            return;
        }

        try {
            const res = await axios.post("/api/auth/login", { email: formData.worker, password: formData.password });
            const data = res.data;
            if (data.token) localStorage.setItem("token", data.token);
            if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("role", "worker");
            notify.success("Login Successful");
            navigate("/worker/dashboard");
        } catch (_) {
            notify.error("Invalid Worker ID / Email or Password");
        }
    };

    return (
        <div className="worker-login">
            <div className="login-left">
                <button
                    className="back-btn"
                    onClick={() => navigate("/login")}
                >
                    <FaArrowLeft />
                </button>

                <div className="logo-section">

                    <img
                        src={logo}
                        alt="HealthSync"
                    />

                    <div>

                        <h1>HealthSync</h1>

                        <p>Healthy Records, Stronger Lives</p>

                    </div>

                </div>

                <div className="login-card">

                    <h2>WORKER LOGIN</h2>

                    <form onSubmit={handleSubmit}>

                        <label>Worker ID / Email</label>

                        <input
                            type="text"
                            name="worker"
                            placeholder="Enter Worker ID or Email"
                            value={formData.worker}
                            onChange={handleChange}
                            required
                        />

                        <label>Password</label>

                        <div className="password-box">

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />

                            <span
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                            >

                                {
                                    showPassword ?

                                        <FaEyeSlash />

                                        :

                                        <FaEye />

                                }

                            </span>

                        </div>

                        <button
                            className="login-btn"
                            type="submit"
                        >
                            Login
                        </button>

                    </form>

                    <div className="demo-login">

                        <h4>Demo Credentials</h4>

                        <p>

                            <strong>Worker ID :</strong>

                            WORKER001

                        </p>

                        <p>

                            <strong>Email :</strong>

                            worker@healthsync.com

                        </p>

                        <p>

                            <strong>Password :</strong>

                            worker123

                        </p>

                    </div>

                    <p

                        className="forgot-password"

                        onClick={() =>
                            navigate("/worker-forgot-password")
                        }

                    >

                        Forgot Password?

                    </p>

                </div>

            </div>

            {/* RIGHT */}

            <div className="login-right">

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

export default WorkerLogin;
