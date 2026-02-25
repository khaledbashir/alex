import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/reports — List all reports
export async function GET() {
    try {
        const prisma = getPrisma();
        const reports = await prisma.report.findMany({
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                name: true,
                status: true,
                updatedAt: true,
                projectDetails: true
            }
        });
        return NextResponse.json(reports);
    } catch (error) {
        console.error("GET Reports Error:", error);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}

// POST /api/reports — Create a new report from parsed data
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name,
            projectDetails,
            diversityGoals,
            subcontractors,
            workforce,
            p2Utilization,
            p2EEO
        } = body;

        const prisma = getPrisma();
        const report = await prisma.report.create({
            data: {
                name: name || "Untitled Report",
                projectDetails: projectDetails || {},
                diversityGoals: diversityGoals || {},
                subcontractors: subcontractors || [],
                workforce: workforce || [],
                p2Utilization: p2Utilization || [],
                p2EEO: p2EEO || []
            }
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error("POST Report Error:", error);
        return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
    }
}
