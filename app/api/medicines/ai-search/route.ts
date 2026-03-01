import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePharmacy } from "@/lib/auth-helpers";

// ============================================
// Configuration
// ============================================

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

// ============================================
// Interfaces
// ============================================

interface AISearchResult {
  originalQuery: string;
  suggestedMedicines: string[];
  alternativeNames: string[];
  category?: string;
}

interface MedicineWithLocation {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  positionX: number | null;
  positionY: number | null;
  shelfLocation: {
    id: string;
    name: string;
    category: string | null;
    aisleNumber: string | null;
    rowNumber: number | null;
    columns: number;
    rows: number;
  };
  confidence: number;
  locationGuide: string | null;
}

interface AISearchResponse {
  success: boolean;
  query: string;
  aiInterpretation: AISearchResult | null;
  medicines: MedicineWithLocation[];
  error?: string;
}

// ============================================
// Business Logic: Generate Location Guide
// ============================================

function generateLocationGuide(
  medicine: {
    name: string;
    positionX: number | null;
    positionY: number | null;
    shelfLocation: {
      name: string;
      columns: number;
      rows: number;
    };
  },
  neighbors: { name: string; positionX: number | null; positionY: number | null }[]
): string {
  const { positionX, positionY, shelfLocation } = medicine;
  const { columns, rows } = shelfLocation;

  if (positionX === null || positionY === null) {
    return `Ada di ${shelfLocation.name}, tapi posisi detailnya belum dipetakan.`;
  }

  const parts: string[] = [];

  if (positionX === 0) {
    parts.push("paling kiri");
  } else if (positionX === columns - 1) {
    parts.push("paling kanan");
  } else if (positionX < columns / 2) {
    parts.push(`sisi kiri (posisi ${positionX + 1} dari kiri)`);
  } else {
    parts.push(`sisi kanan (posisi ${positionX + 1} dari kiri)`);
  }

  if (rows > 1) {
    if (positionY === 0) {
      parts.push("baris paling atas");
    } else if (positionY === rows - 1) {
      parts.push("baris paling bawah");
    } else {
      parts.push(`baris ke-${positionY + 1}`);
    }
  }

  const leftNeighbor = neighbors.find(
    (n) => n.positionX === (positionX ?? 0) - 1 && n.positionY === positionY
  );
  const rightNeighbor = neighbors.find(
    (n) => n.positionX === (positionX ?? 0) + 1 && n.positionY === positionY
  );

  const neighborHints: string[] = [];
  if (leftNeighbor) {
    neighborHints.push(`di sebelah kanan ${leftNeighbor.name}`);
  }
  if (rightNeighbor) {
    neighborHints.push(`di sebelah kiri ${rightNeighbor.name}`);
  }

  let guide = `📍 ${shelfLocation.name}, ${parts.join(", ")}`;
  if (neighborHints.length > 0) {
    guide += ` — ${neighborHints.join(", ")}`;
  }

  return guide;
}

// ============================================
// API Route Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<AISearchResponse>> {
  try {
    const authResult = await requirePharmacy();
    if (authResult.error === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, query: "", aiInterpretation: null, medicines: [], error: "Unauthorized" }, { status: 401 });
    }
    if (authResult.error === "NO_PHARMACY") {
      return NextResponse.json({ success: false, query: "", aiInterpretation: null, medicines: [], error: "No active pharmacy selected" }, { status: 403 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, query: "", aiInterpretation: null, medicines: [], error: "OPENROUTER_API_KEY not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const query = body.query || "";

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, query: "", aiInterpretation: null, medicines: [], error: "Query is required" },
        { status: 400 }
      );
    }

    // Get medicines scoped to this pharmacy
    const allMedicines = await prisma.medicineItem.findMany({
      where: {
        shelfLocation: { pharmacyId: authResult.pharmacyId },
      },
      select: {
        name: true,
        dosage: true,
        shelfLocation: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      take: 500,
    });

    const medicineList = allMedicines
      .map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ""} (${m.shelfLocation.name})`)
      .join(", ");

    const aiResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "rivpharma - AI Search",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a pharmaceutical search assistant. Given a user's search query, help them find medicines.\n\nAvailable medicines in inventory:\n${medicineList}\n\nYour task:\n1. Interpret what medicine the user is looking for (handle typos, partial names, brand/generic names, Indonesian names)\n2. Suggest the most likely medicine names from the inventory\n3. Provide alternative names if applicable\n\nReturn ONLY a JSON object with this structure:\n{\n  "suggestedMedicines": ["exact medicine name from inventory", ...],\n  "alternativeNames": ["other possible names user might mean", ...],\n  "category": "category if identifiable"\n}\n\nBe generous with matching - if user types "para" match Paracetamol, if user types "amox" match Amoxicillin, etc.\nReturn up to 5 suggested medicines.`,
          },
          {
            role: "user",
            content: `Find medicines matching: "${query}"`,
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    let aiInterpretation: AISearchResult | null = null;
    let searchTerms: string[] = [query];

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const aiText = aiData.choices?.[0]?.message?.content || "";

      try {
        let cleanedText = aiText.trim();
        if (cleanedText.startsWith("```json")) cleanedText = cleanedText.slice(7);
        else if (cleanedText.startsWith("```")) cleanedText = cleanedText.slice(3);
        if (cleanedText.endsWith("```")) cleanedText = cleanedText.slice(0, -3);
        cleanedText = cleanedText.trim();

        aiInterpretation = JSON.parse(cleanedText);
        if (aiInterpretation?.suggestedMedicines?.length) {
          searchTerms = [...new Set([query, ...aiInterpretation.suggestedMedicines])];
        }
      } catch {
        console.error("Failed to parse AI response:", aiText);
      }
    }

    // Search database scoped to pharmacy
    const medicines = await prisma.medicineItem.findMany({
      where: {
        shelfLocation: { pharmacyId: authResult.pharmacyId },
        OR: searchTerms.flatMap((term) => [
          { name: { contains: term, mode: "insensitive" as const } },
          { dosage: { contains: term, mode: "insensitive" as const } },
        ]),
      },
      take: 20,
      select: {
        id: true,
        name: true,
        dosage: true,
        quantity: true,
        positionX: true,
        positionY: true,
        shelfLocation: {
          select: {
            id: true,
            name: true,
            category: true,
            aisleNumber: true,
            rowNumber: true,
            columns: true,
            rows: true,
          },
        },
      },
    });

    const medicinesWithGuides: MedicineWithLocation[] = await Promise.all(
      medicines.map(async (med) => {
        let confidence = 0;
        if (med.name.toLowerCase() === query.toLowerCase()) {
          confidence = 1.0;
        } else if (med.name.toLowerCase().startsWith(query.toLowerCase())) {
          confidence = 0.9;
        } else if (med.name.toLowerCase().includes(query.toLowerCase())) {
          confidence = 0.8;
        } else if (
          aiInterpretation?.suggestedMedicines?.some(
            (s) => s.toLowerCase() === med.name.toLowerCase()
          )
        ) {
          confidence = 0.85;
        } else {
          confidence = 0.6;
        }

        let locationGuide: string | null = null;
        if (med.positionX !== null && med.positionY !== null) {
          const neighbors = await prisma.medicineItem.findMany({
            where: {
              shelfLocationId: med.shelfLocation.id,
              id: { not: med.id },
              positionY: med.positionY,
            },
            select: { name: true, positionX: true, positionY: true },
            orderBy: { positionX: "asc" },
          });

          locationGuide = generateLocationGuide(med, neighbors);
        } else {
          locationGuide = `📍 ${med.shelfLocation.name} — posisi detail belum dipetakan.`;
        }

        return {
          ...med,
          confidence,
          locationGuide,
        };
      })
    );

    medicinesWithGuides.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      success: true,
      query,
      aiInterpretation,
      medicines: medicinesWithGuides,
    });

  } catch (error) {
    console.error("AI Search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        query: "",
        aiInterpretation: null,
        medicines: [],
        error: `Search failed: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}
