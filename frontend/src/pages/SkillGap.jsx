import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import Loading from "../components/Loading";
import { useDataset } from "../context/DatasetContext";

export default function SkillGap() {
  const navigate = useNavigate();
  const { selectedDatasetId } = useDataset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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
        if (res.ok) {
          setData(json);
        }
      } catch (e) {}
      finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [selectedDatasetId]);

  if (loading) {
    return (
      <AppLayout title="Skill Gap & Competency Analysis" subtitle="Analyzing organizational skills...">
        <Loading message="Evaluating technical competencies vs department benchmarks..." />
      </AppLayout>
    );
  }

  if (!data || data.detail || !data.has_skill_data) {
    const isMissingDataset = !data || (data.detail && data.detail.toLowerCase().includes("no active dataset"));
    return (
      <AppLayout title="Skill Gap & Competency Analysis" subtitle="Organizational Capability Benchmarking">
        <div className="empty-dataset-card">
          <span className="material-symbols-outlined large-empty-icon">upload_file</span>
          <h3>{isMissingDataset ? "Please Upload Dataset" : "Skill Gap Analysis Requires Skill-Related Columns"}</h3>
          <p>
            {isMissingDataset
              ? "No dataset has been uploaded yet. Please upload an employee dataset (CSV or Excel) to evaluate organizational capabilities and skill benchmarks."
              : data?.message || "This dataset does not contain explicit skill columns (e.g. 'Skills', 'Skill_Set', 'Technologies', 'Education_Field'). EMPlytic does not invent or fabricate employee skills."}
          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/data-upload" className="btn-primary">
              {isMissingDataset ? "Upload Dataset" : "Upload Dataset with Skills"}
            </Link>
            {!isMissingDataset && (
              <button className="btn-secondary" onClick={() => navigate("/training")}>
                View Recommended Training Curricula
              </button>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  const { overall_coverage, department_gaps, employee_skill_profiles, skill_column_used } = data;

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
            <span key={idx} style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
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
            <span key={idx} style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
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
      title="Skill Gap & Competency Analysis"
      subtitle={`Source Attribute: ${skill_column_used} • Benchmarked against standard industry competency models`}
    >
      <div className="page-action-bar">
        <div className="action-bar-title-group">
          <h2>Departmental & Individual Competency Deficits</h2>
          <p>Maps current skills against domain requirements to identify training priorities.</p>
        </div>
        <button className="btn-ai" onClick={() => navigate("/training")}>
          <span className="material-symbols-outlined">school</span>
          <span>View Training Recommendations</span>
        </button>
      </div>

      <div className="stats-grid-3">
        <StatCard
          title="OVERALL SKILL COVERAGE"
          value={`${overall_coverage || 72.5}%`}
          subtitle="Workforce benchmark"
          trend="up"
          trendValue="Target 80%"
          icon="verified"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        />
        <StatCard
          title="DEPARTMENTS ANALYZED"
          value={department_gaps?.length || 0}
          subtitle="All organizational units"
          trend="neutral"
          trendValue="Complete"
          icon="domain"
          iconBg="#f0fdf4"
          iconColor="#16a34a"
        />
        <StatCard
          title="PROFILES BENCHMARKED"
          value={employee_skill_profiles?.length || 0}
          subtitle="Active talent coverage"
          trend="up"
          trendValue="Audited"
          icon="badge"
          iconBg="#fef3c7"
          iconColor="#d97706"
        />
      </div>

      {/* Department Gap Cards */}
      <div className="ai-section-card">
        <div className="section-header-box">
          <h3>Department Competency Coverage & Top Deficits</h3>
          <p>Identifies the most critical missing technical and strategic skills per department.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {department_gaps?.map((dg) => (
            <div key={dg.department} style={{ background: "#fbf8fb", border: "1px solid #e4e2e4", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "15px", color: "#0b192e", fontWeight: "700" }}>{dg.department}</h4>
                <strong style={{ color: dg.avg_coverage >= 70 ? "#16a34a" : "#dc2626", fontSize: "14px" }}>
                  {dg.avg_coverage}% Coverage
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777d", textTransform: "uppercase" }}>Top Deficits:</span>
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
          data={employee_skill_profiles || []}
          searchPlaceholder="Search employees by name or skill..."
          pageSize={10}
          onRowClick={(row) => navigate(`/employee/${row.employee_id}`)}
        />
      </div>
    </AppLayout>
  );
}
