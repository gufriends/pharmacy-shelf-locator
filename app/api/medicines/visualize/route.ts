import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

interface RackVisualization {
  id: string;
  name: string;
  category: string | null;
  aisleNumber: string | null;
  rowNumber: number | null;
  columns: number;
  rows: number;
  medicines: Array<{
    id: string;
    name: string;
    dosage: string | null;
    quantity: number | null;
    positionX: number | null;
    positionY: number | null;
  }>;
  medicineCount: number;
}

interface VisualizationResponse {
  success: boolean;
  aisles: Array<{
    name: string;
    rows: Array<{
      name: string;
      racks: RackVisualization[];
    }>;
  }>;
  allLocations: RackVisualization[];
  error?: string;
}

export async function GET(): Promise<NextResponse<VisualizationResponse>> {
  try {
    const authResult = await requirePharmacy();
    if (authResult.error === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, aisles: [], allLocations: [], error: "Unauthorized" }, { status: 401 });
    }
    if (authResult.error === "NO_PHARMACY") {
      return NextResponse.json({ success: false, aisles: [], allLocations: [], error: "No active pharmacy selected" }, { status: 403 });
    }

    const locations = await prisma.shelfLocation.findMany({
      where: { pharmacyId: authResult.pharmacyId },
      orderBy: [
        { aisleNumber: "asc" },
        { rowNumber: "asc" },
        { name: "asc" },
      ],
      include: {
        category: { select: { name: true } },
        medicines: {
          select: {
            id: true,
            name: true,
            dosage: true,
            quantity: true,
            positionX: true,
            positionY: true,
          },
          orderBy: [{ positionY: "asc" }, { positionX: "asc" }],
        },
        _count: {
          select: { medicines: true },
        },
      },
    });

    const allLocations: RackVisualization[] = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      category: (loc.category as any)?.name || null,
      aisleNumber: loc.aisleNumber,
      rowNumber: loc.rowNumber,
      columns: loc.columns ?? 5,
      rows: loc.rows ?? 1,
      medicines: loc.medicines,
      medicineCount: loc._count.medicines,
    }));

    // Group by aisle and row for hierarchical view
    const aisleMap = new Map<string, Map<number, RackVisualization[]>>();

    for (const loc of allLocations) {
      const aisleName = loc.aisleNumber || "Unassigned";
      const rowNum = loc.rowNumber || 0;

      if (!aisleMap.has(aisleName)) {
        aisleMap.set(aisleName, new Map());
      }

      const rowMap = aisleMap.get(aisleName)!;
      if (!rowMap.has(rowNum)) {
        rowMap.set(rowNum, []);
      }

      rowMap.get(rowNum)!.push(loc);
    }

    const aisles = Array.from(aisleMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([aisleName, rowMap]) => ({
        name: aisleName,
        rows: Array.from(rowMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([rowNum, racks]) => ({
            name: rowNum > 0 ? `Row ${rowNum}` : "Unassigned",
            racks,
          })),
      }));

    return NextResponse.json({
      success: true,
      aisles,
      allLocations,
    });

  } catch (error) {
    console.error("Visualization error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      { success: false, aisles: [], allLocations: [], error: `Failed to load visualization: ${errorMessage}` },
      { status: 500 }
    );
  }
}
