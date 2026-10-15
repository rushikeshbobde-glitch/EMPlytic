import { Link } from "react-router-dom";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">

      {/* ================= NAVBAR ================= */}
      <nav className="landing-navbar">
        <div className="nav-container">

          <Link to="/" className="brand">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNF-jIwWC94wjXIVnCxZQWaadAUDpYWaLJn8i1qZpQA2OkIWSwFuorAIMGTUemP0BsNnHeVLDAaER7IqplWtWdCCkXnGLx3KYKdvt_fHXt9dx_PXplkYy7Xygxt4C9sB3tykTeheJjwRaRuOvgYzMAPUVf7EisXiyApkYX3wdwS-K0tx6dps1rOE26KpqmyYvBkN9Hz3q017QyzOCW1aE-5bnxHTZOqd1pqObw_GJtbGgKFf73f1EQ"
              alt="Emplytic Logo"
            />

            <span>Emplytic</span>
          </Link>

          <div className="nav-links">
            <a className="active" href="#home">
              Home
            </a>

            <a href="#features">
              Features
            </a>

            <a href="#ai-analytics">
              AI Analytics
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

            <a href="#reports">
              Reports
            </a>
          </div>

          <div className="nav-actions">

            <Link
              to="/login"
              className="signin-button"
            >
              Sign In
            </Link>

            <Link
              to="/login"
              className="primary-button nav-get-started"
            >
              Get Started
            </Link>

          </div>

        </div>
      </nav>


      {/* ================= HERO ================= */}
      <section
        id="home"
        className="hero-section"
      >

        <div className="hero-glow"></div>

        <div className="hero-container">

          {/* HERO LEFT */}
          <div className="hero-content">

            <div className="future-badge">
              <span className="material-symbols">
                auto_awesome
              </span>

              <span>
                THE FUTURE OF HR
              </span>
            </div>

            <h1>
              AI-Powered HR Analytics for{" "}
              <span className="gradient-text">
                Smarter Workforce Decisions
              </span>
            </h1>

            <p>
              Transform raw employee data into predictive
              insights. Uncover attrition risks, optimize
              performance, and identify skill gaps with
              enterprise-grade AI analytics.
            </p>

            <div className="hero-buttons">

              <Link
                to="/login"
                className="primary-button hero-button"
              >
                Get Started

                <span className="material-symbols">
                  arrow_forward
                </span>
              </Link>

              <a
                href="#features"
                className="secondary-button hero-button"
              >
                Explore Demo
              </a>

            </div>


            {/* TRUSTED USERS */}
            <div className="trusted-section">

              <div className="avatar-group">

                <div
                  className="avatar"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAvpfG14A3EAEhZxOXgJem3phBbT6ja8232yjfFz0nnoiaZLXjCU7YSYH2DJi4v5g88hM7-QFFzWal6IXntv3x9TZNztHOhMoROfS1EF69ZJfc7J9G4zsFleDWvqVX7SQ6jRHa85pnYg5N3CXpN9GZ4UY_2FaL09YbuBt5QfMcc9X0Xe450ig4j2GXyf_eairMVOg1s7nQkBbvr9I6SNGNj450HFm3pxTadeuMU6BEFJ0WMSPSgIpE0')"
                  }}
                />

                <div
                  className="avatar"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBw7drQXy59vAIThhKrLl5gb7MetsuQAgqnIWrOG8xwDyge-UzmCowU0LWMtal3LnuA5ooSY3ig8xf-ySsql8gfciJXP0YCc_7LLqm8ttAoLmVUFKhw76qufYcGIhfIqI5QvEB24ACPuKytESCuCSGNuHAWNdqLtlEi0c64Hp-7SLQPmsspAwS7CNatdYYRQjMtbXGeQlB0SKFAztIpeay3eC6x9uMmlzUFJR9ZPZFpBHwsZv7oohSL')"
                  }}
                />

                <div
                  className="avatar"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAvFPfUiZtyIp0mHM6Q2bcfCvpLadBQizhMWWZ-QxnCinJdJbXWSU71D1urKe44KaSbAhOZBLLhEIJIkBw4uXzlKz_SYutMnZcu_c8HCMkqrFI9C99lYOVl-oPWgvtJWNx4vddrvSa6gVILg2G2-8MWZkJYMcIoYGBSfaBQ5i2HU3CBiOoGCg9lNpq8LW9tyv_wvN61rf2OfTsS_5IT9oZuLl92Bh0LV1_KCzqF0pMP0E7tUIO6vLcl')"
                  }}
                />

              </div>

              <div>
                <strong>
                  Trusted by 500+
                </strong>

                <span>
                  Forward-thinking HR teams
                </span>
              </div>

            </div>

          </div>


          {/* ================= DASHBOARD MOCKUP ================= */}
          <div className="dashboard-mockup">

            <div className="mockup-topbar">

              <div className="window-dots">
                <span className="dot red"></span>
                <span className="dot gray"></span>
                <span className="dot blue"></span>
              </div>

              <span>
                EMPLYTIC DASHBOARD
              </span>

            </div>


            <div className="mockup-grid">

              {/* KPI 1 */}
              <div className="mockup-card">

                <div>
                  <span className="card-label">
                    AVG PERFORMANCE
                  </span>

                  <strong className="card-value">
                    92.4%
                  </strong>
                </div>

                <div className="trend positive">
                  <span className="material-symbols">
                    trending_up
                  </span>

                  +3.2%
                </div>

              </div>


              {/* KPI 2 */}
              <div className="mockup-card">

                <div>
                  <span className="card-label">
                    PREDICTED ATTRITION
                  </span>

                  <strong className="card-value">
                    4.1%
                  </strong>
                </div>

                <div className="trend negative">
                  <span className="material-symbols">
                    trending_down
                  </span>

                  -1.5%
                </div>

              </div>


              {/* PRODUCTIVITY CHART */}
              <div className="chart-card">

                <span className="card-label">
                  PRODUCTIVITY TRENDS
                </span>

                <div className="chart-bars">

                  <div className="bar bar-1"></div>

                  <div className="bar bar-2"></div>

                  <div className="bar bar-3"></div>

                  <div className="bar bar-4">
                    <span>Peak</span>
                  </div>

                  <div className="bar bar-5"></div>

                  <div className="bar bar-6"></div>

                </div>

              </div>


              {/* AI INSIGHT */}
              <div className="ai-insight">

                <div className="ai-icon">
                  <span className="material-symbols">
                    auto_awesome
                  </span>
                </div>

                <div>

                  <h3>
                    High Flight Risk Detected
                  </h3>

                  <p>
                    Engineering department shows a 15%
                    increase in burnout indicators.
                    Recommend reviewing Q3 workloads
                    and scheduling one-on-ones.
                  </p>

                  <button>
                    View Details

                    <span className="material-symbols">
                      arrow_forward
                    </span>
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURES ================= */}
      <section
        id="features"
        className="placeholder-section"
      >
        <span>FEATURES</span>

        <h2>
          Everything HR needs in one intelligent platform.
        </h2>

        <p>
          Upload employee data, analyze performance,
          predict risks and make smarter workforce decisions.
        </p>
      </section>


      {/* ================= AI ANALYTICS ================= */}
      <section
        id="ai-analytics"
        className="placeholder-section light"
      >
        <span>AI ANALYTICS</span>

        <h2>
          Turn employee data into actionable intelligence.
        </h2>

        <p>
          Performance scoring, productivity analysis,
          attrition prediction and promotion readiness.
        </p>
      </section>


      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className="placeholder-section"
      >
        <span>HOW IT WORKS</span>

        <h2>
          From employee dataset to AI-powered insights.
        </h2>

        <p>
          Upload → Validate → Clean → Analyze → Predict → Report.
        </p>
      </section>


      {/* ================= REPORTS ================= */}
      <section
        id="reports"
        className="placeholder-section light"
      >
        <span>REPORTS</span>

        <h2>
          Generate professional HR reports.
        </h2>

        <p>
          Download your analytics as PDF, Excel or HTML reports.
        </p>
      </section>


      {/* ================= FOOTER ================= */}
      <footer className="landing-footer">

        <div className="footer-container">

          <div className="footer-brand">
            Emplytic
          </div>

          <div className="footer-links">

            <a href="#">
              Privacy Policy
            </a>

            <a href="#">
              Terms of Service
            </a>

            <a href="#">
              Security
            </a>

            <a href="#">
              Cookie Settings
            </a>

          </div>

          <div className="copyright">
            © 2024 Emplytic AI. All rights reserved.
          </div>

        </div>

      </footer>

    </div>
  );
}

export default Landing;