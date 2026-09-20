import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { notify } from "../../components/ToastProvider";

import logo from "../../assets/images/logo.jpeg";
import doctorImage from "../../assets/images/loginportal.jpeg";

function DoctorLogin() {

    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        doctor: "",
        password: "",
    });

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value,

        });

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        if (
            (formData.doctor === "DOC001" ||
                formData.doctor === "doctor@healthsync.com") &&
            formData.password === "doctor123"
        ) {

            notify.success("Login Successful");

            navigate("/doctor/dashboard");

        } else {

            notify.error("Invalid Doctor ID / Email or Password");

        }

    };

    return (

        <div className="doctor-login">

            <div className="login-left">

                <button
                    className="back-btn"
                    onClick={() => navigate("/login")}
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

                <div className="login-card">

                    <h2>DOCTOR LOGIN</h2>

                    <form onSubmit={handleSubmit}>

                        <label>Doctor ID / Email</label>

                        <input
                            type="text"
                            name="doctor"
                            placeholder="Enter Doctor ID or Email"
                            value={formData.doctor}
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
                                {showPassword ? (
                                    <FaEyeSlash />
                                ) : (
                                    <FaEye />
                                )}
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
                            <strong>Doctor ID :</strong> DOC001
                        </p>

                        <p>
                            <strong>Email :</strong> doctor@healthsync.com
                        </p>

                        <p>
                            <strong>Password :</strong> doctor123
                        </p>

                    </div>

                    <p
                        className="forgot-password"
                        onClick={() => navigate("/doctor-forgot-password")}
                    >
                        Forgot Password?
                    </p>

                </div>

            </div>

            <div className="login-right">

                <div className="circle"></div>

                <div className="image-card">

                    <img
                        src={doctorImage}
                        alt="doctor"
                    />

                </div>

            </div>

        </div>

    );

}

export default DoctorLogin;
