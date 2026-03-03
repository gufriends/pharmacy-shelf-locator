import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { shelfLocationId, name, dosage, quantity, notes, positionX, positionY, categoryId } = await req.json();

    if (!shelfLocationId || !name) {
        return NextResponse.json({ success: false, error: "Name and Shelf Location are required" }, { status: 400 });
    }

    try {
        const medicine = await prisma.medicineItem.create({
            data: {
                shelfLocationId,
                name,
                dosage,
                quantity: quantity !== undefined ? Number(quantity) : 0,
                notes,
                positionX: positionX !== undefined ? Number(positionX) : null,
                positionY: positionY !== undefined ? Number(positionY) : null,
                categoryId,
                extractedFromAI: false,
            },
        });

        return NextResponse.json({ success: true, medicine });
    } catch (err: any) {
        console.error("Failed to create medicine:", err);
        return NextResponse.json({ success: false, error: "Failed to create medicine" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.session.activeOrganizationId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) {
        return NextResponse.json({ success: true, medicines: [] });
    }

    const medicines = await prisma.medicineItem.findMany({
        where: {
            shelfLocation: {
                pharmacyId: session.session.activeOrganizationId,
            },
            name: {
                contains: q,
                mode: "insensitive",
            },
        },
        include: {
            shelfLocation: true,
            category: true,
        },
        take: 10,
    });

    return NextResponse.json({ success: true, medicines });
}
