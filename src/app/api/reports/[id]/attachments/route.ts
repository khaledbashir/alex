import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// POST /api/reports/[id]/attachments — Upload a PDF for a specific slot
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { slot, filename, data } = await req.json(); // data is base64

        if (!slot || !filename || !data) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const binaryData = Buffer.from(data, "base64");

        const prisma = getPrisma();
        const attachment = await prisma.attachment.upsert({
            where: {
                reportId_slot: {
                    reportId: id,
                    slot: slot
                }
            },
            update: {
                filename: filename,
                data: binaryData
            },
            create: {
                reportId: id,
                slot: slot,
                filename: filename,
                data: binaryData
            }
        });

        return NextResponse.json({
            id: attachment.id,
            slot: attachment.slot,
            filename: attachment.filename
        });
    } catch (error) {
        console.error("POST Attachment Error:", error);
        return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
    }
}

// DELETE /api/reports/[id]/attachments — Remove an attachment for a slot
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { slot } = await req.json();

        if (!slot) {
            return NextResponse.json({ error: "Missing slot" }, { status: 400 });
        }

        const prisma = getPrisma();
        await prisma.attachment.delete({
            where: {
                reportId_slot: {
                    reportId: id,
                    slot: slot
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Attachment Error:", error);
        return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
    }
}
