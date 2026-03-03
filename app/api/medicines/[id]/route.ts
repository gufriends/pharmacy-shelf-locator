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
    const { name, dosage, quantity, notes, categoryId } = await req.json();

    try {
        const medicine = await prisma.medicineItem.update({
            where: {
                id,
                shelfLocation: {
                    pharmacyId: session.session.activeOrganizationId,
                },
            },
            data: {
                name,
                dosage,
                quantity: quantity !== undefined ? Number(quantity) : undefined,
                notes,
                categoryId,
            },
        });

        return NextResponse.json({ success: true, medicine });
    } catch (err: any) {
        console.error("Failed to update medicine:", err);
        return NextResponse.json({ success: false, error: "Failed to update medicine" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.medicineItem.delete({
            where: {
                id,
                shelfLocation: {
                    pharmacyId: session.session.activeOrganizationId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Failed to delete medicine:", err);
        return NextResponse.json({ success: false, error: "Failed to delete medicine" }, { status: 500 });
    }
}
