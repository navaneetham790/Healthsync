import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthService from "../../services/AuthService";
import { notify } from "../../components/ToastProvider";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const token = searchParams.get("token");

  const submit = async (event) => {
    event.preventDefault();
    if (!token) return notify.error("This password reset link is invalid.");
    if (password.length < 6) return notify.warning("Password must contain at least 6 characters.");
    if (password !== confirmPassword) return notify.warning("Passwords do not match.");
    setSaving(true);
    try {
      const { data } = await AuthService.resetPassword(token, password);
      notify.success(data.message || "Password updated successfully.");
      navigate("/login", { replace: true });
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to reset the password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#edf6f5" }}>
      <form onSubmit={submit} style={{ width: "min(100%, 420px)", display: "grid", gap: "12px", padding: "32px", borderRadius: "16px", background: "white", boxShadow: "0 16px 40px rgba(15, 23, 42, .15)" }}>
        <h1 style={{ margin: 0 }}>Reset Password</h1>
        <p style={{ margin: 0, color: "#475569" }}>Enter a new password for your HealthSync account.</p>
        {!token && <p style={{ color: "#b91c1c", margin: 0 }}>This link is invalid or incomplete.</p>}
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" minLength="6" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" type="password" minLength="6" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        <button type="submit" disabled={saving || !token}>{saving ? "Updating password..." : "Update password"}</button>
        <Link to="/login">Back to login</Link>
      </form>
    </main>
  );
}
