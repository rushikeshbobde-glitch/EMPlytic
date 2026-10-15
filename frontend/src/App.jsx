import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DatasetProvider } from "./context/DatasetContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HRDashboard from "./pages/HRDashboard";
import DataUpload from "./pages/DataUpload";
import DataValidation from "./pages/DataValidation";
import EDA from "./pages/EDA";
import AIDashboard from "./pages/AIDashboard";
import Performance from "./pages/Performance";
import Productivity from "./pages/Productivity";
import Attrition from "./pages/Attrition";
import Promotion from "./pages/Promotion";
import SkillGap from "./pages/SkillGap";
import Training from "./pages/Training";
import Employees from "./pages/Employees";
import EmployeeProfile from "./pages/EmployeeProfile";
import Insights from "./pages/Insights";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import EmployeeDashboard from "./pages/EmployeeDashboard";

export default function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/hr/login" element={<Login defaultRole="HR_ADMIN" />} />
          <Route path="/employee/login" element={<Login defaultRole="EMPLOYEE" />} />
          <Route path="/register" element={<Register />} />

          {/* Protected HR & Analytics Routes (Restricted to HR_ADMIN / HR_USER) */}
          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute allowedRole="HR">
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Navigate to="/hr/dashboard" replace />} />
          
          <Route
            path="/data-upload"
            element={
              <ProtectedRoute allowedRole="HR">
                <DataUpload />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/upload" element={<Navigate to="/data-upload" replace />} />

          <Route
            path="/data-validation"
            element={
              <ProtectedRoute allowedRole="HR">
                <DataValidation />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/data-validation" element={<Navigate to="/data-validation" replace />} />

          <Route
            path="/eda"
            element={
              <ProtectedRoute allowedRole="HR">
                <EDA />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/eda" element={<Navigate to="/eda" replace />} />

          <Route
            path="/ai-dashboard"
            element={
              <ProtectedRoute allowedRole="HR">
                <AIDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/ai-dashboard" element={<Navigate to="/ai-dashboard" replace />} />

          <Route
            path="/performance"
            element={
              <ProtectedRoute allowedRole="HR">
                <Performance />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/performance" element={<Navigate to="/performance" replace />} />

          <Route
            path="/productivity"
            element={
              <ProtectedRoute allowedRole="HR">
                <Productivity />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/productivity" element={<Navigate to="/productivity" replace />} />

          <Route
            path="/attrition"
            element={
              <ProtectedRoute allowedRole="HR">
                <Attrition />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/attrition" element={<Navigate to="/attrition" replace />} />

          <Route
            path="/promotion"
            element={
              <ProtectedRoute allowedRole="HR">
                <Promotion />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/promotion" element={<Navigate to="/promotion" replace />} />

          <Route
            path="/skills"
            element={
              <ProtectedRoute allowedRole="HR">
                <SkillGap />
              </ProtectedRoute>
            }
          />
          <Route path="/skill-gap" element={<Navigate to="/skills" replace />} />
          <Route path="/hr/skills" element={<Navigate to="/skills" replace />} />

          <Route
            path="/training"
            element={
              <ProtectedRoute allowedRole="HR">
                <Training />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/training" element={<Navigate to="/training" replace />} />

          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRole="HR">
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/employees" element={<Navigate to="/employees" replace />} />

          <Route
            path="/employee/:id"
            element={
              <ProtectedRoute allowedRole="HR">
                <EmployeeProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/employees/:id" element={<Navigate to="/employee/:id" replace />} />

          <Route
            path="/ai-insights"
            element={
              <ProtectedRoute allowedRole="HR">
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route path="/insights" element={<Navigate to="/ai-insights" replace />} />
          <Route path="/hr/insights" element={<Navigate to="/ai-insights" replace />} />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRole="HR">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/reports" element={<Navigate to="/reports" replace />} />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRole="HR">
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/settings" element={<Navigate to="/settings" replace />} />

          {/* Protected Employee Self-Service Routes (Restricted to EMPLOYEE role) */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute allowedRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/performance"
            element={
              <ProtectedRoute allowedRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/skills"
            element={
              <ProtectedRoute allowedRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/training"
            element={
              <ProtectedRoute allowedRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/reports"
            element={
              <ProtectedRoute allowedRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </DatasetProvider>
    </AuthProvider>
  );
}
