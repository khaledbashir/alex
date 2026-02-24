import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { html } = await req.json();

        if (!html) {
            return new Response(JSON.stringify({ error: "No HTML provided" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const JSREPORT_URL = "http://jsreport:5488"; // or process.env.JSREPORT_URL
        const user = "admin";
        const password = "admin";
        const auth = Buffer.from(`${user}:${password}`).toString("base64");

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
                    content: html,
                    chrome: {
                        printBackground: true,
                        displayHeaderFooter: false,
                        marginTop: "0mm",
                        marginBottom: "0mm",
                        marginLeft: "0mm",
                        marginRight: "0mm",
                        waitForNetworkIdle: true,
                    },
                },
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("jsreport error:", res.status, errorText);
            return new Response(JSON.stringify({ error: "PDF generation failed" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const pdfBuffer = await res.arrayBuffer();

        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="report.pdf"',
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
