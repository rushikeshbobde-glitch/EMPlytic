import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#fbf8fb" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #dde1ff", borderTopColor: "#3755c3", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }}></div>
          <p style={{ color: "#44474d", fontFamily: "Inter, sans-serif", fontSize: "14px" }}>Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = (user?.role || "").toUpperCase();
  const isEmployee = role === "EMPLOYEE";
  const isHR = role === "HR_ADMIN" || role === "HR_USER";

  // If specific allowedRole is provided:
  if (allowedRole) {
    const target = allowedRole.toUpperCase();
    if (target === "EMPLOYEE" && !isEmployee) {
      return <Navigate to="/hr/dashboard" replace />;
    }
    if ((target === "HR" || target === "HR_ADMIN" || target === "HR_USER") && isEmployee) {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  // DEFAULT STRICT ISOLATION WITH INTELLIGENT EQUIVALENCE ROUTING:
  // 1. If an employee visits general HR/Admin routes, redirect to the matching employee portal view
  if (isEmployee && !location.pathname.startsWith("/employee")) {
    if (location.pathname.includes("/skills")) return <Navigate to="/employee/skills" replace />;
    if (location.pathname.includes("/training")) return <Navigate to="/employee/training" replace />;
    if (location.pathname.includes("/performance")) return <Navigate to="/employee/performance" replace />;
    if (location.pathname.includes("/reports")) return <Navigate to="/employee/reports" replace />;
    return <Navigate to="/employee/dashboard" replace />;
  }

  // 2. If an HR user visits /employee routes, redirect to the matching HR analytics view
  if (isHR && location.pathname.startsWith("/employee")) {
    if (location.pathname.includes("/skills")) return <Navigate to="/skills" replace />;
    if (location.pathname.includes("/training")) return <Navigate to="/training" replace />;
    if (location.pathname.includes("/performance")) return <Navigate to="/performance" replace />;
    if (location.pathname.includes("/reports")) return <Navigate to="/reports" replace />;
    return <Navigate to="/hr/dashboard" replace />;
  }

  return children;
}
