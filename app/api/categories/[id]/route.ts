import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
        await prisma.shelfCategory.delete({
            where: {
                id,
                pharmacyId: session.session.activeOrganizationId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, description, color, icon } = await req.json();

    try {
        const category = await prisma.shelfCategory.update({
            where: {
                id,
                pharmacyId: session.session.activeOrganizationId,
            },
            data: {
                name,
                description,
                color,
                icon,
            },
        });

        return NextResponse.json({ success: true, category });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 500 });
    }
}
