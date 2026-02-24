"use client";

import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

import { parseMWBEExcel } from '@/lib/excelParser';
import { useReportStore } from '@/store/reportStore';
import ReviewTable from '@/components/ReviewTable';

// ── Helpers ──
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;


// ── Animations ──
const fadeUp = (delay: number = 0): React.CSSProperties => ({
  opacity: 0,
  transform: "translateY(20px)",
  animation: `fadeUp 0.5s ease ${delay}s forwards`,
});

// ── MAIN APP ──
export default function DIReportEngine() {
  const [screen, setScreen] = useState("upload"); // upload | processing | dashboard | report
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    let file: File | null = null;
    if ('dataTransfer' in e && e.dataTransfer?.files.length) file = e.dataTransfer.files[0];
    else if ('target' in e && (e.target as HTMLInputElement).files?.length) file = (e.target as HTMLInputElement).files![0];

    if (file) {
      setUploadedFile(file.name);
      setScreen("processing");
      try {
        const data = await parseMWBEExcel(file);
        setReportData(data);
      } catch (err) {
        console.error(err);
        alert("Failed to parse Excel file.");
      }
    }
  };

  // Simulated processing
  useEffect(() => {
    if (screen === "processing" && uploadedFile) {
      const steps = [
        { p: 15, t: 300 }, { p: 35, t: 600 }, { p: 65, t: 1000 },
        { p: 85, t: 1500 }, { p: 100, t: 2000 },
      ];
      steps.forEach(({ p, t }) => setTimeout(() => setProgress(p), t));
      setTimeout(() => setScreen("dashboard"), 2200);
    }
  }, [screen, uploadedFile]);

  // Derived Category Totals (Project 1)
  const catTotals: Record<string, { contract: number; paid: number; count: number }> = {};
  SUBCONTRACTORS.forEach((s) => {
    const code = s.code === 'Non-M/WBE' ? 'Non-MWBE' : s.code;
    if (!catTotals[code]) catTotals[code] = { contract: 0, paid: 0, count: 0 };
    catTotals[code].contract += (s.towards_goal || s.total_contract);
    catTotals[code].paid += s.total_paid_to_date;
    catTotals[code].count += 1;
  });
  const cats = catTotals;

  // Derived Totals (Project 2)
  const p2TotalContract = P2_UTIL.reduce((sum, row) => sum + row.value, 0);
  const p2TotalTowardsGoal = P2_UTIL.reduce((sum, row) => sum + row.towards_goal, 0);
  const p2TotalPaid = P2_UTIL.reduce((sum, row) => sum + row.paid_to_date, 0);

  const p2TotalHeadcount = P2_EEO.reduce((sum, row) => sum + row.num_employees, 0);
  const p2TotalHours = P2_EEO.reduce((sum, row) => sum + row.hours_worked, 0);

  // Group P2 Demographics by Ethnicity
  const p2EthTotals: Record<string, number> = {};
  P2_EEO.forEach(row => {
    p2EthTotals[row.race_ethnicity] = (p2EthTotals[row.race_ethnicity] || 0) + row.num_employees;
  });
  const p2EthChartData = Object.entries(p2EthTotals).map(([eth, count]) => ({ eth, count })).filter(d => d.count > 0);

  // Group P2 Demographics by Gender
  const p2GenderTotals: Record<string, number> = {};
  P2_EEO.forEach(row => {
    p2GenderTotals[row.gender] = (p2GenderTotals[row.gender] || 0) + row.num_employees;
  });
  const p2GenderChartData = Object.entries(p2GenderTotals).map(([gender, count]) => ({ gender, count })).filter(d => d.count > 0);

  // ── UPLOAD SCREEN ──
  if (screen === "upload") {
    return (
      <div style={styles.app as React.CSSProperties}>
        <style>{keyframes}</style>
        <Header subtitle="MWBE/SDVOB Utilization & EEO Compliance Report Engine" />
        <div style={styles.uploadContainer as React.CSSProperties}>
          <div style={{ ...styles.uploadZone, ...fadeUp(0.1) } as React.CSSProperties}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileUpload}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFileUpload} />
            <div style={styles.uploadIcon as React.CSSProperties}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            </div>
            <p style={styles.uploadTitle as React.CSSProperties}>Drop your Excel report data here</p>
            <p style={styles.uploadSub as React.CSSProperties}>Accepts .xlsx, .xls, .csv — Raw data, Ad sheets, payment reports</p>
          </div>

          {uploadedFile && (
            <div style={{ ...styles.fileCard, ...fadeUp(0.2) } as React.CSSProperties}>
              <div style={styles.fileIcon as React.CSSProperties}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <p style={styles.fileName as React.CSSProperties}>{uploadedFile}</p>
                <p style={styles.fileSize as React.CSSProperties}>2.4 MB — Ready to process</p>
              </div>
              <button style={styles.processBtn as React.CSSProperties} onClick={() => setScreen("processing")}>
                Generate Report →
              </button>
            </div>
          )}

          <div style={{ ...styles.infoGrid, ...fadeUp(0.3) } as React.CSSProperties}>
            {[
              { icon: "📊", title: "Auto-Parse", desc: "Extracts subcontractor data, payments, workforce hours from raw Excel" },
              { icon: "📈", title: "Chart Generation", desc: "Diversity goal tracking, payment breakdowns, workforce demographics" },
              { icon: "📄", title: "Report Export", desc: "Branded dynamic report matching your exact template structure" },
            ].map((item, i) => (
              <div key={i} style={styles.infoCard as React.CSSProperties}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <p style={styles.infoTitle as React.CSSProperties}>{item.title}</p>
                <p style={styles.infoDesc as React.CSSProperties}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PROCESSING SCREEN ──
  if (screen === "processing") {
    const steps = [
      { label: "Reading Excel sheets...", threshold: 0 },
      { label: "Extracting MWBE/SDVOB entries...", threshold: 20 },
      { label: "Parsing workforce Ad sheet...", threshold: 40 },
      { label: "Calculating goal attainment...", threshold: 60 },
      { label: "Generating charts...", threshold: 80 },
      { label: "Assembling report...", threshold: 95 },
    ];
    return (
      <div style={styles.app as React.CSSProperties}>
        <style>{keyframes}</style>
        <Header subtitle="Processing your data..." />
        <div style={styles.processingContainer as React.CSSProperties}>
          <div style={styles.progressOuter as React.CSSProperties}>
            <div style={{ ...styles.progressInner, width: `${progress}%` } as React.CSSProperties} />
          </div>
          <p style={styles.progressPct as React.CSSProperties}>{progress}%</p>
          <div style={styles.stepList as React.CSSProperties}>
            {steps.map((s, i) => (
              <div key={i} style={{ ...styles.stepItem, opacity: progress >= s.threshold ? 1 : 0.3 } as React.CSSProperties}>
                <span style={{ color: progress >= s.threshold + 15 ? "#22c55e" : progress >= s.threshold ? "#f59e0b" : "#475569", marginRight: 10, fontSize: 16 }}>
                  {progress >= s.threshold + 15 ? "✓" : progress >= s.threshold ? "⟳" : "○"}
                </span>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD / REPORT SCREEN ──
  const PROJECT = isProject2
    ? { project_name: "Project 2 (Utilization & EEO)", project_no: "Multi", contractor: "Various", report_period: 'Q4 2025', report_date: "2025-12-31", total_contract_value: p2TotalContract }
    : { ...project_details, report_period: 'Q4 2025', report_date: "2025-12-31", total_contract_value: 48750000 };

  const goalData = Object.entries(diversity_goals).map(([code, goal]) => ({
    code,
    goal: goal * 100,
    actual: ((cats[code]?.contract || 0) / PROJECT.total_contract_value) * 100,
  }));

  const paymentData = Object.entries(cats).map(([code, d]) => ({
    code,
    contracted: d.contract,
    paid: d.paid,
    balance: d.contract - d.paid,
  })).filter(d => d.contracted > 0);

  // Workforce stats calculation
  const totalAsian = WORKFORCE.reduce((sum, d) => sum + d.asian, 0);
  const totalBlack = WORKFORCE.reduce((sum, d) => sum + d.black, 0);
  const totalHispanic = WORKFORCE.reduce((sum, d) => sum + d.hispanic, 0);
  const totalWhite = WORKFORCE.reduce((sum, d) => sum + d.white, 0);
  const totalPacific = WORKFORCE.reduce((sum, d) => sum + d.pacific_islander, 0);
  const totalUnknown = WORKFORCE.reduce((sum, d) => sum + d.unknown, 0);

  const totalHeadcount = totalAsian + totalBlack + totalHispanic + totalWhite + totalPacific + totalUnknown;

  const workforceData = [
    { group: "Asian", count: totalAsian, pct: totalHeadcount ? (totalAsian / totalHeadcount) * 100 : 0 },
    { group: "Black", count: totalBlack, pct: totalHeadcount ? (totalBlack / totalHeadcount) * 100 : 0 },
    { group: "Hispanic", count: totalHispanic, pct: totalHeadcount ? (totalHispanic / totalHeadcount) * 100 : 0 },
    { group: "White", count: totalWhite, pct: totalHeadcount ? (totalWhite / totalHeadcount) * 100 : 0 },
    { group: "Pacific Isl.", count: totalPacific, pct: totalHeadcount ? (totalPacific / totalHeadcount) * 100 : 0 },
    { group: "Unknown", count: totalUnknown, pct: totalHeadcount ? (totalUnknown / totalHeadcount) * 100 : 0 },
  ].filter(d => d.count > 0);

  const COLORS: Record<string, string> = { MBE: "#dc2626", WBE: "#ec4899", SDVOB: "#f59e0b", "Non-MWBE": "#64748b" };
  const PIE_COLORS = ["#3b82f6", "#334155", "#ec4899", "#14b8a6", "#f59e0b", "#94a3b8"];

  const totalDiversity = ["MBE", "WBE", "SDVOB"].reduce((a, c) => a + (cats[c]?.contract || 0), 0);

  return (
    <div style={styles.app as React.CSSProperties}>
      <style>{keyframes}</style>
      <Header subtitle={`${PROJECT.project_name} — ${PROJECT.report_period} Report`} />

      {/* Tab Navigation */}
      <div style={styles.tabBar as React.CSSProperties}>
        {["overview", "subcontractors", "workforce", "report"].map((tab) => (
          <button
            key={tab}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) } as React.CSSProperties}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "overview" ? "📊 Overview" : tab === "subcontractors" ? "📋 Utilization & Compliance" : tab === "workforce" ? "👷 EEO Compliance" : "📄 Report Preview"}
          </button>
        ))}
      </div>

      <div style={styles.content as React.CSSProperties}>
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            {/* KPI Cards */}
            <div style={styles.kpiGrid as React.CSSProperties}>
              {isProject2 ? (
                // Project 2 KPIs
                [
                  { label: "Total Contract Value", value: fmt(p2TotalContract), accent: "#dc2626" },
                  { label: "Towards Goal", value: fmt(p2TotalTowardsGoal), accent: "#22c55e" },
                  { label: "Total Paid to Date", value: fmt(p2TotalPaid), accent: "#ec4899" },
                  { label: "Total EEO Headcount", value: p2TotalHeadcount.toString(), accent: "#f59e0b" },
                ].map((kpi, i) => (
                  <div key={i} style={{ ...styles.kpiCard, ...fadeUp(i * 0.08) } as React.CSSProperties}>
                    <div style={{ ...styles.kpiAccent, background: kpi.accent } as React.CSSProperties} />
                    <p style={styles.kpiLabel as React.CSSProperties}>{kpi.label}</p>
                    <p style={styles.kpiValue as React.CSSProperties}>{kpi.value}</p>
                  </div>
                ))
              ) : (
                // Project 1 KPIs
                [
                  { label: "Total Contract Value", value: fmt(PROJECT.total_contract_value), accent: "#dc2626" },
                  { label: "MWBE/SDVOB Utilization", value: fmt(totalDiversity), accent: "#22c55e" },
                  { label: "Utilization %", value: pct(totalDiversity / PROJECT.total_contract_value), accent: "#ec4899" },
                  { label: "Firms", value: SUBCONTRACTORS.length.toString(), accent: "#f59e0b" },
                ].map((kpi, i) => (
                  <div key={i} style={{ ...styles.kpiCard, ...fadeUp(i * 0.08) } as React.CSSProperties}>
                    <div style={{ ...styles.kpiAccent, background: kpi.accent } as React.CSSProperties} />
                    <p style={styles.kpiLabel as React.CSSProperties}>{kpi.label}</p>
                    <p style={styles.kpiValue as React.CSSProperties}>{kpi.value}</p>
                  </div>
                ))
              )}
            </div>

            {/* Charts Row */}
            <div style={styles.chartGrid as React.CSSProperties}>
              <div style={{ ...styles.chartCard, ...fadeUp(0.2) } as React.CSSProperties}>
                <p style={styles.chartTitle as React.CSSProperties}>
                  {isProject2 ? "EEO Headcount by Ethnicity" : "Goal Attainment by Category"}
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  {isProject2 ? (
                    <BarChart data={p2EthChartData} barCategoryGap="25%" layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                      <YAxis type="category" dataKey="eth" stroke="#94a3b8" fontSize={11} width={120} />
                      <Tooltip contentStyle={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a" }} />
                      <Bar dataKey="count" name="Headcount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={goalData} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="code" stroke="#94a3b8" fontSize={13} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a" }}
                        formatter={(v: any) => [`${Number(v).toFixed(1)}%`]}
                      />
                      <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                      <Bar dataKey="goal" name="Goal" fill="#334155" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                        {goalData.map((entry, i) => (
                          <Cell key={i} fill={entry.actual >= entry.goal ? "#22c55e" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div style={{ ...styles.chartCard, ...fadeUp(0.3) } as React.CSSProperties}>
                <p style={styles.chartTitle as React.CSSProperties}>Workforce Demographics</p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={workforceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="hours"
                      nameKey="group"
                    >
                      {workforceData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a" }}
                      formatter={(v: any, name: string | undefined) => [`${v.toLocaleString()} hrs`, name]}
                    />
                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Status */}
            <div style={{ ...styles.chartCard, ...fadeUp(0.4) } as React.CSSProperties}>
              <p style={styles.chartTitle as React.CSSProperties}>Payment Status by Category</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={paymentData} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                  <YAxis type="category" dataKey="code" stroke="#94a3b8" fontSize={13} width={60} />
                  <Tooltip
                    contentStyle={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a" }}
                    formatter={(v: any) => [fmt(v)]}
                  />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                  <Bar dataKey="paid" name="Paid to Date" fill="#22c55e" radius={[0, 4, 4, 0]} stackId="a" />
                  <Bar dataKey="balance" name="Remaining" fill="#334155" radius={[0, 4, 4, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ── SUBCONTRACTORS TAB ── */}
        {activeTab === "subcontractors" && (
          <div style={{ ...styles.chartCard, ...fadeUp(0.1), overflow: "auto", padding: 0 } as React.CSSProperties}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 16px" }}>
              <p style={styles.chartTitle as React.CSSProperties}>MWBE/SDVOB Utilization</p>
              {!isProject2 && (
                <div style={{ display: "flex", gap: 8 }}>
                  {Object.entries(COLORS).map(([code, color]) => (
                    <span key={code} style={{ background: `${color}22`, color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {code}: {cats[code]?.count || 0} firms
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isProject2 ? (
              // Project 2 utilization table
              <table style={{ ...styles.reportTable, margin: 0 } as React.CSSProperties}>
                <thead>
                  <tr>
                    <th style={styles.reportTh as React.CSSProperties}>Company</th>
                    <th style={styles.reportTh as React.CSSProperties}>Value</th>
                    <th style={styles.reportTh as React.CSSProperties}>Towards Goal</th>
                    <th style={styles.reportTh as React.CSSProperties}>Paid to Date</th>
                    <th style={styles.reportTh as React.CSSProperties}>Pending Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {P2_UTIL.map((row) => (
                    <tr key={row.id}>
                      <td style={styles.reportTd as React.CSSProperties}><strong>{row.company}</strong></td>
                      <td style={styles.reportTd as React.CSSProperties}>{fmt(row.value)}</td>
                      <td style={styles.reportTd as React.CSSProperties}>{fmt(row.towards_goal)}</td>
                      <td style={{ ...styles.reportTd, color: '#22c55e', fontWeight: 600 } as React.CSSProperties}>{fmt(row.paid_to_date)}</td>
                      <td style={{ ...styles.reportTd, color: row.pending_payment > 0 ? '#f59e0b' : '#94a3b8' } as React.CSSProperties}>{fmt(row.pending_payment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // Project 1 interactive review table
              <ReviewTable />
            )}
          </div>
        )}

        {/* ── WORKFORCE TAB ── */}
        {activeTab === "workforce" && (
          <>
            {isProject2 ? (
              // -- PROJECT 2 WORKFORCE DEMOGRAPHICS --
              <>
                <div style={styles.kpiGrid as React.CSSProperties}>
                  {[
                    { label: "Total EEO Headcount", value: p2TotalHeadcount.toLocaleString(), accent: "#dc2626" },
                    { label: "Total Hours Worked", value: p2TotalHours.toLocaleString(), accent: "#334155" },
                    { label: "Firms Reporting", value: [...new Set(P2_EEO.map(r => r.company))].length.toString(), accent: "#ec4899" },
                    { label: "Total Gross Wages", value: fmt(P2_EEO.reduce((s, r) => s + r.gross_wages, 0)), accent: "#3b82f6" },
                  ].map((kpi, i) => (
                    <div key={i} style={{ ...styles.kpiCard, ...fadeUp(i * 0.08) } as React.CSSProperties}>
                      <div style={{ ...styles.kpiAccent, background: kpi.accent } as React.CSSProperties} />
                      <p style={styles.kpiLabel as React.CSSProperties}>{kpi.label}</p>
                      <p style={{ ...styles.kpiValue, fontSize: 22 } as React.CSSProperties}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div style={styles.chartGrid as React.CSSProperties}>
                  <div style={{ ...styles.chartCard, ...fadeUp(0.2) } as React.CSSProperties}>
                    <p style={styles.chartTitle as React.CSSProperties}>EEO Headcount by Ethnicity</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={p2EthChartData} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="eth" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a" }}
                          formatter={(v: any) => [`${v.toLocaleString()} workers`]}
                        />
                        <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                          {p2EthChartData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...styles.chartCard, ...fadeUp(0.3) } as React.CSSProperties}>
                    <p style={styles.chartTitle as React.CSSProperties}>EEO Headcount by Gender</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={p2GenderChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={105}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="gender"
                        >
                          {p2GenderChartData.map((entry, i) => (
                            <Cell key={i} fill={entry.gender === "Female" ? "#ec4899" : entry.gender === "Male" ? "#3b82f6" : "#f59e0b"} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a" }}
                          formatter={(v: any, name: string | undefined) => [`${v.toLocaleString()} workers`, name]}
                        />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              // -- PROJECT 1 WORKFORCE DEMOGRAPHICS --
              <>
                <div style={styles.kpiGrid as React.CSSProperties}>
                  {[
                    { label: "Total EEO Headcount", value: totalHeadcount.toLocaleString(), accent: "#dc2626" },
                    { label: "African American", value: `${totalBlack.toLocaleString()} (${pct(totalHeadcount ? totalBlack / totalHeadcount : 0)})`, accent: "#334155" },
                    { label: "Hispanic", value: `${totalHispanic.toLocaleString()} (${pct(totalHeadcount ? totalHispanic / totalHeadcount : 0)})`, accent: "#ec4899" },
                    { label: "Asian", value: `${totalAsian.toLocaleString()} (${pct(totalHeadcount ? totalAsian / totalHeadcount : 0)})`, accent: "#3b82f6" },
                  ].map((kpi, i) => (
                    <div key={i} style={{ ...styles.kpiCard, ...fadeUp(i * 0.08) } as React.CSSProperties}>
                      <div style={{ ...styles.kpiAccent, background: kpi.accent } as React.CSSProperties} />
                      <p style={styles.kpiLabel as React.CSSProperties}>{kpi.label}</p>
                      <p style={{ ...styles.kpiValue, fontSize: 22 } as React.CSSProperties}>{kpi.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ ...styles.chartCard, ...fadeUp(0.2) } as React.CSSProperties}>
                  <p style={styles.chartTitle as React.CSSProperties}>EEO Demographics by Group</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workforceData} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="group" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{ background: "#e2e8f0", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a" }}
                        formatter={(v: any) => [`${v.toLocaleString()} workers`]}
                      />
                      <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                        {workforceData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ ...styles.chartCard, ...fadeUp(0.3) } as React.CSSProperties}>
                  <p style={styles.chartTitle as React.CSSProperties}>EEO Demographics by Employer</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {WORKFORCE.map((emp, i) => (
                      <div key={i} style={{ background: '#ffffff', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
                        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.employer}</p>
                        <div style={{ height: 180 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[emp]} barCategoryGap="25%">
                              <XAxis dataKey="month" hide />
                              <YAxis stroke="#64748b" fontSize={10} width={30} />
                              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#0f172a", fontSize: 11, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="asian" name="Asian" stackId="a" fill="#3b82f6" />
                              <Bar dataKey="black" name="Black" stackId="a" fill="#334155" />
                              <Bar dataKey="hispanic" name="Hispanic" stackId="a" fill="#ec4899" />
                              <Bar dataKey="white" name="White" stackId="a" fill="#14b8a6" />
                              <Bar dataKey="pacific_islander" name="Pacific Isl." stackId="a" fill="#f59e0b" />
                              <Bar dataKey="unknown" name="Unknown" stackId="a" fill="#94a3b8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── UNIFIED FINAL REPORT PREVIEW TAB (PDF Export Target) ── */}
        {activeTab === "report" && (
          <div style={{ ...styles.reportPreview, ...fadeUp(0.1), flexDirection: "column", gap: "24px" } as React.CSSProperties}>

            {/* Action Bar (Hidden when printing) */}
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", maxWidth: 820, width: "100%" }}>
              <button
                style={styles.exportBtn as React.CSSProperties}
                onClick={() => window.print()}
              >
                🖨️ Export as PDF
              </button>
            </div>

            {/* PAGE 1: COVER PAGE */}
            <div className="print-page cover-page" style={{ ...styles.reportPage, padding: 0, position: "relative", display: "flex", height: "10.5in" } as React.CSSProperties}>

              {/* Left Side - White */}
              <div style={{ flex: 1.5, background: "white", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div> {/* Top Logo Space */} </div>

                <div style={{ marginBottom: 40 }}>
                  <DackLogo scale={0.8} />
                </div>
              </div>

              {/* Right Side - Green */}
              <div style={{ flex: 1, background: "#a3d18e", padding: "60px 40px 40px 40px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <h2 style={{ fontSize: 24, fontWeight: 500, color: "white", margin: "0 0 16px 0", letterSpacing: "1px" }}>PHASE I</h2>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "white", margin: "0 0 8px 0", lineHeight: 1.2 }}>MWBE/EEO<br />OVERVIEW REPORT</h1>
                <p style={{ fontSize: 14, color: "white", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 16px 0" }}>{PROJECT.report_period}</p>
                <p style={{ fontSize: 13, color: "white", margin: 0 }}>{new Date().toLocaleDateString()}</p>
              </div>

              {/* Absolute Black Strap */}
              <div style={{ position: "absolute", top: "30%", left: 0, width: "100%", background: "black", color: "white", padding: "20px 40px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{PROJECT.project_name}</h3>
                  <p style={{ margin: "4px 0 0 0", fontSize: 14, textTransform: "uppercase" }}>Project No. {PROJECT.project_no}</p>
                </div>
              </div>
            </div>

            {/* PAGE 2: TABLE OF CONTENTS */}
            <div className="print-page" style={styles.reportPage as React.CSSProperties}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 32, textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", paddingBottom: 16 }}>Table of Contents</h2>
              <div style={{ fontSize: 16, lineHeight: 2.2, color: "#334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>1. EXECUTIVE SUMMARY</span><span>1</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>2. GOALS</span><span>2</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>3. OUTREACH</span><span>3</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>4. MWBE/SDVOB COMPLIANCE</span><span>4</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>5. MWBE/SDVOB PAYMENTS</span><span>6</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>6. WORKFORCE DIVERSITY</span><span>10</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontWeight: 700 }}><span>ATTACHMENT A: PAYMENT DETAILS</span><span>14</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>ATTACHMENT B: EEO WORKFORCE UTILIZATION</span><span>17</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>ATTACHMENT C: CONTRACTOR LOGS</span><span>20</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>ATTACHMENT D: CORRESPONDENCE</span><span>22</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>ATTACHMENT E: CERTIFICATES</span><span>25</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}><span>ATTACHMENT F: WAIVER DETERMINATION</span><span>27</span></div>
              </div>
            </div>

            {/* PAGE 3: EXECUTIVE SUMMARY */}
            <div className="print-page" style={styles.reportPage as React.CSSProperties}>
              <div style={styles.reportSection as React.CSSProperties}>
                <h3 style={styles.reportSectionTitle as React.CSSProperties}>1. Executive Summary</h3>
                <p style={styles.reportText as React.CSSProperties}>
                  This report provides a comprehensive overview of the MWBE and SDVOB utilization and EEO workforce compliance for the <strong>{PROJECT.project_name}</strong> project during the <strong>{PROJECT.report_period}</strong> reporting period up to <strong>{PROJECT.report_date}</strong>.
                </p>

                {isProject2 ? (
                  <p style={styles.reportText as React.CSSProperties}>
                    As of this period, the total tracked contract value for utilization stands at <strong>{fmt(p2TotalContract)}</strong>. Total payments made to tracked subcontractors to date amount to <strong>{fmt(p2TotalPaid)}</strong>, representing <strong>{pct(p2TotalContract > 0 ? p2TotalPaid / p2TotalContract : 0)}</strong> of the total contract value. The project currently tracks utilization across <strong>{P2_UTIL.length} recorded firms</strong> and monitors EEO compliance for <strong>{p2TotalHeadcount.toLocaleString()} employees</strong>.
                  </p>
                ) : (
                  <p style={styles.reportText as React.CSSProperties}>
                    As of this period, the total contract value stands at <strong>{fmt(PROJECT.total_contract_value)}</strong>. Total payments made to MWBE and SDVOB subcontractors to date amount to <strong>{fmt(Object.values(catTotals).reduce((a, c) => a + c.paid, 0))}</strong>, representing <strong>{pct(Object.values(catTotals).reduce((a, c) => a + c.paid, 0) / PROJECT.total_contract_value)}</strong> of the total contract value. The project currently engages <strong>{SUBCONTRACTORS.length} certified diverse subcontractors</strong>.
                  </p>
                )}
              </div>

              {/* PAGE 4: GOALS & OUTREACH */}
              <div className="print-page" style={styles.reportPage as React.CSSProperties}>
                <div style={styles.reportSection as React.CSSProperties}>
                  <h3 style={styles.reportSectionTitle as React.CSSProperties}>2. Goals</h3>
                  <p style={styles.reportText as React.CSSProperties}>
                    Project-specific participation goals were established to promote diversity and equitable access to contracting opportunities on the project. After an extensive review of the efforts made to engage and contract MWBE and SDVOB firms, the utilization plan accurately reflects the availability and capacity of qualified firms in the marketplace. DACK Consulting Solutions played a crucial role in documenting, verifying, and justifying any waiver requests by demonstrating good-faith efforts.
                  </p>
                </div>

                <div style={styles.reportSection as React.CSSProperties}>
                  <h3 style={styles.reportSectionTitle as React.CSSProperties}>3. Outreach Efforts</h3>
                  <p style={styles.reportText as React.CSSProperties}>
                    To increase participation of MWBE/SDVOB firms in the project, rigorous outreach was provided during the bidding phase. We utilize a variety of methods to engage the community including informational e-blasts, social media outreach, partnering with local chambers and civic organizations, and coordinating information sessions.
                    <br /><br />
                    *Note: Specific outreach events for this reporting period are logged in the project communications ledger.*
                  </p>
                </div>
              </div>

              {/* PAGE 5: COMPLIANCE */}
              <div className="print-page" style={styles.reportPage as React.CSSProperties}>
                <div style={styles.reportSection as React.CSSProperties}>
                  <h3 style={styles.reportSectionTitle as React.CSSProperties}>3. MWBE/SDVOB Compliance</h3>
                  <p style={styles.reportText as React.CSSProperties}>
                    As the compliance monitor, we play a critical role in supporting and verifying MWBE/SDVOB goals. A key component of these responsibilities includes Compliance Monitoring, which entails reviewing awarded contracts and assessing whether certified firms are being utilized in accordance with established requirements.
                  </p>

                  {!isProject2 && (
                    <div style={{ marginTop: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 8 }}>Goal Attainment Status</h4>
                      <table style={styles.reportTable as React.CSSProperties}>
                        <thead>
                          <tr>
                            <th style={styles.reportTh as React.CSSProperties}>Category</th>
                            <th style={styles.reportTh as React.CSSProperties}>Goal</th>
                            <th style={styles.reportTh as React.CSSProperties}>Actual</th>
                            <th style={styles.reportTh as React.CSSProperties}>Allocated</th>
                            <th style={styles.reportTh as React.CSSProperties}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(diversity_goals).map(([code, goal]) => {
                            const actual = (cats[code]?.contract || 0) / PROJECT.total_contract_value;
                            const met = actual >= goal;
                            return (
                              <tr key={code}>
                                <td style={styles.reportTd as React.CSSProperties}><strong>{code}</strong></td>
                                <td style={styles.reportTd as React.CSSProperties}>{pct(goal)}</td>
                                <td style={{ ...styles.reportTd, color: met ? "#16a34a" : "#dc2626", fontWeight: 700 } as React.CSSProperties}>{pct(actual)}</td>
                                <td style={styles.reportTd as React.CSSProperties}>{fmt(cats[code]?.contract || 0)}</td>
                                <td style={styles.reportTd as React.CSSProperties}>
                                  {met ? "✓ Met" : "✗ Below"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* PAGE 6: PAYMENTS LEDGER */}
              <div className="print-page" style={{ ...styles.reportPage, maxWidth: "100%" } as React.CSSProperties}>
                <div style={styles.reportSection as React.CSSProperties}>
                  <h3 style={styles.reportSectionTitle as React.CSSProperties}>4. Payments & Subcontractor Utilization</h3>
                  <p style={styles.reportText as React.CSSProperties}>
                    The following table details the tracked financial payments made to subcontractors against their awarded values.
                  </p>

                  <div style={{ marginTop: 20 }}>
                    <table style={styles.reportTable as React.CSSProperties}>
                      <thead>
                        <tr>
                          <th style={styles.reportTh as React.CSSProperties}>Company</th>
                          <th style={styles.reportTh as React.CSSProperties}>Contract Value</th>
                          <th style={styles.reportTh as React.CSSProperties}>Towards Goal</th>
                          <th style={styles.reportTh as React.CSSProperties}>Paid to Date</th>
                          <th style={styles.reportTh as React.CSSProperties}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isProject2 ? (
                          P2_UTIL.map((row) => (
                            <tr key={row.id}>
                              <td style={styles.reportTd as React.CSSProperties}><strong>{row.company}</strong></td>
                              <td style={styles.reportTd as React.CSSProperties}>{fmt(row.value)}</td>
                              <td style={styles.reportTd as React.CSSProperties}>{fmt(row.towards_goal)}</td>
                              <td style={styles.reportTd as React.CSSProperties}>{fmt(row.paid_to_date)}</td>
                              <td style={styles.reportTd as React.CSSProperties}>{row.pending_payment > 0 ? 'Pending' : 'Current'}</td>
                            </tr>
                          ))
                        ) : (
                          SUBCONTRACTORS.map((row) => (
                            <tr key={row.id}>
                              <td style={styles.reportTd as React.CSSProperties}><strong>{row.name}</strong> <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>{row.code}</span></td>
                              <td style={styles.reportTd as React.CSSProperties}>{fmt(row.total_contract)}</td>
                              <td style={styles.reportTd as React.CSSProperties}>{fmt(row.towards_goal)}</td>
                              <td style={styles.reportTd as React.CSSProperties}>{fmt(row.total_paid_to_date)}</td>
                              <td style={styles.reportTd as React.CSSProperties}>{row.balance > 0 ? 'Balance Due' : 'Paid Full'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ATTACHMENT A: RAW PAYMENT LOGS (Simulating pages 14-16) */}
              <div className="print-page" style={{ ...styles.reportPage, maxWidth: "100%", opacity: 0.5 } as React.CSSProperties}>
                <div style={styles.reportSection as React.CSSProperties}>
                  <h3 style={styles.reportSectionTitle as React.CSSProperties}>ATTACHMENT A: Payment Details</h3>
                  <p style={styles.reportText as React.CSSProperties}>[PAGES 14-16 CONTINUED DATA DUMP]</p>
                </div>
              </div>

              {/* ATTACHMENT B - WORKFORCE UTILIZATION */}
              <div className="print-page" style={{ ...styles.reportPage, maxWidth: "100%" } as React.CSSProperties}>
                <div style={styles.reportSection as React.CSSProperties}>
                  <h3 style={styles.reportSectionTitle as React.CSSProperties}>ATTACHMENT B: EEO Workforce Utilization</h3>

                  <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
                    <div style={{ flex: 1, padding: "16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                      <p style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700, margin: "0 0 4px" }}>Total Headcount</p>
                      <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>{isProject2 ? p2TotalHeadcount.toLocaleString() : totalHeadcount.toLocaleString()}</p>
                    </div>
                    {isProject2 && (
                      <div style={{ flex: 1, padding: "16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <p style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700, margin: "0 0 4px" }}>Total Hours</p>
                        <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>{p2TotalHours.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <table style={styles.reportTable as React.CSSProperties}>
                    <thead>
                      <tr>
                        <th style={styles.reportTh as React.CSSProperties}>Reporting Firm</th>
                        <th style={styles.reportTh as React.CSSProperties}>Asian</th>
                        <th style={styles.reportTh as React.CSSProperties}>Black</th>
                        <th style={styles.reportTh as React.CSSProperties}>Hispanic</th>
                        <th style={styles.reportTh as React.CSSProperties}>White</th>
                        <th style={styles.reportTh as React.CSSProperties}>Pacific Isl.</th>
                        <th style={styles.reportTh as React.CSSProperties}>Unknown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isProject2 ? (
                        // Project 2 has it by race_ethnicity string records, we'd group them by company to show a matrix
                        // For now, listing out the parsed EEO logs
                        P2_EEO.slice(0, 50).map((row) => (
                          <tr key={row.id}>
                            <td style={styles.reportTd as React.CSSProperties}><strong>{row.company}</strong></td>
                            <td colSpan={6} style={styles.reportTd as React.CSSProperties}>{row.num_employees} employees ({row.race_ethnicity} - {row.gender})</td>
                          </tr>
                        ))
                      ) : (
                        WORKFORCE.map((emp, i) => (
                          <tr key={i}>
                            <td style={styles.reportTd as React.CSSProperties}><strong>{emp.employer}</strong></td>
                            <td style={styles.reportTd as React.CSSProperties}>{emp.asian}</td>
                            <td style={styles.reportTd as React.CSSProperties}>{emp.black}</td>
                            <td style={styles.reportTd as React.CSSProperties}>{emp.hispanic}</td>
                            <td style={styles.reportTd as React.CSSProperties}>{emp.white}</td>
                            <td style={styles.reportTd as React.CSSProperties}>{emp.pacific_islander}</td>
                            <td style={styles.reportTd as React.CSSProperties}>{emp.unknown}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="print-footer" style={{ ...styles.printFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'absolute', bottom: '1in', left: 0, padding: '0 1in' } as React.CSSProperties}>
                <span style={{ fontSize: 12, color: "#333", flex: 1, textAlign: 'center' }}>Page 17 of 27</span>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <DackLogo scale={0.35} />
                </div>
              </div>
            </div>

            {/* ATTACHMENTS C-F (Static layout breakers to simulate 27 pages) */}
            <div className="print-page relative-page" style={{ ...styles.reportPage, opacity: 0.5 } as React.CSSProperties}>
              <h3 style={{ ...styles.reportSectionTitle, fontSize: 24 } as React.CSSProperties}>ATTACHMENT C: Contractor Logs</h3>
              <p>[PAGES 20-21: Subcontractor site logs inserted here]</p>

              <div className="print-footer" style={{ ...styles.printFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'absolute', bottom: '1in', left: 0, padding: '0 1in' } as React.CSSProperties}>
                <span style={{ fontSize: 12, color: "#333", flex: 1, textAlign: 'center' }}>Page 20 of 27</span>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <DackLogo scale={0.35} />
                </div>
              </div>
            </div>
            <div className="print-page relative-page" style={{ ...styles.reportPage, opacity: 0.5 } as React.CSSProperties}>
              <h3 style={{ ...styles.reportSectionTitle, fontSize: 24 } as React.CSSProperties}>ATTACHMENT D: Correspondence</h3>
              <p>[PAGES 22-24: Email outreach documentation inserted here]</p>

              <div className="print-footer" style={{ ...styles.printFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'absolute', bottom: '1in', left: 0, padding: '0 1in' } as React.CSSProperties}>
                <span style={{ fontSize: 12, color: "#333", flex: 1, textAlign: 'center' }}>Page 22 of 27</span>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <DackLogo scale={0.35} />
                </div>
              </div>
            </div>
            <div className="print-page relative-page" style={{ ...styles.reportPage, opacity: 0.5 } as React.CSSProperties}>
              <h3 style={{ ...styles.reportSectionTitle, fontSize: 24 } as React.CSSProperties}>ATTACHMENT E: Certificates</h3>
              <p>[PAGES 25-26: MWBE/SDVOB Certifications inserted here]</p>

              <div className="print-footer" style={{ ...styles.printFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'absolute', bottom: '1in', left: 0, padding: '0 1in' } as React.CSSProperties}>
                <span style={{ fontSize: 12, color: "#333", flex: 1, textAlign: 'center' }}>Page 25 of 27</span>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <DackLogo scale={0.35} />
                </div>
              </div>
            </div>
            <div className="print-page relative-page" style={{ ...styles.reportPage, opacity: 0.5 } as React.CSSProperties}>
              <h3 style={{ ...styles.reportSectionTitle, fontSize: 24 } as React.CSSProperties}>ATTACHMENT F: Waiver Determination</h3>
              <p>[PAGE 27: Official state waiver documentation inserted here]</p>

              <div className="print-footer" style={{ ...styles.printFooter, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'absolute', bottom: '1in', left: 0, padding: '0 1in' } as React.CSSProperties}>
                <span style={{ fontSize: 12, color: "#333", flex: 1, textAlign: 'center' }}>Page 27 of 27</span>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <DackLogo scale={0.35} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Upload */}
      <div className="no-print" style={{ textAlign: "center", padding: "24px 0 40px" }}>
        <button style={styles.resetBtn as React.CSSProperties} onClick={() => { setScreen("upload"); setActiveTab("overview"); setUploadedFile(null); setProgress(0); }}>
          ← Upload New Report Data
        </button>
      </div>
    </div>
  );
}

// ── HEADER ──
function Header({ subtitle }: { subtitle: string }) {
  return (
    <div style={styles.header as React.CSSProperties}>
      <div>
        <h1 style={{ ...styles.logo, display: 'flex', alignItems: 'center' } as React.CSSProperties}>
          <DackLogo scale={0.5} />
        </h1>
        <p style={{ ...styles.subtitle, color: "#475569", marginTop: 8 } as React.CSSProperties}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── KEYFRAMES ──
const keyframes = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      @keyframes fadeUp {
        to {opacity: 1; transform: translateY(0); }
  }
      @keyframes pulse {
        0 %, 100 % { opacity: 0.6; }
    50% {opacity: 1; }
  }
      `;

// ── STYLES ──
const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
    color: "#0f172a",
  },
  header: {
    padding: "24px 32px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },

  // Upload
  uploadContainer: { maxWidth: 720, margin: "0 auto", padding: "48px 24px" },
  uploadZone: {
    border: "2px dashed #cbd5e1",
    borderRadius: 16,
    padding: "56px 40px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    background: "#ffffff",
  },
  uploadIcon: { marginBottom: 16 },
  uploadTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  uploadSub: { fontSize: 13, color: "#64748b", margin: 0 },
  fileCard: {
    marginTop: 20,
    padding: "16px 20px",
    background: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  fileIcon: { flexShrink: 0 },
  fileName: { margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" },
  fileSize: { margin: "2px 0 0", fontSize: 12, color: "#64748b" },
  processBtn: {
    marginLeft: "auto",
    padding: "10px 24px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 40 },
  infoCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "24px 20px",
    textAlign: "center",
  },
  infoTitle: { fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "12px 0 6px" },
  infoDesc: { fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 },

  // Processing
  processingContainer: { maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" },
  progressOuter: { background: "#e2e8f0", borderRadius: 20, height: 8, overflow: "hidden" },
  progressInner: { background: "linear-gradient(90deg, #dc2626, #fca5a5)", height: "100%", borderRadius: 20, transition: "width 0.4s ease" },
  progressPct: { fontSize: 36, fontWeight: 800, color: "#0f172a", margin: "20px 0 32px" },
  stepList: { textAlign: "left" },
  stepItem: { padding: "8px 0", fontSize: 14, color: "#94a3b8", transition: "opacity 0.3s" },

  // Dashboard
  tabBar: {
    display: "flex",
    gap: 4,
    padding: "0 32px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  tab: {
    padding: "14px 20px",
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
  },
  tabActive: { color: "#0f172a", borderBottom: "2px solid #dc2626" },
  content: { padding: "24px 32px", maxWidth: 1200, margin: "0 auto" },

  // KPIs
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  kpiCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  kpiAccent: { position: "absolute", top: 0, left: 0, width: 4, height: "100%", borderRadius: "12px 0 0 12px" },
  kpiLabel: { margin: 0, fontSize: 12, color: "#64748b", fontWeight: 500 },
  kpiValue: { margin: "8px 0 0", fontSize: 26, fontWeight: 800, color: "#0f172a" },

  // Charts
  chartGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  chartCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px",
    marginBottom: 16,
  },
  chartTitle: { margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" },

  // Table
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e2e8f0",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #1e293b22",
    color: "#334155",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  cellInput: {
    background: "#e2e8f0",
    border: "1px solid #dc2626",
    borderRadius: 4,
    color: "#0f172a",
    padding: "4px 8px",
    fontSize: 13,
    width: "100%",
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Report Preview
  reportPreview: { display: "flex", justifyContent: "center" },
  reportPage: {
    background: "#ffffff",
    borderRadius: 12,
    padding: "48px 56px",
    maxWidth: 820,
    width: "100%",
    color: "#0f172a",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottom: "3px solid #dc2626",
    marginBottom: 28,
  },
  reportSection: { marginBottom: 28 },
  reportSectionTitle: { fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 12px", borderLeft: "4px solid #dc2626", paddingLeft: 12 },
  reportText: { fontSize: 13, lineHeight: 1.7, color: "#334155", margin: 0 },
  reportTable: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 },
  reportTh: { textAlign: "left", padding: "10px 12px", background: "#e2e8f0", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" },
  reportTd: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155" },
  exportBtn: {
    padding: "12px 28px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  // Reset
  resetBtn: {
    padding: "10px 24px",
    background: "transparent",
    border: "1px solid #cbd5e1",
    color: "#94a3b8",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
