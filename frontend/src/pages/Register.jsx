import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "hr",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Registration failed.");
      }

      setSuccessMsg("Account created successfully! Redirecting...");

      if (data.access_token) {
        const userObj = {
          name: data.name,
          email: formData.email,
          role: data.role,
        };
        login(userObj, data.access_token);
        setTimeout(() => {
          if (data.role === "employee") {
            navigate("/employee/dashboard");
          } else {
            navigate("/hr/dashboard");
          }
        }, 1000);
      } else {
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-section">
        <div className="brand-background-glow"></div>
        <div className="brand-dot-pattern"></div>

        <div className="brand-content">
          <Link to="/" className="login-brand">
            <div className="login-logo">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <span>Emplytic</span>
          </Link>

          <div className="brand-hero-text">
            <h1>
              Join the Next Gen <br />
              <span>HR Analytics</span>
            </h1>
            <p>
              Get instant automated data health checks, predictive retention models,
              and executive dashboards powered by AI.
            </p>
          </div>

          <div className="metric-preview-card">
            <div className="metric-preview-header">
              <div className="metric-tag">ENTERPRISE SECURITY</div>
              <span className="status-dot"></span>
            </div>
            <div className="metric-preview-body">
              <div className="preview-stat">
                <span className="stat-label">Role Isolation</span>
                <span className="stat-number">100%</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Setup Time</span>
                <span className="stat-number">&lt; 2 min</span>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <span>&copy; 2026 Emplytic AI Platform</span>
          <div>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-container">
          <Link to="/" className="mobile-login-brand">
            <div className="login-logo">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <span>Emplytic</span>
          </Link>

          <div className="login-header">
            <h2>Create Account</h2>
            <p>Register as an HR Administrator or Employee</p>
          </div>

          <div className="login-card">
            <div className="card-top-line"></div>

            <div className="role-tabs">
              <button
                type="button"
                className={formData.role === "hr" ? "role-tab active" : "role-tab"}
                onClick={() => setFormData((prev) => ({ ...prev, role: "hr" }))}
              >
                HR / Admin
              </button>
              <button
                type="button"
                className={formData.role === "employee" ? "role-tab active" : "role-tab"}
                onClick={() => setFormData((prev) => ({ ...prev, role: "employee" }))}
              >
                Employee
              </button>
            </div>

            {error && (
              <div className="login-error" style={{ background: "#ffdad6", color: "#93000a", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="login-success" style={{ background: "#dcfce7", color: "#166534", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">FULL NAME</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">person</span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">WORK EMAIL</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">PASSWORD</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">lock_clock</span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>

          <p className="register-text">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
