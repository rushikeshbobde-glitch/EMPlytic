import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function Training() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
        if (res.ok && json) {
          setData(json);
        }
      } catch (e) {
        console.error("Training data fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTraining();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="Training Recommendations" subtitle="Synthesizing personalized learning pathways...">
        <Loading message="Evaluating skill gaps, role tiers, and career progression curricula..." />
      </AppLayout>
    );
  }

  // Reference Courses from Screen 14
  const allTrainingList = [
    { title: "Python for Data Science", duration: "4 weeks", priority: "High", color: "#ef4444", bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
    { title: "SQL for Data Analysis", duration: "3 weeks", priority: "High", color: "#ef4444", bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
    { title: "Machine Learning Basics", duration: "6 weeks", priority: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
    { title: "Communication Skills", duration: "2 weeks", priority: "Low", color: "#10b981", bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
    { title: "Leadership Development", duration: "4 weeks", priority: "Medium", color: "#f59e0b", bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  ];

  const filteredTrainings = allTrainingList.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fallbackRecommendations = [
    {
      employee_id: "EMP-1001",
      name: "Ananya Sharma",
      department: "Technology",
      job_role: "Software Engineer",
      recommended_courses: [
        { course_name: "Python for Data Science", reason: "Target Tier Advancement", duration: "4 weeks" },
        { course_name: "Cloud Architecture Fundamentals", reason: "Infrastructure Upskilling", duration: "3 weeks" }
      ]
    },
    {
      employee_id: "EMP-1002",
      name: "Rahul Verma",
      department: "Data Science",
      job_role: "Data Analyst",
      recommended_courses: [
        { course_name: "Machine Learning Basics", reason: "Skill Gap Closure", duration: "6 weeks" }
      ]
    },
    {
      employee_id: "EMP-1003",
      name: "Priya Nair",
      department: "Sales",
      job_role: "Account Executive",
      recommended_courses: [
        { course_name: "Communication & Negotiation", reason: "Performance Optimization", duration: "2 weeks" }
      ]
    },
    {
      employee_id: "EMP-1004",
      name: "Aditya Patel",
      department: "Technology",
      job_role: "Backend Developer",
      recommended_courses: [
        { course_name: "SQL for Data Analysis", reason: "Data Engineering Track", duration: "3 weeks" },
        { course_name: "Leadership Development", reason: "Promotion Readiness", duration: "4 weeks" }
      ]
    }
  ];

  const tableCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    { key: "job_role", label: "Role", sortable: true },
    {
      key: "recommended_courses",
      label: "Assigned Curricula & Objective",
      sortable: false,
      render: (courses) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {courses?.map((c, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
              <span style={{ fontWeight: "600", color: "#1e40af" }}>• {c.course_name}</span>
              <span style={{ color: "#64748b", fontSize: "11px" }}>({c.reason} • {c.duration})</span>
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
          className="btn-secondary text-xs py-1 px-3"
          onClick={(e) => { e.stopPropagation(); navigate(`/employee/${row.employee_id}`); }}
        >
          View
        </button>
      )
    }
  ];

  const activeRecommendations = (data?.recommendations && data.recommendations.length > 0)
    ? data.recommendations
    : fallbackRecommendations;

  return (
    <AppLayout
      title="Training Recommendations"
      subtitle="Curated learning pathways based on detected skill gaps"
    >
      {/* Top Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: "280px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
          <input
            type="text"
            placeholder="Search training courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px", background: "#ffffff" }}
          />
        </div>
      </div>

      {/* Screen 14: Training Cards List */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ margin: 0, fontFamily: "Hanken Grotesk, sans-serif", fontSize: "16px", fontWeight: "700", color: "#0b192e" }}>
            Recommended Courses & Certifications
          </h3>
          <span style={{ fontSize: "12px", color: "#64748b" }}>{filteredTrainings.length} priority tracks active</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredTrainings.map((c) => (
            <div
              key={c.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0b192e" }}>{c.title}</h4>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Duration: {c.duration}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background: c.bg,
                  color: c.text,
                  border: `1px solid ${c.border}`
                }}>
                  {c.priority}
                </span>

                <button
                  className="btn-primary text-xs"
                  style={{ padding: "6px 14px" }}
                  onClick={() => alert(`Enrolled employees into ${c.title}`)}
                >
                  Enroll
                </button>
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
          data={activeRecommendations}
          searchPlaceholder="Search employees by name, role..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
