import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [role, setRole] = useState("hr");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Invalid email or password");
      }

      const roleNormalized = (data.role || role || "").toUpperCase();
      const userObj = {
        name: data.name || (formData.email.split("@")[0]),
        email: formData.email,
        role: roleNormalized,
        employee_id: data.employee_id
      };

      login(userObj, data.access_token);

      if (roleNormalized === "EMPLOYEE") {
        navigate("/employee/dashboard", { replace: true });
      } else {
        const from = location.state?.from?.pathname;
        if (from && !from.startsWith("/employee")) {
          navigate(from, { replace: true });
        } else {
          navigate("/hr/dashboard", { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
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
              AI-Powered <br />
              <span>HR Intelligence</span>
            </h1>
            <p>
              Transform your workforce decision making with predictive analytics,
              automated exploratory data analysis, and explainable machine learning models.
            </p>
          </div>

          <div className="metric-preview-card">
            <div className="metric-preview-header">
              <div className="metric-tag">ACCURACY & INSIGHTS</div>
              <span className="status-dot"></span>
            </div>
            <div className="metric-preview-body">
              <div className="preview-stat">
                <span className="stat-label">Model Accuracy</span>
                <span className="stat-number">94.8%</span>
              </div>
              <div className="preview-stat">
                <span className="stat-label">Turnover Prevention</span>
                <span className="stat-number">3.2x</span>
              </div>
            </div>
            <div className="preview-chart-mock">
              <div className="chart-column column-1"><span>Q1</span></div>
              <div className="chart-column column-2"><span>Q2</span></div>
              <div className="chart-column column-3"><span>Q3</span></div>
              <div className="chart-column column-4"><span>Q4</span></div>
            </div>
          </div>

          <div className="floating-risk-card">
            <div className="risk-icon">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <div>
              <div className="risk-label">ATTRITION MITIGATION</div>
              <div className="risk-value">-18.4%</div>
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
            <h2>Welcome Back</h2>
            <p>Sign in to access your workforce analytics workspace</p>
          </div>

          <div className="login-card">
            <div className="card-top-line"></div>

            <div className="role-tabs">
              <button
                type="button"
                className={role === "hr" ? "role-tab active" : "role-tab"}
                onClick={() => setRole("hr")}
              >
                HR / Admin
              </button>
              <button
                type="button"
                className={role === "employee" ? "role-tab active" : "role-tab"}
                onClick={() => setRole("employee")}
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

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">WORK EMAIL</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Use the demo credentials below or create a new account."); }}>
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="demo-credentials" style={{ marginTop: "16px", padding: "10px", background: "#f5f3f5", borderRadius: "6px", fontSize: "12px", color: "#44474d" }}>
              <strong>Default Demo Accounts:</strong><br />
              HR: <code>admin@emplytic.com</code> / <code>admin123</code><br />
              Employee: <code>employee@emplytic.com</code> / <code>emp123</code>
            </div>
          </div>

          <p className="register-text">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
