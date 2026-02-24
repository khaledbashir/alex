"use client";

import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── Synthetic Data matching Natalia's actual schema ──
const PROJECT = {
  project_no: "161026-04",
  project_name: "RENOVATE PLANT SCIENCE BUILDING",
  contractor: "LeChase Construction Services, LLC",
  quarter: "Q4 2025",
  report_date: "December 31, 2025",
  total_contract_value: 48750000,
};

const DIVERSITY_GOALS: Record<string, number> = { MBE: 0.15, WBE: 0.15, SDVOB: 0.06 };

const SUBCONTRACTORS = [
  { contract_number: "SC-2024-001", date: "03/15/2024", code: "MBE", name: "Apex Mechanical Systems Inc.", federal_id: "**-***7842", total_contract: 3250000, total_paid_to_date: 2847500, total_paid_this_quarter: 487500 },
  { contract_number: "SC-2024-002", date: "03/22/2024", code: "MBE", name: "Rivera Electric Corp.", federal_id: "**-***3291", total_contract: 2100000, total_paid_to_date: 1680000, total_paid_this_quarter: 315000 },
  { contract_number: "SC-2024-003", date: "04/01/2024", code: "WBE", name: "Sterling Plumbing & HVAC LLC", federal_id: "**-***5518", total_contract: 2875000, total_paid_to_date: 2300000, total_paid_this_quarter: 431250 },
  { contract_number: "SC-2024-004", date: "04/10/2024", code: "WBE", name: "Greenfield Interiors Group", federal_id: "**-***8834", total_contract: 1950000, total_paid_to_date: 1462500, total_paid_this_quarter: 292500 },
  { contract_number: "SC-2024-005", date: "04/15/2024", code: "SDVOB", name: "Patriot Fire Protection Inc.", federal_id: "**-***2207", total_contract: 1625000, total_paid_to_date: 1218750, total_paid_this_quarter: 243750 },
  { contract_number: "SC-2024-006", date: "05/01/2024", code: "MBE", name: "Kwame Structural Engineering", federal_id: "**-***6673", total_contract: 1800000, total_paid_to_date: 1260000, total_paid_this_quarter: 270000 },
  { contract_number: "SC-2024-007", date: "05/12/2024", code: "WBE", name: "Dawson Painting & Restoration", federal_id: "**-***1149", total_contract: 980000, total_paid_to_date: 735000, total_paid_this_quarter: 147000 },
  { contract_number: "SC-2024-008", date: "06/01/2024", code: "SDVOB", name: "VetBuild Demolition Services", federal_id: "**-***4456", total_contract: 1300000, total_paid_to_date: 910000, total_paid_this_quarter: 195000 },
];

const WORKFORCE = {
  total_hours: 124500,
  african_american: { hours: 18675, pct: 0.15 },
  hispanic: { hours: 14940, pct: 0.12 },
  women: { hours: 8715, pct: 0.07 },
  other_minority: { hours: 6225, pct: 0.05 },
};

// ── Helpers ──
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function getCategoryTotals() {
  const cats: Record<string, { contract: number; paid: number; count: number }> = {};
  SUBCONTRACTORS.forEach((s) => {
    if (!cats[s.code]) cats[s.code] = { contract: 0, paid: 0, count: 0 };
    cats[s.code].contract += s.total_contract;
    cats[s.code].paid += s.total_paid_to_date;
    cats[s.code].count += 1;
  });
  return cats;
}

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
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [tableData, setTableData] = useState<any[]>(SUBCONTRACTORS);
  const [activeTab, setActiveTab] = useState("overview");
  const fileRef = useRef<HTMLInputElement>(null);

  // Simulated processing
  useEffect(() => {
    if (screen === "processing") {
      const steps = [
        { p: 15, t: 400 }, { p: 35, t: 800 }, { p: 55, t: 1200 },
        { p: 75, t: 1600 }, { p: 90, t: 2000 }, { p: 100, t: 2400 },
      ];
      steps.forEach(({ p, t }) => setTimeout(() => setProgress(p), t));
      setTimeout(() => setScreen("dashboard"), 3000);
    }
  }, [screen]);

  const catTotals = getCategoryTotals();

  // ── UPLOAD SCREEN ──
  if (screen === "upload") {
    return (
      <div style={styles.app as React.CSSProperties}>
        <style>{keyframes}</style>
        <Header subtitle="Diversity & Inclusion Compliance Report Engine" />
        <div style={styles.uploadContainer as React.CSSProperties}>
          <div style={{ ...styles.uploadZone, ...fadeUp(0.1) } as React.CSSProperties}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); setUploadedFile("Q4_2025_Raw_Data.xlsx"); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={() => setUploadedFile("Q4_2025_Raw_Data.xlsx")} />
            <div style={styles.uploadIcon as React.CSSProperties}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            </div>
            <p style={styles.uploadTitle as React.CSSProperties}>Drop your quarterly Excel data here</p>
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
              { icon: "📄", title: "Report Export", desc: "Branded quarterly report matching your exact template structure" },
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
  const goalData = Object.entries(DIVERSITY_GOALS).map(([code, goal]) => ({
    code,
    goal: goal * 100,
    actual: ((catTotals[code]?.contract || 0) / PROJECT.total_contract_value) * 100,
  }));

  const paymentData = Object.entries(catTotals).map(([code, d]) => ({
    code,
    contracted: d.contract,
    paid: d.paid,
    balance: d.contract - d.paid,
  }));

  const workforceData = [
    { group: "African American", hours: WORKFORCE.african_american.hours, pct: WORKFORCE.african_american.pct * 100 },
    { group: "Hispanic", hours: WORKFORCE.hispanic.hours, pct: WORKFORCE.hispanic.pct * 100 },
    { group: "Women", hours: WORKFORCE.women.hours, pct: WORKFORCE.women.pct * 100 },
    { group: "Other Minority", hours: WORKFORCE.other_minority.hours, pct: WORKFORCE.other_minority.pct * 100 },
  ];

  const COLORS: Record<string, string> = { MBE: "#6366f1", WBE: "#ec4899", SDVOB: "#f59e0b" };
  const PIE_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#22c55e"];

  const totalDiversity = Object.values(catTotals).reduce((a, c) => a + c.contract, 0);

  return (
    <div style={styles.app as React.CSSProperties}>
      <style>{keyframes}</style>
      <Header subtitle={`${PROJECT.project_name} — ${PROJECT.quarter} Report`} />

      {/* Tab Navigation */}
      <div style={styles.tabBar as React.CSSProperties}>
        {["overview", "subcontractors", "workforce", "report"].map((tab) => (
          <button
            key={tab}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) } as React.CSSProperties}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "overview" ? "📊 Overview" : tab === "subcontractors" ? "📋 Subcontractors" : tab === "workforce" ? "👷 Workforce" : "📄 Report Preview"}
          </button>
        ))}
      </div>

      <div style={styles.content as React.CSSProperties}>
        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            {/* KPI Cards */}
            <div style={styles.kpiGrid as React.CSSProperties}>
              {[
                { label: "Total Contract Value", value: fmt(PROJECT.total_contract_value), accent: "#6366f1" },
                { label: "MWBE/SDVOB Allocated", value: fmt(totalDiversity), accent: "#22c55e" },
                { label: "Diversity %", value: pct(totalDiversity / PROJECT.total_contract_value), accent: "#ec4899" },
                { label: "Subcontractors", value: SUBCONTRACTORS.length.toString(), accent: "#f59e0b" },
              ].map((kpi, i) => (
                <div key={i} style={{ ...styles.kpiCard, ...fadeUp(i * 0.08) } as React.CSSProperties}>
                  <div style={{ ...styles.kpiAccent, background: kpi.accent } as React.CSSProperties} />
                  <p style={styles.kpiLabel as React.CSSProperties}>{kpi.label}</p>
                  <p style={styles.kpiValue as React.CSSProperties}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div style={styles.chartGrid as React.CSSProperties}>
              <div style={{ ...styles.chartCard, ...fadeUp(0.2) } as React.CSSProperties}>
                <p style={styles.chartTitle as React.CSSProperties}>Goal Attainment by Category</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={goalData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="code" stroke="#94a3b8" fontSize={13} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
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
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                  <YAxis type="category" dataKey="code" stroke="#94a3b8" fontSize={13} width={60} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
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
          <div style={{ ...styles.chartCard, ...fadeUp(0.1), overflow: "auto" } as React.CSSProperties}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={styles.chartTitle as React.CSSProperties}>MWBE/SDVOB Subcontractors — Click any cell to edit</p>
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(COLORS).map(([code, color]) => (
                  <span key={code} style={{ background: `${color}22`, color, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {code}: {catTotals[code]?.count || 0} firms
                  </span>
                ))}
              </div>
            </div>
            <table style={styles.table as React.CSSProperties}>
              <thead>
                <tr>
                  {["Contract #", "Date", "Code", "Company Name", "Federal ID", "Total Contract", "Paid to Date", "Paid This Quarter", "Balance"].map((h) => (
                    <th key={h} style={styles.th as React.CSSProperties}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "#0f172a08" }}>
                    {Object.entries(row).map(([key, val], ci) => {
                      const isEditing = editingCell?.row === ri && editingCell?.col === ci;
                      const isMoney = ["total_contract", "total_paid_to_date", "total_paid_this_quarter"].includes(key);
                      const isCode = key === "code";
                      return (
                        <td
                          key={ci}
                          style={{
                            ...styles.td,
                            ...(isCode && typeof val === 'string' ? { color: COLORS[val] || "#e2e8f0", fontWeight: 700 } : {}),
                          } as React.CSSProperties}
                          onClick={() => setEditingCell({ row: ri, col: ci })}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              style={styles.cellInput as React.CSSProperties}
                              defaultValue={val as string | number}
                              onBlur={(e) => {
                                const newData = [...tableData];
                                newData[ri] = { ...newData[ri], [key]: isMoney ? Number(e.target.value) : e.target.value };
                                // recalc balance
                                newData[ri].balance = newData[ri].total_contract - newData[ri].total_paid_to_date;
                                setTableData(newData);
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                            />
                          ) : key === "balance" ? (
                            fmt(row.total_contract - row.total_paid_to_date)
                          ) : isMoney ? (
                            fmt(val as number)
                          ) : (
                            val as React.ReactNode
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ ...styles.td, fontWeight: 700, color: "#e2e8f0" } as React.CSSProperties}>TOTALS</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#22c55e" } as React.CSSProperties}>{fmt(tableData.reduce((a, r) => a + r.total_contract, 0))}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#22c55e" } as React.CSSProperties}>{fmt(tableData.reduce((a, r) => a + r.total_paid_to_date, 0))}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#22c55e" } as React.CSSProperties}>{fmt(tableData.reduce((a, r) => a + r.total_paid_this_quarter, 0))}</td>
                  <td style={{ ...styles.td, fontWeight: 700, color: "#f59e0b" } as React.CSSProperties}>{fmt(tableData.reduce((a, r) => a + (r.total_contract - r.total_paid_to_date), 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── WORKFORCE TAB ── */}
        {activeTab === "workforce" && (
          <>
            <div style={styles.kpiGrid as React.CSSProperties}>
              {[
                { label: "Total Workforce Hours", value: WORKFORCE.total_hours.toLocaleString(), accent: "#6366f1" },
                { label: "African American", value: `${WORKFORCE.african_american.hours.toLocaleString()} hrs (${pct(WORKFORCE.african_american.pct)})`, accent: "#6366f1" },
                { label: "Hispanic", value: `${WORKFORCE.hispanic.hours.toLocaleString()} hrs (${pct(WORKFORCE.hispanic.pct)})`, accent: "#ec4899" },
                { label: "Women", value: `${WORKFORCE.women.hours.toLocaleString()} hrs (${pct(WORKFORCE.women.pct)})`, accent: "#f59e0b" },
              ].map((kpi, i) => (
                <div key={i} style={{ ...styles.kpiCard, ...fadeUp(i * 0.08) } as React.CSSProperties}>
                  <div style={{ ...styles.kpiAccent, background: kpi.accent } as React.CSSProperties} />
                  <p style={styles.kpiLabel as React.CSSProperties}>{kpi.label}</p>
                  <p style={{ ...styles.kpiValue, fontSize: 22 } as React.CSSProperties}>{kpi.value}</p>
                </div>
              ))}
            </div>
            <div style={{ ...styles.chartCard, ...fadeUp(0.2) } as React.CSSProperties}>
              <p style={styles.chartTitle as React.CSSProperties}>Workforce Hours by Demographic</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workforceData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="group" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                    formatter={(v: any) => [`${v.toLocaleString()} hours`]}
                  />
                  <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]}>
                    {workforceData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ── REPORT PREVIEW TAB ── */}
        {activeTab === "report" && (
          <div style={{ ...styles.reportPreview, ...fadeUp(0.1) } as React.CSSProperties}>
            <div style={styles.reportPage as React.CSSProperties}>
              <div style={styles.reportHeader as React.CSSProperties}>
                <div>
                  <p style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>Quarterly Compliance Report</p>
                  <h2 style={{ margin: "4px 0 0", fontSize: 22, color: "#0f172a", fontWeight: 800 }}>{PROJECT.project_name}</h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569" }}>Project No. {PROJECT.project_no} — {PROJECT.contractor}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#6366f1", margin: 0 }}>{PROJECT.quarter}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>As of {PROJECT.report_date}</p>
                </div>
              </div>

              <div style={styles.reportSection as React.CSSProperties}>
                <h3 style={styles.reportSectionTitle as React.CSSProperties}>1. Executive Summary</h3>
                <p style={styles.reportText as React.CSSProperties}>
                  As of {PROJECT.report_date}, the total contract value for the {PROJECT.project_name} project stands at <strong>{fmt(PROJECT.total_contract_value)}</strong>.
                  Total payments made to MWBE and SDVOB subcontractors to date amount to <strong>{fmt(Object.values(catTotals).reduce((a, c) => a + c.paid, 0))}</strong>,
                  representing <strong>{pct(Object.values(catTotals).reduce((a, c) => a + c.paid, 0) / PROJECT.total_contract_value)}</strong> of the total contract value.
                  The project currently engages <strong>{SUBCONTRACTORS.length} certified diverse subcontractors</strong> across MBE, WBE, and SDVOB categories.
                </p>
              </div>

              <div style={styles.reportSection as React.CSSProperties}>
                <h3 style={styles.reportSectionTitle as React.CSSProperties}>2. Diversity Goal Attainment</h3>
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
                    {Object.entries(DIVERSITY_GOALS).map(([code, goal]) => {
                      const actual = (catTotals[code]?.contract || 0) / PROJECT.total_contract_value;
                      const met = actual >= goal;
                      return (
                        <tr key={code}>
                          <td style={styles.reportTd as React.CSSProperties}><strong>{code}</strong></td>
                          <td style={styles.reportTd as React.CSSProperties}>{pct(goal)}</td>
                          <td style={{ ...styles.reportTd, color: met ? "#16a34a" : "#dc2626", fontWeight: 700 } as React.CSSProperties}>{pct(actual)}</td>
                          <td style={styles.reportTd as React.CSSProperties}>{fmt(catTotals[code]?.contract || 0)}</td>
                          <td style={styles.reportTd as React.CSSProperties}>
                            <span style={{ background: met ? "#dcfce7" : "#fef2f2", color: met ? "#16a34a" : "#dc2626", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                              {met ? "✓ Met" : "✗ Below"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={styles.reportSection as React.CSSProperties}>
                <h3 style={styles.reportSectionTitle as React.CSSProperties}>3. Workforce Utilization</h3>
                <p style={styles.reportText as React.CSSProperties}>
                  Total workforce hours logged this reporting period: <strong>{WORKFORCE.total_hours.toLocaleString()} hours</strong>.
                  Diverse workforce participation includes African American workers at {pct(WORKFORCE.african_american.pct)},
                  Hispanic workers at {pct(WORKFORCE.hispanic.pct)}, and women at {pct(WORKFORCE.women.pct)} of total hours.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <button style={styles.exportBtn as React.CSSProperties} onClick={() => alert("In production, this exports a branded PDF matching your exact template structure.")}>
                  ⬇ Export as PDF
                </button>
                <button style={{ ...styles.exportBtn, background: "#22c55e", marginLeft: 12 } as React.CSSProperties} onClick={() => alert("In production, this generates formatted Excel with charts embedded.")}>
                  ⬇ Export as Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Upload */}
      <div style={{ textAlign: "center", padding: "24px 0 40px" }}>
        <button style={styles.resetBtn as React.CSSProperties} onClick={() => { setScreen("upload"); setActiveTab("overview"); setUploadedFile(null); setProgress(0); }}>
          ← Upload New Quarter
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
        <h1 style={styles.logo as React.CSSProperties}>
          <span style={{ color: "#6366f1" }}>■</span> D&I Report Engine
        </h1>
        <p style={styles.subtitle as React.CSSProperties}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── KEYFRAMES ──
const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  @keyframes fadeUp {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
`;

// ── STYLES ──
const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#0a0f1e",
    minHeight: "100vh",
    color: "#e2e8f0",
  },
  header: {
    padding: "24px 32px",
    borderBottom: "1px solid #1e293b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { margin: 0, fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#64748b" },

  // Upload
  uploadContainer: { maxWidth: 720, margin: "0 auto", padding: "48px 24px" },
  uploadZone: {
    border: "2px dashed #334155",
    borderRadius: 16,
    padding: "56px 40px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 0.2s",
    background: "#0f172a",
  },
  uploadIcon: { marginBottom: 16 },
  uploadTitle: { fontSize: 18, fontWeight: 700, color: "#f8fafc", margin: "0 0 8px" },
  uploadSub: { fontSize: 13, color: "#64748b", margin: 0 },
  fileCard: {
    marginTop: 20,
    padding: "16px 20px",
    background: "#0f172a",
    borderRadius: 12,
    border: "1px solid #1e293b",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  fileIcon: { flexShrink: 0 },
  fileName: { margin: 0, fontSize: 14, fontWeight: 600, color: "#f8fafc" },
  fileSize: { margin: "2px 0 0", fontSize: 12, color: "#64748b" },
  processBtn: {
    marginLeft: "auto",
    padding: "10px 24px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 40 },
  infoCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "24px 20px",
    textAlign: "center",
  },
  infoTitle: { fontSize: 15, fontWeight: 700, color: "#f8fafc", margin: "12px 0 6px" },
  infoDesc: { fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 },

  // Processing
  processingContainer: { maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" },
  progressOuter: { background: "#1e293b", borderRadius: 20, height: 8, overflow: "hidden" },
  progressInner: { background: "linear-gradient(90deg, #6366f1, #a78bfa)", height: "100%", borderRadius: 20, transition: "width 0.4s ease" },
  progressPct: { fontSize: 36, fontWeight: 800, color: "#f8fafc", margin: "20px 0 32px" },
  stepList: { textAlign: "left" },
  stepItem: { padding: "8px 0", fontSize: 14, color: "#94a3b8", transition: "opacity 0.3s" },

  // Dashboard
  tabBar: {
    display: "flex",
    gap: 4,
    padding: "0 32px",
    borderBottom: "1px solid #1e293b",
    background: "#0d1323",
  },
  tab: {
    padding: "14px 20px",
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
  },
  tabActive: { color: "#f8fafc", borderBottomColor: "#6366f1" },
  content: { padding: "24px 32px", maxWidth: 1200, margin: "0 auto" },

  // KPIs
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  kpiCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  kpiAccent: { position: "absolute", top: 0, left: 0, width: 4, height: "100%", borderRadius: "12px 0 0 12px" },
  kpiLabel: { margin: 0, fontSize: 12, color: "#64748b", fontWeight: 500 },
  kpiValue: { margin: "8px 0 0", fontSize: 26, fontWeight: 800, color: "#f8fafc" },

  // Charts
  chartGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 },
  chartCard: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: "20px",
    marginBottom: 16,
  },
  chartTitle: { margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#f8fafc" },

  // Table
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #1e293b",
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
    color: "#cbd5e1",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  cellInput: {
    background: "#1e293b",
    border: "1px solid #6366f1",
    borderRadius: 4,
    color: "#f8fafc",
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
    borderBottom: "3px solid #6366f1",
    marginBottom: 28,
  },
  reportSection: { marginBottom: 28 },
  reportSectionTitle: { fontSize: 16, fontWeight: 800, color: "#0f172a", margin: "0 0 12px", borderLeft: "4px solid #6366f1", paddingLeft: 12 },
  reportText: { fontSize: 13, lineHeight: 1.7, color: "#334155", margin: 0 },
  reportTable: { width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 },
  reportTh: { textAlign: "left", padding: "10px 12px", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase" },
  reportTd: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155" },
  exportBtn: {
    padding: "12px 28px",
    background: "#6366f1",
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
    background: "none",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
};
