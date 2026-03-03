import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

interface ExtractedMedicine {
    name: string;
    dosage: string | null;
    confidence: number;
    positionX?: number | null;
    positionY?: number | null;
}

interface ShelfToSave {
    category: string;
    suggestedName: string;
    columns: number;
    rows: number;
    medicines: ExtractedMedicine[];
}

interface SaveResult {
    success: boolean;
    created?: {
        locations: number;
        medicines: number;
        details: Array<{
            locationName: string;
            category: string;
            medicineCount: number;
        }>;
    };
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SaveResult>> {
    try {
        const authResult = await requirePharmacy();
        if (authResult.error === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        if (authResult.error === "NO_PHARMACY") {
            return NextResponse.json({ success: false, error: "No active pharmacy selected" }, { status: 403 });
        }

        const body = await request.json();
        const { shelves, aisleNumber } = body as {
            shelves: ShelfToSave[];
            aisleNumber?: string;
        };

        if (!shelves || !Array.isArray(shelves) || shelves.length === 0) {
            return NextResponse.json(
                { success: false, error: "No shelves data provided" },
                { status: 400 }
            );
        }

        const createdDetails: Array<{ locationName: string; category: string; medicineCount: number }> = [];
        let totalLocations = 0;
        let totalMedicines = 0;

        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < shelves.length; i++) {
                const shelf = shelves[i];
                if (!shelf.medicines || shelf.medicines.length === 0) continue;

                const location = await tx.shelfLocation.create({
                    data: {
                        name: shelf.suggestedName || `rack ${i + 1}`,
                        category: shelf.category ? {
                            connectOrCreate: {
                                where: {
                                    pharmacyId_name: {
                                        pharmacyId: authResult.pharmacyId,
                                        name: shelf.category.trim(),
                                    },
                                },
                                create: {
                                    name: shelf.category.trim(),
                                    pharmacyId: authResult.pharmacyId,
                                    color: "blue",
                                },
                            },
                        } : undefined,
                        description: `Auto-created by Quick Setup`,
                        aisleNumber: aisleNumber || null,
                        rowNumber: i + 1,
                        columns: shelf.columns || 5,
                        rows: shelf.rows || 1,
                        pharmacy: { connect: { id: authResult.pharmacyId } },
                    },
                });

                await tx.medicineItem.createMany({
                    data: shelf.medicines.map((med) => ({
                        name: med.name.trim(),
                        dosage: med.dosage?.trim() || null,
                        extractedFromAI: true,
                        confidence: med.confidence ?? null,
                        positionX: med.positionX ?? null,
                        positionY: med.positionY ?? null,
                        shelfLocationId: location.id,
                    })),
                });

                totalLocations++;
                totalMedicines += shelf.medicines.length;
                createdDetails.push({
                    locationName: shelf.suggestedName || `rack ${i + 1}`,
                    category: shelf.category,
                    medicineCount: shelf.medicines.length,
                });
            }

            await tx.inventoryAudit.create({
                data: {
                    action: "CREATE",
                    entityType: "QuickSetup",
                    entityId: "bulk",
                    pharmacyId: authResult.pharmacyId,
                    changes: {
                        locations: totalLocations,
                        medicines: totalMedicines,
                        details: createdDetails,
                    },
                    performedBy: authResult.userId,
                },
            });
        });

        return NextResponse.json({
            success: true,
            created: {
                locations: totalLocations,
                medicines: totalMedicines,
                details: createdDetails,
            },
        });

    } catch (error) {
        console.error("Quick setup save error:", error);
        return NextResponse.json(
            {
                success: false,
                error: `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
            { status: 500 }
        );
    }
}
