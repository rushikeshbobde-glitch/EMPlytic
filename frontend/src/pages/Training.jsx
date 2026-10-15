import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function Training() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchTraining = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const url = selectedDatasetId
          ? `${apiUrl}/api/training/recommend?dataset_id=${selectedDatasetId}`
          : `${apiUrl}/api/training/recommend`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (res.ok) {
          setData(json);
        }
      } catch (e) {}
      finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="AI Training & Upskilling Recommendations" subtitle="Generating personalized learning pathways...">
        <Loading message="Synthesizing skill gaps, performance ratings, and career trajectories..." />
      </AppLayout>
    );
  }

  if (!data || data.has_training_data === false || !data.recommendations || data.recommendations.length === 0) {
    const isNonHr = data && data.has_training_data === false;
    return (
      <AppLayout title="AI Training & Upskilling Recommendations" subtitle="Personalized Learning Engine">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">
            {isNonHr ? "school" : "upload_file"}
          </span>
          <h3>{isNonHr ? "No Training or Skill Metrics Detected" : "Please Upload Dataset"}</h3>
          <p>
            {isNonHr
              ? data?.message || "The active dataset does not contain employee skill, performance, or department records. Personalized training recommendations are unavailable for non-employee datasets."
              : "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to synthesize personalized training curricula and learning pathways."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            <button className="btn-primary" onClick={() => navigate("/data-upload")}>
              {isNonHr ? "Upload Employee Dataset" : "Upload Dataset"}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { popular_curricula, recommendations, total_employees_assigned } = data || {};

  const tableCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "job_role", label: "Role", sortable: true },
    {
      key: "recommended_courses",
      label: "Assigned Curricula & Justification",
      sortable: false,
      render: (courses) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {courses?.map((c, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <span style={{ fontWeight: "600", color: "#1e40af" }}>• {c.course_name}</span>
              <span style={{ color: "#75777d", fontSize: "11px" }}>({c.reason} • {c.duration})</span>
            </div>
          ))}
        </div>
      )
    },
    {
      key: "action",
      label: "Profile",
      sortable: false,
      render: (_, row) => (
        <button
          className="btn-secondary text-xs py-1 px-2"
          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${row.employee_id}`); }}
        >
          View
        </button>
      )
    }
  ];

  return (
    <AppLayout
      title="AI Training & Upskilling Recommendations"
      subtitle="Explainable professional development programs mapped to performance reviews and skill gaps."
    >
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Personalized Upskilling Programs</h2>
          <p>Automated course mappings driven by employee skill deficits and career advancement.</p>
        </div>
      </div>

      <div className="stats-grid-3">
        <StatCard
          title="ACTIVE LEARNING PATHS"
          value={total_employees_assigned || 50}
          subtitle="Targeted employees"
          trend="up"
          trendValue="Assigned"
          icon="school"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="CORE CURRICULA"
          value={popular_curricula?.length || 4}
          subtitle="Verified training modules"
          trend="neutral"
          trendValue="Active"
          icon="menu_book"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="AVG COMPLETION RATE"
          value="91.4%"
          subtitle="Historical organizational benchmark"
          trend="up"
          trendValue="+4.2%"
          icon="task_alt"
          iconBg="#dcfce7"
          iconColor="#15803d"
        />
      </div>

      {/* Popular Programs Grid */}
      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Featured Organizational Training Curricula</h3>
          <p>Targeted courses designed to close departmental skill gaps.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {popular_curricula?.map((course) => (
            <div key={course.name} style={{ background: "#ffffff", border: "1px solid #e4e2e4", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", background: "#eff6ff", color: "#1e40af", padding: "2px 8px", borderRadius: "4px" }}>
                  {course.category}
                </span>
                <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>{course.avg_completion_rate} Completion</span>
              </div>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0b192e" }}>{course.name}</h4>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#75777d", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #f0edef" }}>
                <span>{course.enrolled_count} Enrolled</span>
                <span style={{ color: "#1e40af", fontWeight: "600" }}>Standard 4–6 Wk</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Training Assignments Table */}
      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Individualized Learning Pathways</h3>
          <p>Explainable training assignments based on verified performance and skill metrics.</p>
        </div>
        <DataTable
          columns={tableCols}
          data={recommendations || []}
          searchPlaceholder="Search employees by name, role..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
