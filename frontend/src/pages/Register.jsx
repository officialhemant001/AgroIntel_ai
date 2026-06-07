import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import "../styles/auth.css";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      const result = await registerUser(form.name, form.email, form.password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        // Handle validation errors from backend
        const errorMsg = typeof result.error === "object"
          ? Object.values(result.error).flat().join(". ")
          : result.error;
        setError(errorMsg || "Registration failed");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message || "Unable to connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🌾</div>
          <h2>Create Account</h2>
          <p>Join AgroIntel's smart farming platform</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label>Full Name</label>
            <input
              className="auth-input"
              name="name"
              type="text"
              placeholder="Enter your full name"
              onChange={handleChange}
              value={form.name}
              id="register-name"
            />
            <span className="input-icon">👤</span>
          </div>

          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              className="auth-input"
              name="email"
              type="email"
              placeholder="you@example.com"
              onChange={handleChange}
              value={form.email}
              id="register-email"
            />
            <span className="input-icon">✉️</span>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Create a strong password"
              onChange={handleChange}
              value={form.password}
              id="register-password"
            />
            <span className="input-icon">🔒</span>
          </div>

          <div className="auth-input-group">
            <label>Confirm Password</label>
            <input
              className="auth-input"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              onChange={handleChange}
              value={form.confirmPassword}
              id="register-confirm-password"
            />
            <span className="input-icon">🔐</span>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
            id="register-submit"
          >
            {loading && <span className="auth-spinner" />}
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        {/* Footer */}
        <div className="auth-footer">
          Already have an account?
          <Link to="/">Sign In</Link>
        </div>
      </div>
    </div>
  );
}