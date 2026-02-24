import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { html, filename } = await req.json();

        if (!html) {
            return new Response(JSON.stringify({ error: "No HTML provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Wrap the provided HTML in a full document structure with fonts and base styles
        const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'DM Sans', sans-serif; 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact;
          }
          .print-page { 
            page-break-after: always; 
            position: relative;
            width: 100%;
            height: 10.5in;
            box-sizing: border-box;
            background: white;
            overflow: hidden;
          }
          /* Ensure tables don't break mid-row */
          table, tr, td, th {
            page-break-inside: avoid !important;
          }
          /* Custom styles transferred from the app can be added here or passed in html */
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

        const JSREPORT_URL = "http://jsreport:5488";

        // Config showed authentication disabled, but we keep it flexible
        const res = await fetch(`${JSREPORT_URL}/api/report`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                template: {
                    engine: "none",
                    recipe: "chrome-pdf",
                    content: fullHtml,
                    chrome: {
                        printBackground: true,
                        displayHeaderFooter: false,
                        marginTop: "0mm",
                        marginBottom: "0mm",
                        marginLeft: "0mm",
                        marginRight: "0mm",
                        waitForNetworkIdle: true,
                        format: "Letter"
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

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename || "report.pdf"}"`,
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
