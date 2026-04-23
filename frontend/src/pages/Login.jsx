import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import "../styles/auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const result = await loginUser(form.email, form.password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError(err.message || "Login failed — check your connection");
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
          <div className="auth-logo-icon">🌱</div>
          <h2>Welcome Back</h2>
          <p>Sign in to AgroIntel AI Dashboard</p>
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
            <label>Email Address</label>
            <input
              className="auth-input"
              name="email"
              type="email"
              placeholder="you@example.com"
              onChange={handleChange}
              value={form.email}
              id="login-email"
            />
            <span className="input-icon">✉️</span>
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="Enter your password"
              onChange={handleChange}
              value={form.password}
              id="login-password"
            />
            <span className="input-icon">🔒</span>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
            id="login-submit"
          >
            {loading && <span className="auth-spinner" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        {/* Footer */}
        <div className="auth-footer">
          Don't have an account?
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}