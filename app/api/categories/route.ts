import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.shelfCategory.findMany({
        where: {
            pharmacyId: session.session.activeOrganizationId,
        },
        orderBy: {
            name: "asc",
        },
    });

    return NextResponse.json({ success: true, categories });
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, color, icon } = await req.json();

    if (!name) {
        return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    try {
        const category = await prisma.shelfCategory.create({
            data: {
                name,
                description,
                color,
                icon,
                pharmacyId: session.session.activeOrganizationId,
            },
        });

        return NextResponse.json({ success: true, category });
    } catch (err: any) {
        if (err.code === "P2002") {
            return NextResponse.json({ success: false, error: "Category already exists" }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
    }
}
