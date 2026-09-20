import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { notify } from "../../components/ToastProvider";

import logo from "../../assets/images/logo.jpeg";
import adminImage from "../../assets/images/loginportal.jpeg";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
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

    // Demo Login
    if (
      formData.email === "admin@healthsync.com" &&
      formData.password === "admin123"
    ) {
      notify.success("Login Successful");
      navigate("/admin/dashboard");
    } else {
      notify.error("Invalid Email or Password");
    }
  };

  return (
    <div className="admin-login">
      {/* LEFT SIDE */}

      <div className="login-left">

        {/* BACK BUTTON */}

        <button
          className="back-btn"
          onClick={() => navigate("/login")}
        >
          <FaArrowLeft />
        </button>

        {/* LOGO */}

        <div className="logo-section">
          <img src={logo} alt="HealthSync Logo" />

          <div>
            <h1>HealthSync</h1>
            <p>Healthy Records, Stronger Lives</p>
          </div>
        </div>

        {/* LOGIN CARD */}

        <div className="login-card">
          <h2>ADMIN LOGIN</h2>

          <form onSubmit={handleSubmit}>

            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter Admin Email"
              value={formData.email}
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

              <span onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button className="login-btn" type="submit">
              Login
            </button>
          </form>

          {/* DEMO */}

          <div className="demo-login">
            <h4>Demo Credentials</h4>

            <p><b>Email :</b> admin@healthsync.com</p>

            <p><b>Password :</b> admin123</p>
          </div>

          {/* FORGOT PASSWORD */}

          <p
            className="forgot-password"
            onClick={() => navigate("/admin-forgot-password")}
          >
            Forgot Password?
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}

      <div className="login-right">

        <div className="circle"></div>

        <div className="image-card">
          <img
            src={adminImage}
            alt="Admin"
          />
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
