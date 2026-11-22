import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login({ defaultRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [role, setRole] = useState(() => {
    if (defaultRole) {
      return defaultRole.toLowerCase().includes("emp") ? "employee" : "hr";
    }
    if (location.pathname.includes("employee")) return "employee";
    return "hr";
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultRole) {
      setRole(defaultRole.toLowerCase().includes("emp") ? "employee" : "hr");
    } else if (location.pathname.includes("employee")) {
      setRole("employee");
    } else if (location.pathname.includes("hr")) {
      setRole("hr");
    }
  }, [defaultRole, location.pathname]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFillDemo = (demoType) => {
    if (demoType === "hr") {
      setRole("hr");
      setFormData({
        email: "admin@emplytic.com",
        password: "admin123",
        remember: true,
      });
    } else {
      setRole("employee");
      setFormData({
        email: "employee@emplytic.com",
        password: "emp123",
        remember: true,
      });
    }
    setError("");
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
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Invalid credentials. Please verify your email/ID and password.");
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
      setError(err.message || "Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const isEmployee = role === "employee";

  return (
    <div className="login-page">
      {/* LEFT FORM SECTION */}
      <section className="login-form-section">
        <div className="login-card-wrapper">
          {/* Brand Header */}
          <Link to="/" className="login-logo-link">
            <div className="login-brand-icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                analytics
              </span>
            </div>
            <span className="login-brand-name">EMPlytic</span>
          </Link>

          {/* Form Card */}
          <div className="login-card-container">
            <div className="login-header-group">
              <h2 className="login-title">
                {isEmployee ? "Employee Login" : (location.pathname === "/hr/login" ? "HR Login" : "Welcome Back")}
              </h2>
              <p className="login-subtitle">
                {isEmployee
                  ? "View your personal dashboard"
                  : (location.pathname === "/hr/login"
                    ? "Access your organization's analytics"
                    : "Sign in to your account")}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="role-switcher-tabs">
              <button
                type="button"
                className={`role-tab-btn ${!isEmployee ? "active" : ""}`}
                onClick={() => { setRole("hr"); setError(""); }}
              >
                HR Login
              </button>
              <button
                type="button"
                className={`role-tab-btn ${isEmployee ? "active" : ""}`}
                onClick={() => { setRole("employee"); setError(""); }}
              >
                Employee Login
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-alert-box">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="login-actual-form" onSubmit={handleSubmit}>
              <div className="login-field-group">
                <label htmlFor="email">
                  {isEmployee ? "Employee ID / Email" : "Email Address"}
                </label>
                <div className="login-input-box">
                  <span className="material-symbols-outlined field-icon">
                    {isEmployee ? "badge" : "mail"}
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    placeholder={isEmployee ? "Enter your employee ID or email" : "Enter your email"}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="login-field-group">
                <label htmlFor="password">Password</label>
                <div className="login-input-box">
                  <span className="material-symbols-outlined field-icon">lock</span>
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
                    className="password-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="login-helpers-row">
                <label className="remember-checkbox-label">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={formData.remember}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  className="forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Demo Credentials:\n• HR Admin: admin@emplytic.com / admin123\n• Employee: employee@emplytic.com / emp123");
                  }}
                >
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? "Authenticating..." : "Login"}
              </button>
            </form>

            {/* Quick Demo Credentials Autofill Helper */}
            <div className="demo-fill-card">
              <span className="demo-fill-title">Quick Demo Logins:</span>
              <div className="demo-fill-buttons">
                <button
                  type="button"
                  className="demo-pill-btn"
                  onClick={() => handleFillDemo("hr")}
                >
                  <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
                  Fill HR Admin
                </button>
                <button
                  type="button"
                  className="demo-pill-btn"
                  onClick={() => handleFillDemo("employee")}
                >
                  <span className="material-symbols-outlined text-xs">person</span>
                  Fill Employee
                </button>
              </div>
            </div>

            {/* Back to Home & Footer Links */}
            <div className="login-footer-links">
              <Link to="/" className="back-home-link">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Back to Home</span>
              </Link>
              <span className="contact-admin-text">
                Don't have an account? <a href="mailto:admin@emplytic.com">Contact your administrator</a>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT GRAPHIC SECTION */}
      <section className="login-graphic-section">
        <div className="graphic-backdrop-glow"></div>
        <div className="graphic-content-wrapper">
          {isEmployee ? (
            /* Employee Graphic: "Your Growth Our Priority" */
            <div className="employee-graphic-card">
              <div className="graphic-badge">
                <span className="material-symbols-outlined text-sm">stars</span>
                <span>EMPLOYEE EMPOWERMENT</span>
              </div>
              <h2 className="employee-graphic-title">Your Growth Our Priority</h2>
              <p className="employee-graphic-desc">
                Track your personal career milestones, evaluate skill proficiencies, and access curated executive upskilling pathways.
              </p>
              
              {/* Graphic Mock Card */}
              <div className="employee-metric-card">
                <div className="metric-header-row">
                  <div className="metric-avatar">AS</div>
                  <div>
                    <div className="metric-emp-name">Ananya Sharma</div>
                    <div className="metric-emp-role">Software Engineer • Core Workforce</div>
                  </div>
                </div>
                <div className="metric-bars-group">
                  <div className="metric-single-bar">
                    <div className="bar-labels">
                      <span>Performance Index</span>
                      <strong>82 / 100</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill green" style={{ width: "82%" }}></div>
                    </div>
                  </div>
                  <div className="metric-single-bar">
                    <div className="bar-labels">
                      <span>Productivity Score</span>
                      <strong>76 / 100</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill blue" style={{ width: "76%" }}></div>
                    </div>
                  </div>
                  <div className="metric-single-bar">
                    <div className="bar-labels">
                      <span>Promotion Readiness</span>
                      <strong>Ready (88%)</strong>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill purple" style={{ width: "88%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* HR Graphic: Modern 3D Analytics & Dashboard Mockup */
            <div className="hr-graphic-card">
              <div className="graphic-badge">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>AI-POWERED WORKFORCE INTELLIGENCE</span>
              </div>
              <h2 className="hr-graphic-title">
                Turn Employee Data Into <br />
                <span className="highlight-text">Intelligent HR Decisions</span>
              </h2>
              <p className="hr-graphic-desc">
                Predict attrition risks, evaluate promotion readiness, identify organizational skill gaps, and generate executive reports in one click.
              </p>

              {/* Analytics Preview Card */}
              <div className="hr-metric-preview-box">
                <div className="preview-top-row">
                  <div className="kpi-mini-pill">
                    <span className="kpi-label">TOTAL WORKFORCE</span>
                    <strong className="kpi-val">248 Active</strong>
                  </div>
                  <div className="kpi-mini-pill">
                    <span className="kpi-label">ATTRITION MITIGATION</span>
                    <strong className="kpi-val text-green">-14.2%</strong>
                  </div>
                  <div className="kpi-mini-pill">
                    <span className="kpi-label">ML MODEL ACCURACY</span>
                    <strong className="kpi-val text-blue">94.8%</strong>
                  </div>
                </div>

                <div className="preview-chart-visual">
                  <div className="chart-bar-col h-40"><span>Q1</span></div>
                  <div className="chart-bar-col h-60"><span>Q2</span></div>
                  <div className="chart-bar-col h-75 active"><span>Q3</span></div>
                  <div className="chart-bar-col h-90"><span>Q4</span></div>
                </div>

                <div className="preview-floating-badge">
                  <span className="material-symbols-outlined text-blue">verified</span>
                  <span>Supervised Random Forest Model Trained</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
