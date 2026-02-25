"use client";

import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { parseMWBEExcel } from '@/lib/excelParser';
import { useReportStore } from '@/store/reportStore';
import ReviewTable from '@/components/ReviewTable';

// ── Helpers ──
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${((n || 0) * 100).toFixed(1)}%`;

const fadeUp = (delay: number = 0): React.CSSProperties => ({
  opacity: 0,
  transform: "translateY(20px)",
  animation: `fadeUp 0.5s ease ${delay}s forwards`,
});

// ── MAIN APP ──
export default function DIReportEngine() {
  const [screen, setScreen] = useState<"home" | "upload" | "report">("home");
  const [reportId, setReportId] = useState<string | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<Record<string, File | { name: string; size: number; fromDb?: boolean } | null>>({
    C: null, D: null, E: null, F: null,
  });
  const [editableContent, setEditableContent] = useState<Record<string, string>>({
    executiveSummary: "",
    goalsIntro: "",
    outreachIntro: "",
    complianceIntro: "",
    paymentsIntro: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const {
    project_details,
    diversity_goals,
    mwbe_sdvob_subcontractors_report: SUBCONTRACTORS,
    workforce_demographics: WORKFORCE,
    project2_utilization: P2_UTIL,
    project2_eeo_data: P2_EEO,
    setReportData
  } = useReportStore();

  const isProject2 = P2_UTIL.length > 0 || P2_EEO.length > 0;

  // ── Data Calculations ──
  const cats: Record<string, { contract: number; paid: number; count: number }> = {};
  SUBCONTRACTORS.forEach((s) => {
    const code = s.code === 'Non-M/WBE' ? 'Non-MWBE' : s.code;
    if (!cats[code]) cats[code] = { contract: 0, paid: 0, count: 0 };
    cats[code].contract += (s.towards_goal || s.total_contract);
    cats[code].paid += s.total_paid_to_date;
    cats[code].count += 1;
  });

  const p2TotalContract = P2_UTIL.reduce((sum, row) => sum + row.value, 0);
  const p2TotalTowardsGoal = P2_UTIL.reduce((sum, row) => sum + row.towards_goal, 0);
  const p2TotalPaid = P2_UTIL.reduce((sum, row) => sum + row.paid_to_date, 0);
  const p2TotalHeadcount = P2_EEO.reduce((sum, row) => sum + row.num_employees, 0);
  const p2TotalHours = P2_EEO.reduce((sum, row) => sum + row.hours_worked, 0);

  const PROJECT = isProject2
    ? {
      project_name: project_details.project_name || "Project 2 Data",
      project_no: project_details.project_no || "Multi",
      contractor: project_details.contractor || "Various",
      report_period: 'Q4 2025',
      report_date: "2025-12-31",
      total_contract_value: p2TotalContract
    }
    : {
      ...project_details,
      report_period: 'Q4 2025',
      report_date: "2025-12-31",
      total_contract_value: project_details.total_contract_value || 48750000
    };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const attachmentData: Record<string, string> = {};
      for (const [key, val] of Object.entries(attachments)) {
        if (val && val instanceof File) {
          attachmentData[key] = await fileToBase64(val);
        }
      }

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: PROJECT,
          isProject2,
          diversity_goals,
          subcontractors: SUBCONTRACTORS,
          workforce: WORKFORCE,
          p2_util: P2_UTIL,
          p2_eeo: P2_EEO,
          catTotals: cats,
          p2Totals: {
            contract: p2TotalContract,
            towardsGoal: p2TotalTowardsGoal,
            paid: p2TotalPaid,
            headcount: p2TotalHeadcount,
            hours: p2TotalHours,
          },
          editableContent,
          attachments: attachmentData,
          filename: `${PROJECT.project_name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        }),
      });

      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${PROJECT.project_name.replace(/\s+/g, '_')}_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!reportId || screen !== 'report') return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await fetch(`/api/reports/${reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectDetails: PROJECT,
            diversityGoals: diversity_goals,
            subcontractors: SUBCONTRACTORS,
            workforce: WORKFORCE,
            p2Utilization: P2_UTIL,
            p2EEO: P2_EEO,
            editableContent
          })
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [editableContent, diversity_goals, SUBCONTRACTORS, WORKFORCE, P2_UTIL, P2_EEO, reportId, screen]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) setSavedReports(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (screen === 'home') fetchReports();
  }, [screen]);

  const loadReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setReportId(data.id);
      setReportData({
        project_details: data.projectDetails,
        diversity_goals: data.diversityGoals,
        mwbe_sdvob_subcontractors_report: data.subcontractors,
        workforce_demographics: data.workforce,
        project2_utilization: data.p2Utilization,
        project2_eeo_data: data.p2EEO
      });
      if (data.editableContent) setEditableContent(data.editableContent);
      const atts: Record<string, any> = { C: null, D: null, E: null, F: null };
      data.attachments.forEach((a: any) => { atts[a.slot] = { name: a.filename, size: 0, fromDb: true }; });
      setAttachments(atts);
      setScreen("report");
      setProgress(100);
    } catch (err) { alert("Load failed"); }
  };

  const handleFileUpload = async (e: any) => {
    e.preventDefault();
    let files: File[] = [];
    if (e.dataTransfer) files = Array.from(e.dataTransfer.files);
    else if (e.target.files) files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadedFile(files.length === 1 ? files[0].name : `${files.length} files`);
    setProgress(10);
    setScreen("report");
    try {
      let merged: any = {};
      for (const file of files) {
        const data = await parseMWBEExcel(file);
        for (const [k, v] of Object.entries(data)) {
          if (Array.isArray(v) && Array.isArray(merged[k])) merged[k] = [...merged[k], ...v];
          else if (v) merged[k] = v;
        }
      }
      setReportData(merged);
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${merged.project_details?.project_name || "New Report"} - ${new Date().toLocaleDateString()}`,
          projectDetails: merged.project_details,
          diversityGoals: merged.diversity_goals,
          subcontractors: merged.mwbe_sdvob_subcontractors_report,
          workforce: merged.workforce_demographics,
          p2Utilization: merged.project2_utilization,
          p2EEO: merged.project2_eeo_data
        })
      });
      if (res.ok) {
        const saved = await res.json();
        setReportId(saved.id);
      }
      setProgress(100);
    } catch (err) { alert("Parse failed"); setScreen("upload"); setProgress(0); }
  };

  // ── Charts Prep ──
  const goalData = Object.entries(diversity_goals).map(([code, goal]) => ({
    code,
    goal: (goal as number) * 100,
    actual: ((cats[code]?.contract || 0) / PROJECT.total_contract_value) * 100,
  }));

  const totalAsian = WORKFORCE.reduce((sum, d) => sum + (d.asian || 0), 0);
  const totalBlack = WORKFORCE.reduce((sum, d) => sum + (d.black || 0), 0);
  const totalHispanic = WORKFORCE.reduce((sum, d) => sum + (d.hispanic || 0), 0);
  const totalWhite = WORKFORCE.reduce((sum, d) => sum + (d.white || 0), 0);
  const totalHeadcount = totalAsian + totalBlack + totalHispanic + totalWhite;

  const workforceData = [
    { group: "Asian", count: totalAsian },
    { group: "Black", count: totalBlack },
    { group: "Hispanic", count: totalHispanic },
    { group: "White", count: totalWhite },
  ].filter(d => d.count > 0);

  const PIE_COLORS = ["#3b82f6", "#334155", "#ec4899", "#14b8a6", "#f59e0b", "#94a3b8"];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'Inter', sans-serif", padding: "40px 20px" }}>
      <style>{keyframes}</style>

      {/* HOME SCREEN */}
      {screen === "home" && (
        <div style={{ maxWidth: 800, margin: "0 auto", ...fadeUp(0) }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 40 }}>📊</span>
              <h1 style={{ fontSize: 32, fontWeight: 800 }}>DACK Report Engine</h1>
            </div>
            <p style={{ color: "#64748b", fontSize: 18 }}>Manage and generate professional compliance reports</p>
          </div>

          <div style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Saved Reports</h2>
              <button
                onClick={() => setScreen("upload")}
                style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, cursor: "pointer" }}
              >+ New Report</button>
            </div>

            {savedReports.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", background: "#f8fafc", borderRadius: 12, border: "2px dashed #e2e8f0" }}>
                <p>No reports found.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {savedReports.map((r) => (
                  <div key={r.id} onClick={() => loadReport(r.id)} style={{ padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>{r.name}</h3>
                      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Modified {new Date(r.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <span>→</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPLOAD SCREEN */}
      {screen === "upload" && (
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <button onClick={() => setScreen("home")} style={{ marginBottom: 24, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontWeight: 600 }}>← Back</button>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 40 }}>Upload Project Data</h1>
          <div
            style={{ border: "2px dashed #cbd5e1", borderRadius: 16, padding: "60px", background: "white", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileUpload}
          >
            <input type="file" ref={fileRef} style={{ display: "none" }} multiple onChange={handleFileUpload} />
            <p style={{ fontSize: 18, fontWeight: 700 }}>Drop Excel files here or click to browse</p>
            {uploadedFile && <p style={{ color: "#2563eb", marginTop: 12 }}>Selected: {uploadedFile}</p>}
          </div>
        </div>
      )}

      {/* REPORT SCREEN */}
      {screen === "report" && progress < 100 && (
        <div style={{ maxWidth: 480, margin: "100px auto", textAlign: "center" }}>
          <h2 style={{ marginBottom: 24 }}>Processing... {progress}%</h2>
          <div style={{ height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#2563eb", transition: "width 0.4s ease" }} />
          </div>
        </div>
      )}

      {screen === "report" && progress === 100 && (
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 700, cursor: "pointer", marginBottom: 8, display: "block" }}>← Home</button>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>{PROJECT.project_name}</h1>
              <p style={{ color: "#64748b" }}>{PROJECT.project_no} • {PROJECT.report_period}</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {isSaving && <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>Saving...</span>}
              <button onClick={handleExportPDF} disabled={isExporting} style={{ background: "#2563eb", color: "white", padding: "12px 24px", borderRadius: 8, fontWeight: 700, border: "none", cursor: "pointer" }}>
                {isExporting ? "Exporting..." : "Export PDF →"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #e2e8f0", marginBottom: 24 }}>
            {["overview", "subcontractors", "workforce", "report"].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "12px 20px", background: "none", border: "none", borderBottom: activeTab === t ? "2px solid #2563eb" : "2px solid transparent", fontWeight: 600, color: activeTab === t ? "#2563eb" : "#64748b", cursor: "pointer" }}>
                {t === "report" ? "📄 Preview" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ marginBottom: 16 }}>Goal Attainment (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={goalData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="code" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="goal" fill="#e2e8f0" name="Goal %" />
                    <Bar dataKey="actual" fill="#dc2626" name="Actual %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <h3 style={{ marginBottom: 16 }}>Workforce Demographics</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={workforceData} dataKey="count" nameKey="group" cx="50%" cy="50%" outerRadius={80} label>
                      {workforceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "subcontractors" && (
            <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <ReviewTable
                data={isProject2 ? P2_UTIL : SUBCONTRACTORS}
                isProject2={isProject2}
                onUpdate={(newData) => {
                  if (isProject2) setReportData({ project2_utilization: newData });
                  else setReportData({ mwbe_sdvob_subcontractors_report: newData });
                }}
              />
            </div>
          )}

          {activeTab === "workforce" && (
            <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: 12 }}>Employer</th>
                    <th style={{ padding: 12 }}>Asian</th>
                    <th style={{ padding: 12 }}>Black</th>
                    <th style={{ padding: 12 }}>Hispanic</th>
                    <th style={{ padding: 12 }}>White</th>
                  </tr>
                </thead>
                <tbody>
                  {WORKFORCE.map((w, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: 12 }}><strong>{w.employer}</strong></td>
                      <td style={{ padding: 12 }}>{w.asian}</td>
                      <td style={{ padding: 12 }}>{w.black}</td>
                      <td style={{ padding: 12 }}>{w.hispanic}</td>
                      <td style={{ padding: 12 }}>{w.white}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "report" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div ref={reportRef} style={{ background: "white", padding: "60px", borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minHeight: "11in", width: "8.5in", margin: "0 auto", color: "#000" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: 20, marginBottom: 32 }}>
                  <DackLogo scale={0.6} />
                  <div style={{ textAlign: "right" }}>
                    <h2 style={{ margin: 0, textTransform: "uppercase" }}>Compliance Report</h2>
                    <p style={{ margin: 0 }}>Project No. {PROJECT.project_no}</p>
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ textTransform: "uppercase", borderBottom: "1px solid #eee", paddingBottom: 8 }}>1. Executive Summary</h3>
                  <textarea
                    value={editableContent.executiveSummary}
                    onChange={(e) => setEditableContent(prev => ({ ...prev, executiveSummary: e.target.value }))}
                    style={{ width: "100%", minHeight: 120, padding: 12, borderRadius: 4, border: "1px solid #cbd5e1", fontSize: 13, lineHeight: 1.6 }}
                    placeholder="Enter summarizing details..."
                  />
                </div>

                <div style={{ marginBottom: 32 }}>
                  <h3 style={{ textTransform: "uppercase", borderBottom: "1px solid #eee", paddingBottom: 8 }}>2. MWBE Goals</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th style={{ padding: 10, border: "1px solid #eee", textAlign: "left" }}>Category</th>
                        <th style={{ padding: 10, border: "1px solid #eee", textAlign: "right" }}>Goal %</th>
                        <th style={{ padding: 10, border: "1px solid #eee", textAlign: "right" }}>Actual %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(diversity_goals).map(([code, goal]) => (
                        <tr key={code}>
                          <td style={{ padding: 10, border: "1px solid #eee" }}><strong>{code}</strong></td>
                          <td style={{ padding: 10, border: "1px solid #eee", textAlign: "right" }}>{pct(goal as number)}</td>
                          <td style={{ padding: 10, border: "1px solid #eee", textAlign: "right" }}>{pct((cats[code]?.contract || 0) / PROJECT.total_contract_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {["C", "D", "E", "F"].map(slot => (
                  <div key={slot} style={{ marginTop: 40, padding: 24, border: "1px dashed #cbd5e1", borderRadius: 4, background: "#fdfdfd" }}>
                    <h4 style={{ margin: "0 0 12px" }}>Attachment {slot}</h4>
                    {attachments[slot] ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 13 }}>✅ {attachments[slot]?.name}</p>
                        <button onClick={() => setAttachments(p => ({ ...p, [slot]: null }))} style={{ color: "red", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>Remove</button>
                      </div>
                    ) : (
                      <label style={{ cursor: "pointer", color: "#64748b", fontSize: 13 }}>
                        <input type="file" style={{ display: "none" }} accept=".pdf" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setAttachments(p => ({ ...p, [slot]: f }));
                        }} />
                        Click to upload PDF for this slot
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── KEYFRAMES ──
const keyframes = `
  @keyframes fadeUp {
    to { opacity: 1; transform: translateY(0); }
  }
`;

// ── DACK LOGO ──
function DackLogo({ scale = 1 }: { scale?: number }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", transform: `scale(${scale})`, transformOrigin: "left center" }}>
      <div style={{ display: "flex", alignItems: "center", color: "#c1272d", fontWeight: "normal", fontSize: 46, letterSpacing: "1px", fontFamily: "Georgia, serif" }}>
        <span style={{ paddingRight: 6 }}>D</span>
        <div style={{ height: 42, width: 1, backgroundColor: "#64748b", margin: "0 6px" }} />
        <span style={{ padding: "0 6px" }}>A</span>
        <div style={{ height: 42, width: 1, backgroundColor: "#64748b", margin: "0 6px" }} />
        <span style={{ padding: "0 6px" }}>C</span>
        <div style={{ height: 42, width: 1, backgroundColor: "#64748b", margin: "0 6px" }} />
        <span style={{ paddingLeft: 6 }}>K</span>
      </div>
      <span style={{ fontSize: 9, color: "#333", marginTop: 4, letterSpacing: "4px", fontFamily: "sans-serif", fontWeight: 600, textTransform: "uppercase" }}>CONSULTING SOLUTIONS, INC</span>
    </div>
  );
}
