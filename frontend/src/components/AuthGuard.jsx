/**
 * AuthGuard — Protects routes from unauthenticated access.
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

const safeParse = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val && val !== "undefined" ? JSON.parse(val) : null;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

export default function AuthGuard({ children }) {
  const tokens = safeParse("tokens");
  const user = safeParse("user");

  if (!user || !isTokenValid(tokens?.access)) {
    // Optional: could try to refresh token here if refresh exists
    // but the interceptor handles that on API calls.
    // For routing, we just ensure they are logged in.
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }

  return children;
}
