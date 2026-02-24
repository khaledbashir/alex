import { NextRequest } from "next/server";

// ── Currency formatter ──
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// ── Builds a clean, self-contained HTML document for jsreport ──
function buildReportHTML(data: {
  project: { project_name: string; project_no: string; contractor: string; report_period: string; report_date: string; total_contract_value: number };
  isProject2: boolean;
  diversity_goals: Record<string, number>;
  subcontractors: Array<{ id: string; code: string; name: string; total_contract: number; towards_goal: number; total_paid_to_date: number; balance: number }>;
  workforce: Array<{ employer: string; asian: number; black: number; hispanic: number; white: number; pacific_islander: number; unknown: number }>;
  p2_util: Array<{ id: string; company: string; value: number; towards_goal: number; paid_to_date: number; pending_payment: number }>;
  p2_eeo: Array<{ id: string; company: string; race_ethnicity: string; gender: string; num_employees: number; hours_worked: number }>;
  catTotals: Record<string, { contract: number; paid: number; count: number }>;
  p2Totals: { contract: number; towardsGoal: number; paid: number; headcount: number; hours: number };
}): string {
  const { project: P, isProject2, diversity_goals, subcontractors, workforce, p2_util, p2_eeo, catTotals, p2Totals } = data;

  const totalMWBEPaid = Object.values(catTotals).reduce((a, c) => a + c.paid, 0);
  const totalHeadcount = workforce.reduce((s, w) => s + w.asian + w.black + w.hispanic + w.white + w.pacific_islander + w.unknown, 0);

  // Compliance table rows
  const complianceRows = Object.entries(diversity_goals).map(([code, goal]) => {
    const actual = (catTotals[code]?.contract || 0) / P.total_contract_value;
    const met = actual >= goal;
    return `<tr>
      <td><strong>${code}</strong></td>
      <td>${pct(goal)}</td>
      <td style="color:${met ? '#16a34a' : '#dc2626'}; font-weight:700">${pct(actual)}</td>
      <td>${fmt(catTotals[code]?.contract || 0)}</td>
      <td>${met ? '✓ Met' : '✗ Below'}</td>
    </tr>`;
  }).join("");

  // Payment table rows
  const paymentRows = isProject2
    ? p2_util.map(r => `<tr><td><strong>${r.company}</strong></td><td>${fmt(r.value)}</td><td>${fmt(r.towards_goal)}</td><td>${fmt(r.paid_to_date)}</td><td>${r.pending_payment > 0 ? 'Pending' : 'Current'}</td></tr>`).join("")
    : subcontractors.map(r => `<tr><td><strong>${r.name}</strong> <span class="code-tag">${r.code}</span></td><td>${fmt(r.total_contract)}</td><td>${fmt(r.towards_goal)}</td><td>${fmt(r.total_paid_to_date)}</td><td>${r.balance > 0 ? 'Balance Due' : 'Paid Full'}</td></tr>`).join("");

  // Workforce table rows
  const workforceRows = isProject2
    ? p2_eeo.slice(0, 50).map(r => `<tr><td><strong>${r.company}</strong></td><td colspan="6">${r.num_employees} employees (${r.race_ethnicity} – ${r.gender})</td></tr>`).join("")
    : workforce.map(r => `<tr><td><strong>${r.employer}</strong></td><td>${r.asian}</td><td>${r.black}</td><td>${r.hispanic}</td><td>${r.white}</td><td>${r.pacific_islander}</td><td>${r.unknown}</td></tr>`).join("");

  // Executive Summary paragraph
  const execSummary = isProject2
    ? `As of this period, the total tracked contract value stands at <strong>${fmt(p2Totals.contract)}</strong>. Total payments to date amount to <strong>${fmt(p2Totals.paid)}</strong>, representing <strong>${pct(p2Totals.contract > 0 ? p2Totals.paid / p2Totals.contract : 0)}</strong> of the total contract value. The project tracks utilization across <strong>${p2_util.length} recorded firms</strong> and monitors EEO compliance for <strong>${p2Totals.headcount.toLocaleString()} employees</strong>.`
    : `As of this period, the total contract value stands at <strong>${fmt(P.total_contract_value)}</strong>. Total MWBE/SDVOB payments to date amount to <strong>${fmt(totalMWBEPaid)}</strong>, representing <strong>${pct(totalMWBEPaid / P.total_contract_value)}</strong> of the contract value. The project engages <strong>${subcontractors.length} certified diverse subcontractors</strong>.`;

  const headcountDisplay = isProject2 ? p2Totals.headcount.toLocaleString() : totalHeadcount.toLocaleString();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', 'Segoe UI', sans-serif; color: #0f172a; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    .page {
      width: 8.5in;
      min-height: 11in;
      padding: 0.75in 0.85in;
      page-break-after: always;
      position: relative;
      background: white;
    }

    /* ── COVER PAGE ── */
    .cover { padding: 0; display: flex; height: 11in; }
    .cover-left { flex: 1.5; background: white; padding: 40px; display: flex; flex-direction: column; justify-content: space-between; }
    .cover-right { flex: 1; background: #a3d18e; padding: 60px 40px 40px; display: flex; flex-direction: column; justify-content: flex-end; }
    .cover-right h2 { font-size: 24px; font-weight: 500; color: white; letter-spacing: 1px; margin-bottom: 16px; }
    .cover-right h1 { font-size: 32px; font-weight: 700; color: white; line-height: 1.2; margin-bottom: 8px; }
    .cover-right p { font-size: 14px; color: white; text-transform: uppercase; letter-spacing: 1px; }
    .cover-banner { position: absolute; top: 30%; left: 0; width: 100%; background: black; color: white; padding: 20px 40px; display: flex; justify-content: flex-end; align-items: center; }
    .cover-banner h3 { font-size: 20px; font-weight: 700; margin: 0; }
    .cover-banner p { font-size: 14px; text-transform: uppercase; margin: 4px 0 0; }

    /* ── DACK LOGO ── */
    .dack-logo { display: flex; align-items: center; color: #c1272d; font-weight: normal; font-size: 46px; letter-spacing: 1px; font-family: Georgia, serif; }
    .dack-logo span { padding: 0 6px; }
    .dack-logo .sep { height: 42px; width: 1px; background: #64748b; margin: 0 6px; }
    .dack-sub { font-size: 9px; color: #333; margin-top: 4px; letter-spacing: 4px; font-family: sans-serif; font-weight: 600; text-transform: uppercase; }

    /* ── SECTION HEADERS ── */
    .section-title {
      font-size: 16px; font-weight: 800; color: #0f172a;
      margin: 0 0 12px; border-left: 4px solid #dc2626; padding-left: 12px;
    }
    .page-title {
      font-size: 24px; font-weight: 800; color: #0f172a;
      text-transform: uppercase; border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px; margin-bottom: 32px;
    }

    /* ── BODY TEXT ── */
    .text { font-size: 13px; line-height: 1.7; color: #334155; margin-bottom: 16px; }

    /* ── TABLES ── */
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
    th {
      text-align: left; padding: 10px 12px; background: #e2e8f0;
      border-bottom: 2px solid #cbd5e1; color: #475569;
      font-weight: 700; font-size: 11px; text-transform: uppercase;
    }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .code-tag { font-size: 10px; color: #94a3b8; margin-left: 6px; }

    /* ── TABLE OF CONTENTS ── */
    .toc-row { display: flex; justify-content: space-between; font-size: 16px; line-height: 2.2; color: #334155; }
    .toc-row.attachment { font-weight: 700; }
    .toc-divider { border-top: 1px solid #e2e8f0; margin-top: 16px; padding-top: 16px; }

    /* ── KPI CARDS ── */
    .kpi-row { display: flex; gap: 24px; margin-bottom: 24px; }
    .kpi-card { flex: 1; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .kpi-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
    .kpi-value { font-size: 24px; font-weight: 800; color: #0f172a; }

    /* ── ATTACHMENT PLACEHOLDER ── */
    .placeholder { color: #94a3b8; font-style: italic; font-size: 13px; }

    /* ── FOOTER ── */
    .page-footer {
      position: absolute; bottom: 0.5in; left: 0.85in; right: 0.85in;
      font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between;
      border-top: 1px solid #e2e8f0; padding-top: 8px;
    }
  </style>
</head>
<body>

  <!-- ═══════ PAGE 1: COVER ═══════ -->
  <div class="page cover">
    <div class="cover-left">
      <div></div>
      <div style="margin-bottom:40px">
        <div class="dack-logo">
          <span style="padding-right:6px">D</span>
          <div class="sep"></div>
          <span>A</span>
          <div class="sep"></div>
          <span>C</span>
          <div class="sep"></div>
          <span style="padding-left:6px">K</span>
        </div>
        <div class="dack-sub">CONSULTING SOLUTIONS, INC</div>
      </div>
    </div>
    <div class="cover-right">
      <h2>PHASE I</h2>
      <h1>MWBE/EEO<br/>OVERVIEW REPORT</h1>
      <p>${P.report_period}</p>
      <p style="font-size:13px; margin-top:8px">${new Date().toLocaleDateString()}</p>
    </div>
    <div class="cover-banner">
      <div style="text-align:right">
        <h3>${P.project_name}</h3>
        <p>Project No. ${P.project_no}</p>
      </div>
    </div>
  </div>

  <!-- ═══════ PAGE 2: TABLE OF CONTENTS ═══════ -->
  <div class="page">
    <h2 class="page-title">Table of Contents</h2>
    <div class="toc-row"><span>1. EXECUTIVE SUMMARY</span><span>3</span></div>
    <div class="toc-row"><span>2. GOALS</span><span>4</span></div>
    <div class="toc-row"><span>3. OUTREACH</span><span>5</span></div>
    <div class="toc-row"><span>4. MWBE/SDVOB COMPLIANCE</span><span>6</span></div>
    <div class="toc-row"><span>5. MWBE/SDVOB PAYMENTS</span><span>7</span></div>
    <div class="toc-row"><span>6. WORKFORCE DIVERSITY</span><span>9</span></div>
    <div class="toc-row attachment toc-divider"><span>ATTACHMENT A: PAYMENT DETAILS</span><span>14</span></div>
    <div class="toc-row attachment"><span>ATTACHMENT B: EEO WORKFORCE UTILIZATION</span><span>17</span></div>
    <div class="toc-row attachment"><span>ATTACHMENT C: CONTRACTOR LOGS</span><span>20</span></div>
    <div class="toc-row attachment"><span>ATTACHMENT D: CORRESPONDENCE</span><span>22</span></div>
    <div class="toc-row attachment"><span>ATTACHMENT E: CERTIFICATES</span><span>25</span></div>
    <div class="toc-row attachment"><span>ATTACHMENT F: WAIVER DETERMINATION</span><span>27</span></div>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>${P.project_name}</span></div>
  </div>

  <!-- ═══════ PAGE 3: EXECUTIVE SUMMARY ═══════ -->
  <div class="page">
    <h3 class="section-title">1. Executive Summary</h3>
    <p class="text">This report provides a comprehensive overview of the MWBE and SDVOB utilization and EEO workforce compliance for the <strong>${P.project_name}</strong> project during the <strong>${P.report_period}</strong> reporting period up to <strong>${P.report_date}</strong>.</p>
    <p class="text">${execSummary}</p>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 3</span></div>
  </div>

  <!-- ═══════ PAGE 4: GOALS & OUTREACH ═══════ -->
  <div class="page">
    <h3 class="section-title">2. Goals</h3>
    <p class="text">Project-specific participation goals were established to promote diversity and equitable access to contracting opportunities on the project. After an extensive review of the efforts made to engage and contract MWBE and SDVOB firms, the utilization plan accurately reflects the availability and capacity of qualified firms in the marketplace. DACK Consulting Solutions played a crucial role in documenting, verifying, and justifying any waiver requests by demonstrating good-faith efforts.</p>
    <br/>
    <h3 class="section-title">3. Outreach Efforts</h3>
    <p class="text">To increase participation of MWBE/SDVOB firms in the project, rigorous outreach was provided during the bidding phase. We utilize a variety of methods to engage the community including informational e-blasts, social media outreach, partnering with local chambers and civic organizations, and coordinating information sessions.</p>
    <p class="text"><em>Note: Specific outreach events for this reporting period are logged in the project communications ledger.</em></p>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 4</span></div>
  </div>

  <!-- ═══════ PAGE 5: COMPLIANCE ═══════ -->
  <div class="page">
    <h3 class="section-title">4. MWBE/SDVOB Compliance</h3>
    <p class="text">As the compliance monitor, we play a critical role in supporting and verifying MWBE/SDVOB goals. A key component of these responsibilities includes Compliance Monitoring, which entails reviewing awarded contracts and assessing whether certified firms are being utilized in accordance with established requirements.</p>
    ${!isProject2 ? `
    <div style="margin-top:20px">
      <h4 style="font-size:14px; font-weight:700; color:#334155; margin-bottom:8px">Goal Attainment Status</h4>
      <table>
        <thead><tr><th>Category</th><th>Goal</th><th>Actual</th><th>Allocated</th><th>Status</th></tr></thead>
        <tbody>${complianceRows}</tbody>
      </table>
    </div>` : ''}
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 5</span></div>
  </div>

  <!-- ═══════ PAGE 6: PAYMENTS ═══════ -->
  <div class="page">
    <h3 class="section-title">5. Payments &amp; Subcontractor Utilization</h3>
    <p class="text">The following table details the tracked financial payments made to subcontractors against their awarded values.</p>
    <table>
      <thead><tr><th>Company</th><th>Contract Value</th><th>Towards Goal</th><th>Paid to Date</th><th>Status</th></tr></thead>
      <tbody>${paymentRows}</tbody>
    </table>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 6</span></div>
  </div>

  <!-- ═══════ PAGE 7: ATTACHMENT A ═══════ -->
  <div class="page">
    <h3 class="section-title">ATTACHMENT A: Payment Details</h3>
    <p class="placeholder">[Pages 14–16: Raw payment logs attached here]</p>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 7</span></div>
  </div>

  <!-- ═══════ PAGE 8: WORKFORCE ═══════ -->
  <div class="page">
    <h3 class="section-title">ATTACHMENT B: EEO Workforce Utilization</h3>
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">Total Headcount</div>
        <div class="kpi-value">${headcountDisplay}</div>
      </div>
      ${isProject2 ? `<div class="kpi-card"><div class="kpi-label">Total Hours</div><div class="kpi-value">${p2Totals.hours.toLocaleString()}</div></div>` : ''}
    </div>
    <table>
      <thead><tr><th>Reporting Firm</th><th>Asian</th><th>Black</th><th>Hispanic</th><th>White</th><th>Pacific Isl.</th><th>Unknown</th></tr></thead>
      <tbody>${workforceRows}</tbody>
    </table>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 8</span></div>
  </div>

  <!-- ═══════ ATTACHMENTS C–F ═══════ -->
  <div class="page">
    <h3 class="section-title">ATTACHMENT C: Contractor Logs</h3>
    <p class="placeholder">[Pages 20–21: Subcontractor site logs — attach physical documents here]</p>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 9</span></div>
  </div>
  <div class="page">
    <h3 class="section-title">ATTACHMENT D: Correspondence</h3>
    <p class="placeholder">[Pages 22–24: Email outreach documentation — attach physical documents here]</p>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 10</span></div>
  </div>
  <div class="page">
    <h3 class="section-title">ATTACHMENT E: Certificates</h3>
    <p class="placeholder">[Pages 25–26: MWBE/SDVOB Certifications — attach physical documents here]</p>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 11</span></div>
  </div>
  <div class="page" style="page-break-after:auto">
    <h3 class="section-title">ATTACHMENT F: Waiver Determination</h3>
    <p class="placeholder">[Page 27: Official state waiver documentation — attach physical documents here]</p>
    <div class="page-footer"><span>DACK Consulting Solutions, Inc.</span><span>Page 12</span></div>
  </div>

</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.project) {
      return new Response(JSON.stringify({ error: "No report data provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const reportHTML = buildReportHTML(body);

    const JSREPORT_URL = process.env.JSREPORT_URL || "http://jsreport:5488";
    const jsreportUser = process.env.JSREPORT_USER || "admin";
    const jsreportPass = process.env.JSREPORT_PASS || "admin";
    const auth = Buffer.from(`${jsreportUser}:${jsreportPass}`).toString("base64");

    const res = await fetch(`${JSREPORT_URL}/api/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        template: {
          engine: "none",
          recipe: "chrome-pdf",
          content: reportHTML,
          chrome: {
            printBackground: true,
            displayHeaderFooter: false,
            marginTop: "0mm",
            marginBottom: "0mm",
            marginLeft: "0mm",
            marginRight: "0mm",
            waitForNetworkIdle: true,
            format: "Letter",
          },
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("jsreport error:", res.status, errorText);
      return new Response(JSON.stringify({ error: "PDF generation failed", details: errorText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pdfBuffer = await res.arrayBuffer();
    const filename = body.filename || "report.pdf";

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
