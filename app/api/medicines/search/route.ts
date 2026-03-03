import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

interface MedicineWithLocation {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  shelfLocation: {
    id: string;
    name: string;
    category: string | null;
    aisleNumber: string | null;
    rowNumber: number | null;
  };
}

interface SearchResponse {
  success: boolean;
  medicines: MedicineWithLocation[];
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const authResult = await requirePharmacy();
    if (authResult.error === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, medicines: [], error: "Unauthorized" }, { status: 401 });
    }
    if (authResult.error === "NO_PHARMACY") {
      return NextResponse.json({ success: false, medicines: [], error: "No active pharmacy selected" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Build where clause — scoped by pharmacy
    const where: Record<string, unknown> = {
      shelfLocation: {
        pharmacyId: authResult.pharmacyId,
        ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
      },
    };

    if (query) {
      where.name = { contains: query, mode: "insensitive" };
    }

    const medicines = await prisma.medicineItem.findMany({
      where,
      take: limit,
      orderBy: [
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        dosage: true,
        quantity: true,
        shelfLocation: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
            aisleNumber: true,
            rowNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      medicines: medicines.map(m => ({
        ...m,
        shelfLocation: {
          ...m.shelfLocation,
          category: m.shelfLocation.category?.name || null,
        }
      })),
    });

  } catch (error) {
    console.error("Search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { success: false, medicines: [], error: `Search failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
