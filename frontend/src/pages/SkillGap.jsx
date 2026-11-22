import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function SkillGap() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [skillSearch, setSkillSearch] = useState("");

  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const url = selectedDatasetId
          ? `${apiUrl}/api/skills/analyze?dataset_id=${selectedDatasetId}`
          : `${apiUrl}/api/skills/analyze`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (res.ok && json) {
          setData(json);
        }
      } catch (e) {
        console.error("Skill data fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="Skill Gap Analysis" subtitle="Analyzing workforce competencies vs target benchmarks...">
        <Loading message="Evaluating technical competencies and department skill levels..." />
      </AppLayout>
    );
  }

  // Reference Benchmark Data from Screen 13
  const defaultSkills = [
    { skill: "Python", current: 55, required: 80, gap: 25, priority: "High" },
    { skill: "SQL", current: 60, required: 80, gap: 20, priority: "High" },
    { skill: "Machine Learning", current: 45, required: 75, gap: 30, priority: "High" },
    { skill: "Communication", current: 75, required: 80, gap: 5, priority: "Low" },
    { skill: "Leadership", current: 70, required: 80, gap: 10, priority: "Medium" },
    { skill: "Data Engineering", current: 40, required: 70, gap: 30, priority: "High" },
    { skill: "Cloud Architecture", current: 50, required: 75, gap: 25, priority: "High" },
  ];

  const filteredSkills = defaultSkills.filter(s =>
    s.skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const departmentGaps = data?.department_gaps || [
    { department: "Technology & Engineering", avg_coverage: 64, top_skill_deficits: ["Cloud Infrastructure", "Distributed Systems", "Kubernetes"] },
    { department: "Data Science & Analytics", avg_coverage: 72, top_skill_deficits: ["Deep Learning", "MLOps", "Real-Time Streaming"] },
    { department: "Sales & Account Management", avg_coverage: 81, top_skill_deficits: ["Enterprise Negotiation", "Solution Architecture"] },
    { department: "Human Resources", avg_coverage: 88, top_skill_deficits: ["People Analytics", "Compensation Modeling"] },
  ];

  const empSkillProfiles = data?.employee_skill_profiles || [
    { employee_id: "EMP-1001", name: "Ananya Sharma", department: "Technology", current_skills: ["Python", "SQL", "React"], missing_skills: ["Docker", "Kafka"], coverage_percentage: 75 },
    { employee_id: "EMP-1002", name: "Rahul Verma", department: "Data Science", current_skills: ["Python", "Pandas", "Scikit-Learn"], missing_skills: ["PyTorch", "MLflow"], coverage_percentage: 68 },
    { employee_id: "EMP-1003", name: "Priya Nair", department: "Sales", current_skills: ["CRM", "Client Relations"], missing_skills: ["Data Storytelling"], coverage_percentage: 82 },
    { employee_id: "EMP-1004", name: "Aditya Patel", department: "Engineering", current_skills: ["Java", "Spring Boot"], missing_skills: ["AWS", "Microservices"], coverage_percentage: 60 },
  ];

  const empSkillCols = [
    { key: "employee_id", label: "ID", sortable: true },
    { key: "name", label: "Employee Name", sortable: true },
    { key: "department", label: "Department", sortable: true },
    {
      key: "current_skills",
      label: "Current Skills",
      sortable: false,
      render: (skills) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {skills?.map((s, idx) => (
            <span key={idx} style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
              {s}
            </span>
          ))}
        </div>
      )
    },
    {
      key: "missing_skills",
      label: "Missing Competencies",
      sortable: false,
      render: (missing) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {missing?.map((m, idx) => (
            <span key={idx} style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
              {m}
            </span>
          ))}
        </div>
      )
    },
    {
      key: "coverage_percentage",
      label: "Skill Coverage",
      sortable: true,
      render: (val) => <strong>{val}%</strong>
    }
  ];

  return (
    <AppLayout
      title="Skill Gap Analysis"
      subtitle="Benchmark employee competencies against organizational standards"
    >
      {/* Screen 13: Action Bar with Search & Configure Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: "280px" }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "20px" }}>search</span>
          <input
            type="text"
            placeholder="Search employee, skill..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "10px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13px", background: "#ffffff" }}
          />
        </div>
        <button
          className="btn-primary text-xs"
          onClick={() => alert("Skill Benchmark Configuration: Target thresholds set per tier.")}
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          <span>Configure Required Levels</span>
        </button>
      </div>

      {/* Screen 13: Skill Gap Analysis Table Card */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(11,25,46,0.04)", marginBottom: "24px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: "600", fontSize: "11px", textTransform: "uppercase" }}>Skill</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: "600", fontSize: "11px", textTransform: "uppercase" }}>Current Level</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: "600", fontSize: "11px", textTransform: "uppercase" }}>Required Level</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: "600", fontSize: "11px", textTransform: "uppercase" }}>Gap %</th>
              <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: "600", fontSize: "11px", textTransform: "uppercase", textAlign: "right" }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {filteredSkills.map(s => (
              <tr key={s.skill} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px 16px", fontWeight: "700", color: "#0b192e" }}>{s.skill}</td>
                <td style={{ padding: "14px 16px", color: "#334155" }}>{s.current}</td>
                <td style={{ padding: "14px 16px", color: "#334155" }}>{s.required}</td>
                <td style={{ padding: "14px 16px", fontWeight: "700", color: s.gap >= 25 ? "#dc2626" : s.gap >= 15 ? "#d97706" : "#2563eb" }}>
                  {s.gap}%
                </td>
                <td style={{ padding: "14px 16px", textAlign: "right" }}>
                  <span style={{
                    padding: "3px 12px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: s.priority === "High" ? "#fee2e2" : s.priority === "Medium" ? "#fef3c7" : "#eff6ff",
                    color: s.priority === "High" ? "#b91c1c" : s.priority === "Medium" ? "#b45309" : "#1e40af",
                    border: `1px solid ${s.priority === "High" ? "#fecaca" : s.priority === "Medium" ? "#fde68a" : "#bfdbfe"}`
                  }}>
                    {s.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
          <button
            className="btn-primary text-xs"
            onClick={() => alert("Skill Benchmark Configuration saved successfully.")}
          >
            Configure Required Levels
          </button>
        </div>
      </div>

      {/* Department Gap Breakdown */}
      <div className="ai-section-card" style={{ marginBottom: "24px" }}>
        <div className="section-header-box">
          <h3>Department Competency Coverage & Top Deficits</h3>
          <p>Identifies the most critical missing technical and strategic skills per department.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {departmentGaps.map((dg) => (
            <div key={dg.department} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "14px", color: "#0b192e", fontWeight: "700" }}>{dg.department}</h4>
                <strong style={{ color: dg.avg_coverage >= 70 ? "#16a34a" : "#dc2626", fontSize: "13px" }}>
                  {dg.avg_coverage}% Coverage
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Top Deficits:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {dg.top_skill_deficits?.map((def, idx) => (
                    <span key={idx} style={{ background: "#fee2e2", color: "#b91c1c", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600" }}>
                      {def}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Skill Matrix */}
      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Employee Skill Audit Matrix</h3>
          <p>Individual skill inventories and benchmark alignment.</p>
        </div>
        <DataTable
          columns={empSkillCols}
          data={empSkillProfiles}
          searchPlaceholder="Search employees by name or skill..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
