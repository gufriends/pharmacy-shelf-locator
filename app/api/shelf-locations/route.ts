import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

interface ShelfLocationResponse {
  success: boolean;
  locations: Array<{
    id: string;
    name: string;
    category: string | null;
    description: string | null;
    aisleNumber: string | null;
    rowNumber: number | null;
    columns: number;
    rows: number;
    _count: {
      medicines: number;
    };
  }>;
  error?: string;
}

export async function GET(): Promise<NextResponse<ShelfLocationResponse>> {
  try {
    const authResult = await requirePharmacy();
    if (authResult.error === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, locations: [], error: "Unauthorized" }, { status: 401 });
    }
    if (authResult.error === "NO_PHARMACY") {
      return NextResponse.json({ success: false, locations: [], error: "No active pharmacy selected" }, { status: 403 });
    }

    const locations = await prisma.shelfLocation.findMany({
      where: { pharmacyId: authResult.pharmacyId },
      orderBy: [
        { aisleNumber: "asc" },
        { rowNumber: "asc" },
        { name: "asc" },
      ],
      include: {
        category: true,
        _count: {
          select: {
            medicines: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      locations: locations.map((loc) => ({
        ...loc,
        category: loc.category?.name || null,
        _count: {
          medicines: loc._count.medicines,
        },
      })),
    });

  } catch (error) {
    console.error("Failed to fetch shelf locations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        locations: [],
        error: `Failed to fetch shelf locations: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

interface CreateShelfLocationRequest {
  name: string;
  category?: string | null;
  description?: string | null;
  aisleNumber?: string | null;
  rowNumber?: number | null;
  columns?: number;
  rows?: number;
}

interface CreateShelfLocationResponse {
  success: boolean;
  location: {
    id: string;
    name: string;
    category: string | null;
  } | null;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<CreateShelfLocationResponse>> {
  try {
    const authResult = await requirePharmacy();
    if (authResult.error === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, location: null, error: "Unauthorized" }, { status: 401 });
    }
    if (authResult.error === "NO_PHARMACY") {
      return NextResponse.json({ success: false, location: null, error: "No active pharmacy selected" }, { status: 403 });
    }

    const body: CreateShelfLocationRequest = await request.json();
    const { name, category, description, aisleNumber, rowNumber, columns, rows } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, location: null, error: "name is required" },
        { status: 400 }
      );
    }

    const location = await prisma.shelfLocation.create({
      data: {
        name: name.trim(),
        category: category ? {
          connectOrCreate: {
            where: {
              pharmacyId_name: {
                pharmacyId: authResult.pharmacyId,
                name: category.trim(),
              },
            },
            create: {
              name: category.trim(),
              pharmacyId: authResult.pharmacyId,
              color: "blue",
            },
          },
        } : undefined,
        description: description?.trim() || null,
        aisleNumber: aisleNumber?.trim() || null,
        rowNumber: rowNumber ?? null,
        columns: columns ?? 5,
        rows: rows ?? 1,
        pharmacy: { connect: { id: authResult.pharmacyId } },
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      location: {
        ...location,
        category: location.category?.name || null,
      },
    });

  } catch (error) {
    console.error("Failed to create shelf location:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        location: null,
        error: `Failed to create shelf location: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}