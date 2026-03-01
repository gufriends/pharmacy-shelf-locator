import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

// OpenRouter API configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are an expert pharmaceutical inventory assistant. Your task is to analyze images of pharmacy shelves and perform COMPLETE shelf mapping in one pass.

WHAT YOU MUST DO:
1. DETECT ALL CATEGORY LABELS visible on the shelf dividers/separators (handwritten or printed labels like "ANTIHIPERTENSI", "KOLESTEROL", "ASMA", "LAMBUNG", "SUPLEMEN", etc.)
2. For EACH category section, identify ALL medicines in that section
3. Determine the grid layout (columns × rows) for each category section
4. Map each medicine to its position within its category's grid

CRITICAL INSTRUCTIONS FOR CATEGORY DETECTION:
- Category labels are typically written on white paper/stickers attached to shelf rails or dividers
- They are usually in UPPERCASE and written in Indonesian medical terminology
- Common categories include: ANTIHIPERTENSI, KOLESTEROL, WASIR, ANTIVIRUS, ANTIEMETIK, ASMA, SUPLEMEN, LAMBUNG, HORMON, ANALGETIK, ANTIPIRETIK, BATUK & FLU, DIABETES, etc.
- If a category label spans two words (e.g., "BATUK & FLU" or "ANALGETIK ANTIPIRETIK"), keep them together as one category
- If you see a label but can't read it clearly, use your best guess based on the medicines visible in that section

MEDICINE EXTRACTION RULES:
- Read medicine names from labels on acrylic/transparent boxes
- Handle handwritten, printed, and mixed text formats
- Correct common OCR errors (O/0, I/1/l confusion)
- Include dosage when visible (e.g., "5 MG", "500mg", "10ml")
- Confidence scoring: 0.9+ (clear text), 0.7-0.9 (minor issues), 0.5-0.7 (difficult to read)
- Skip items below 0.5 confidence

SPATIAL MAPPING:
- For each category section, determine how many columns and rows of medicine boxes there are
- positionX: 0-indexed column (left to right)
- positionY: 0-indexed row (top to bottom)
- Items in the same row should share the same positionY

OUTPUT: Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "shelves": [
    {
      "category": "CATEGORY_NAME",
      "suggestedName": "rack N",
      "columns": 8,
      "rows": 1,
      "medicines": [
        {"name": "MEDICINE_NAME", "dosage": "DOSAGE", "confidence": 0.95, "positionX": 0, "positionY": 0}
      ]
    }
  ]
}

IMPORTANT:
- Order shelves from top to bottom as they appear in the image
- Number suggestedName sequentially: "rack 1", "rack 2", "rack 3", etc.
- Each shelf/category section is a separate entry in the "shelves" array
- If a medicine appears between two categories, assign it to the category it is physically closest to`;

interface ExtractedMedicine {
    name: string;
    dosage: string | null;
    confidence: number;
    positionX?: number;
    positionY?: number;
}

interface DetectedShelf {
    category: string;
    suggestedName: string;
    columns: number;
    rows: number;
    medicines: ExtractedMedicine[];
}

interface QuickSetupResult {
    success: boolean;
    shelves: DetectedShelf[];
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
    processingTimeMs?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<QuickSetupResult>> {
    const startTime = Date.now();

    try {
        const authResult = await requirePharmacy();
        if (authResult.error === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, shelves: [], error: "Unauthorized" }, { status: 401 });
        }
        if (authResult.error === "NO_PHARMACY") {
            return NextResponse.json({ success: false, shelves: [], error: "No active pharmacy selected" }, { status: 403 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, shelves: [], error: "OPENROUTER_API_KEY environment variable is not set" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { imageDataUrl, aisleNumber, autoSave = false } = body;

        if (!imageDataUrl) {
            return NextResponse.json(
                { success: false, shelves: [], error: "No imageDataUrl provided" },
                { status: 400 }
            );
        }

        const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
            return NextResponse.json(
                { success: false, shelves: [], error: "Invalid data URL format" },
                { status: 400 }
            );
        }
        const mimeType = matches[1];
        const imageBase64 = matches[2];

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "rivpharma - Quick Setup",
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: [
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
                            {
                                type: "text",
                                text: `Analyze this pharmacy shelf image. Detect ALL category labels on the shelf dividers and extract ALL medicines under each category. Return the complete shelf mapping as JSON.`,
                            },
                        ],
                    },
                ],
                max_tokens: 8192,
                temperature: 0.1,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API error:", errorText);
            return NextResponse.json(
                { success: false, shelves: [], error: `AI API error: ${response.status}` },
                { status: 500 }
            );
        }

        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content;

        if (!responseText) {
            return NextResponse.json(
                { success: false, shelves: [], error: "No response from AI" },
                { status: 500 }
            );
        }

        let parsed: { shelves: DetectedShelf[] };
        try {
            let cleanedResponse = responseText.trim();
            if (cleanedResponse.startsWith("```json")) cleanedResponse = cleanedResponse.slice(7);
            else if (cleanedResponse.startsWith("```")) cleanedResponse = cleanedResponse.slice(3);
            if (cleanedResponse.endsWith("```")) cleanedResponse = cleanedResponse.slice(0, -3);
            cleanedResponse = cleanedResponse.trim();
            parsed = JSON.parse(cleanedResponse);
        } catch {
            console.error("Failed to parse AI response:", responseText);
            return NextResponse.json(
                { success: false, shelves: [], error: "Failed to parse AI response" },
                { status: 500 }
            );
        }

        if (!parsed.shelves || !Array.isArray(parsed.shelves)) {
            return NextResponse.json(
                { success: false, shelves: [], error: "AI response missing 'shelves' array" },
                { status: 500 }
            );
        }

        const shelves: DetectedShelf[] = parsed.shelves.map((shelf, index) => ({
            ...shelf,
            suggestedName: shelf.suggestedName || `rack ${index + 1}`,
            medicines: (shelf.medicines || []).filter(
                (med) => med.confidence >= 0.5 && med.name && med.name.trim().length > 0
            ),
        }));

        const processingTimeMs = Date.now() - startTime;

        if (autoSave) {
            try {
                const createdDetails: Array<{ locationName: string; category: string; medicineCount: number }> = [];
                let totalLocations = 0;
                let totalMedicines = 0;

                await prisma.$transaction(async (tx) => {
                    for (let i = 0; i < shelves.length; i++) {
                        const shelf = shelves[i];
                        if (shelf.medicines.length === 0) continue;

                        const location = await tx.shelfLocation.create({
                            data: {
                                name: shelf.suggestedName,
                                category: shelf.category,
                                description: `Auto-created by Quick Setup`,
                                aisleNumber: aisleNumber || null,
                                rowNumber: i + 1,
                                columns: shelf.columns || 5,
                                rows: shelf.rows || 1,
                                pharmacyId: authResult.pharmacyId,
                            },
                        });

                        await tx.medicineItem.createMany({
                            data: shelf.medicines.map((med) => ({
                                name: med.name.trim(),
                                dosage: med.dosage?.trim() || null,
                                extractedFromAI: true,
                                confidence: med.confidence,
                                positionX: med.positionX ?? null,
                                positionY: med.positionY ?? null,
                                shelfLocationId: location.id,
                            })),
                        });

                        totalLocations++;
                        totalMedicines += shelf.medicines.length;
                        createdDetails.push({
                            locationName: shelf.suggestedName,
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
                    shelves,
                    created: {
                        locations: totalLocations,
                        medicines: totalMedicines,
                        details: createdDetails,
                    },
                    processingTimeMs,
                });

            } catch (dbError) {
                console.error("Database error during quick setup:", dbError);
                return NextResponse.json(
                    {
                        success: false,
                        shelves,
                        error: `AI extraction succeeded but database save failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
                        processingTimeMs,
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            shelves,
            processingTimeMs,
        });

    } catch (error) {
        console.error("Quick setup error:", error);
        return NextResponse.json(
            {
                success: false,
                shelves: [],
                error: `Quick setup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                processingTimeMs: Date.now() - startTime,
            },
            { status: 500 }
        );
    }
}
