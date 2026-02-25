import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/reports/[id] — Get full report details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const prisma = getPrisma();
        const report = await prisma.report.findUnique({
            where: { id },
            include: {
                attachments: {
                    select: {
                        id: true,
                        slot: true,
                        filename: true,
                        createdAt: true,
                    }
                }
            }
        });

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error("GET Report Detail Error:", error);
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
    }
}

// PATCH /api/reports/[id] — Update report data or editable content
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const {
            name,
            status,
            projectDetails,
            diversityGoals,
            subcontractors,
            workforce,
            p2Utilization,
            p2EEO,
            editableContent
        } = body;

        const prisma = getPrisma();
        const report = await prisma.report.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(status && { status }),
                ...(projectDetails && { projectDetails }),
                ...(diversityGoals && { diversityGoals }),
                ...(subcontractors && { subcontractors }),
                ...(workforce && { workforce }),
                ...(p2Utilization && { p2Utilization }),
                ...(p2EEO && { p2EEO }),
                ...(editableContent && { editableContent }),
            }
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error("PATCH Report Error:", error);
        return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }
}

// DELETE /api/reports/[id] — Delete a report
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const prisma = getPrisma();
        await prisma.report.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Report Error:", error);
        return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }
}
