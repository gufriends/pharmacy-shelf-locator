import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { positionX, positionY } = await req.json();

    try {
        const medicine = await prisma.medicineItem.update({
            where: {
                id,
                shelfLocation: {
                    pharmacyId: session.session.activeOrganizationId,
                },
            },
            data: {
                positionX,
                positionY,
            },
        });

        return NextResponse.json({ success: true, medicine });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: "Failed to update medicine position" }, { status: 500 });
    }
}
