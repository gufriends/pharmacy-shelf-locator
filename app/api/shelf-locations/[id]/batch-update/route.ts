import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authResult = await requirePharmacy();
        if (authResult.error) {
            return NextResponse.json({ success: false, error: authResult.error }, { status: 401 });
        }

        const body = await request.json();
        const { columns, rows, medicines } = body;

        await prisma.$transaction(async (tx) => {
            // 1. Update Shelf Dimensions
            await tx.shelfLocation.update({
                where: { id, pharmacyId: authResult.pharmacyId },
                data: {
                    columns: Number(columns),
                    rows: Number(rows),
                },
            });

            // 2. Update Medicine Positions (optional)
            if (Array.isArray(medicines)) {
                for (const med of medicines) {
                    await tx.medicineItem.update({
                        where: { id: med.id, shelfLocationId: id },
                        data: {
                            positionX: med.positionX,
                            positionY: med.positionY,
                        },
                    });
                }
            }

            // 3. Log Audit
            await tx.inventoryAudit.create({
                data: {
                    action: "UPDATE",
                    entityType: "ShelfLocation",
                    entityId: id,
                    pharmacyId: authResult.pharmacyId,
                    changes: { columns, rows, medicineUpdates: medicines?.length || 0 },
                    performedBy: authResult.userId,
                },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Batch update error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
