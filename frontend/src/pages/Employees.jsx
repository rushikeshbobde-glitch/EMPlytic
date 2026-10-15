import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function Employees() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  const [selectedReadiness, setSelectedReadiness] = useState("all");

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      
      let url = `${apiUrl}/api/employees?limit=100`;
      if (selectedDatasetId) url += `&dataset_id=${selectedDatasetId}`;
      if (selectedDept !== "all") url += `&department=${encodeURIComponent(selectedDept)}`;
      if (selectedRisk !== "all") url += `&risk=${encodeURIComponent(selectedRisk)}`;
      if (selectedReadiness !== "all") url += `&readiness=${encodeURIComponent(selectedReadiness)}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEmployees(json.data);
        setTotalCount(json.total);

        // Extract unique departments
        const depts = Array.from(new Set(json.data.map((e) => e.department).filter(Boolean)));
        setDepartments(depts);
      }
    } catch (e) {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDatasetId, selectedDept, selectedRisk, selectedReadiness]);

  const columns = [
    { key: "employee_id", label: "Employee ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "job_role", label: "Role", sortable: true },
    {
      key: "salary",
      label: "Compensation",
      sortable: true,
      render: (val) => val ? `$${Number(val).toLocaleString()}` : "—"
    },
    {
      key: "performance",
      label: "Performance",
      sortable: true,
      render: (val) => <strong>{val ? `${val}%` : "—"}</strong>
    },
    {
      key: "productivity",
      label: "Productivity",
      sortable: true,
      render: (val) => val || "—"
    },
    {
      key: "attrition_risk",
      label: "Flight Risk",
      sortable: true,
      render: (val, row) => (
        <span className={`risk-badge ${val?.toLowerCase()}`}>
          {val || "Low"} ({row.attrition_probability || 0}%)
        </span>
      )
    },
    {
      key: "promotion_readiness",
      label: "Promotion",
      sortable: true,
      render: (val) => (
        <span className={`status-chip ${val?.toLowerCase().replace(" ", "-")}`}>
          {val || "Developing"}
        </span>
      )
    },
    {
      key: "cluster_segment",
      label: "Workforce Segment",
      sortable: true,
      render: (val) => (
        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>
          {val || "Core Workforce"}
        </span>
      )
    }
  ];

  return (
    <AppLayout
      title="Employee Directory & Talent Profiles"
      subtitle={`Total ${totalCount} Employee Records Active in Database`}
    >
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Organizational Workforce Directory</h2>
          <p>Search, filter, and inspect individual employee talent records and predictive risk indicators.</p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "12px", border: "1px solid #e4e2e4", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#75777d" }}>DEPARTMENT:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #c5c6cd", fontSize: "13px", background: "#fbf8fb" }}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#75777d" }}>FLIGHT RISK:</span>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #c5c6cd", fontSize: "13px", background: "#fbf8fb" }}
          >
            <option value="all">All Risk Levels</option>
            <option value="High">High Risk Only</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#75777d" }}>PROMOTION:</span>
          <select
            value={selectedReadiness}
            onChange={(e) => setSelectedReadiness(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #c5c6cd", fontSize: "13px", background: "#fbf8fb" }}
          >
            <option value="all">All Statuses</option>
            <option value="Ready">Ready for Promotion</option>
            <option value="Developing">Developing</option>
            <option value="Not Ready">Not Ready</option>
          </select>
        </div>

        {(selectedDept !== "all" || selectedRisk !== "all" || selectedReadiness !== "all") && (
          <button
            className="btn-secondary text-xs"
            onClick={() => { setSelectedDept("all"); setSelectedRisk("all"); setSelectedReadiness("all"); }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Employees Table */}
      {loading ? (
        <Loading message="Loading employee directory..." />
      ) : totalCount === 0 && selectedDept === "all" && selectedRisk === "all" && selectedReadiness === "all" ? (
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">badge</span>
          <h3>No Employee Records Found</h3>
          <p>The active dataset does not contain recognizable employee or workforce columns (Department, Role, Salary, Performance, etc.). Upload or select an HR dataset to populate the organizational directory.</p>
          <button className="btn-primary" onClick={() => navigate("/data-upload")}>
            Upload Employee Dataset
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          searchPlaceholder="Search by ID, name, or role..."
          pageSize={12}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      )}
    </AppLayout>
  );
}
