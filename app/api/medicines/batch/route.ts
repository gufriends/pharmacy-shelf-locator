import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

interface MedicineItemInput {
  name: string;
  dosage: string | null;
  quantity?: number | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  extractedFromAI?: boolean;
  confidence?: number | null;
  imageUrl?: string | null;
  positionX?: number | null;
  positionY?: number | null;
}

interface BatchRequest {
  shelfLocationId: string;
  medicines: MedicineItemInput[];
}

interface BatchResponse {
  success: boolean;
  created: number;
  medicines: Array<{
    id: string;
    name: string;
    dosage: string | null;
  }>;
  shelfLocation: {
    id: string;
    name: string;
    category: string | null;
  } | null;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BatchResponse>> {
  try {
    const authResult = await requirePharmacy();
    if (authResult.error === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, created: 0, medicines: [], shelfLocation: null, error: "Unauthorized" }, { status: 401 });
    }
    if (authResult.error === "NO_PHARMACY") {
      return NextResponse.json({ success: false, created: 0, medicines: [], shelfLocation: null, error: "No active pharmacy selected" }, { status: 403 });
    }

    const body: BatchRequest = await request.json();
    const { shelfLocationId, medicines } = body;

    if (!shelfLocationId || typeof shelfLocationId !== "string") {
      return NextResponse.json(
        { success: false, created: 0, medicines: [], shelfLocation: null, error: "shelfLocationId is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        { success: false, created: 0, medicines: [], shelfLocation: null, error: "medicines array is required and must not be empty" },
        { status: 400 }
      );
    }

    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      if (!med.name || typeof med.name !== "string" || med.name.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            created: 0,
            medicines: [],
            shelfLocation: null,
            error: `Medicine at index ${i} is missing required 'name' field`
          },
          { status: 400 }
        );
      }
    }

    // Verify shelf location exists AND belongs to active pharmacy
    const shelfLocation = await prisma.shelfLocation.findFirst({
      where: { id: shelfLocationId, pharmacyId: authResult.pharmacyId },
      select: { id: true, name: true, category: true },
    });

    if (!shelfLocation) {
      return NextResponse.json(
        { success: false, created: 0, medicines: [], shelfLocation: null, error: "Shelf location not found in this pharmacy" },
        { status: 404 }
      );
    }

    const createdMedicines = await prisma.$transaction(
      medicines.map((med) =>
        prisma.medicineItem.create({
          data: {
            name: med.name.trim(),
            dosage: med.dosage?.trim() || null,
            quantity: med.quantity ?? null,
            batchNumber: med.batchNumber?.trim() || null,
            expiryDate: med.expiryDate ? new Date(med.expiryDate) : null,
            notes: med.notes?.trim() || null,
            extractedFromAI: med.extractedFromAI ?? true,
            confidence: med.confidence ?? null,
            imageUrl: med.imageUrl?.trim() || null,
            positionX: med.positionX ?? null,
            positionY: med.positionY ?? null,
            shelfLocationId: shelfLocationId,
          },
          select: {
            id: true,
            name: true,
            dosage: true,
          },
        })
      )
    );

    await prisma.inventoryAudit.create({
      data: {
        action: "CREATE",
        entityType: "MedicineItem",
        entityId: shelfLocationId,
        pharmacyId: authResult.pharmacyId,
        changes: {
          count: createdMedicines.length,
          medicines: createdMedicines.map((m: { id: string; name: string; dosage: string | null }) => ({ id: m.id, name: m.name })),
        },
        performedBy: authResult.userId,
      },
    });

    return NextResponse.json({
      success: true,
      created: createdMedicines.length,
      medicines: createdMedicines,
      shelfLocation: {
        id: shelfLocation.id,
        name: shelfLocation.name,
        category: shelfLocation.category,
      },
    });

  } catch (error) {
    console.error("Batch medicine creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        created: 0,
        medicines: [],
        shelfLocation: null,
        error: `Failed to save medicines: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}
