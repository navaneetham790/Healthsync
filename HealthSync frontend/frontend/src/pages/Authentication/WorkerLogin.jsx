import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
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

    const handleSubmit = (e) => {

        e.preventDefault();

        if (

            (
                formData.worker === "WORKER001" ||

                formData.worker === "worker@healthsync.com"

            )

            &&

            formData.password === "worker123"

        ) {

            notify.success("Login Successful");

            navigate("/worker/dashboard");

        }

        else {

            notify.error("Invalid Worker ID / Email or Password");

        }

    };

    return (

        <div className="worker-login">

            {/* LEFT */}

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
