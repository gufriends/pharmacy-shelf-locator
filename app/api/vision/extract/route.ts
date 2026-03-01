import { NextRequest, NextResponse } from "next/server";

function buildSystemPrompt(rackColumns: number, rackRows: number): string {
  return `You are an expert pharmaceutical inventory assistant specializing in OCR and medicine label recognition. Your task is to analyze images of pharmacy shelves and extract medicine names and dosages, AND map their physical positions in the rack grid.

CRITICAL INSTRUCTIONS:
1. FOCUS ONLY ON MEDICINE NAMES AND DOSAGES - Ignore everything else (prices, dates, manufacturer names, promotional text, QR codes, barcodes)
2. HANDLE VARIOUS TEXT FORMATS:
   - Printed labels (clean, consistent fonts)
   - Handwritten labels (may be messy, cursive, or printed handwriting)
   - Acrylic/transparent box labels (may have glare or reflections)
   - Small or partially visible text
3. CORRECT COMMON OCR ERRORS:
   - O/0 confusion, I/1/l confusion
   - Smudged or faded characters
   - Text at angles or curved surfaces
4. DOSAGE PATTERNS TO RECOGNIZE:
   - Tablet strengths: 5mg, 10mg, 25mg, 50mg, 100mg, 500mg, 1g, etc.
   - Liquid volumes: 5ml, 10ml, 15ml, 100ml, 120ml, etc.
   - Concentrations: 5mg/5ml, 10mg/ml, 250mg/5ml, etc.
   - Tablet counts: 10's, 20's, 30's, 100's, etc.
5. CONFIDENCE SCORING:
   - 0.9-1.0: Clear, legible text with standard formatting
   - 0.7-0.9: Readable but minor issues (slight blur, small text)
   - 0.5-0.7: Difficult to read (handwritten, glare, partial)
   - Below 0.5: Very uncertain (skip these items if below 0.5)
6. SKIP items that are clearly NOT medicines (medical equipment, supplements without drug names, empty boxes, packaging materials)
7. If a medicine name is partially visible, make your best educated guess based on common pharmaceutical naming patterns

SPATIAL MAPPING - VERY IMPORTANT:
The rack has a grid of ${rackColumns} columns x ${rackRows} rows.
- "positionX": 0-indexed column position (0 to ${rackColumns - 1}), ordered from Left to Right as seen in the image
- "positionY": 0-indexed row position (0 to ${rackRows - 1}), ordered from Top to Bottom as seen in the image
- Analyze the image carefully to determine WHERE each medicine is physically located in the rack/shelf
- Items on the same shelf row should share the same positionY
- Items next to each other horizontally should have sequential positionX values
- If multiple medicines share the same position, increment positionX for the next one
- Make your best effort to assign a valid grid position to EVERY medicine
- If the number of medicines exceeds the grid slots (${rackColumns} x ${rackRows} = ${rackColumns * rackRows} slots), assign positions to as many as you can and set positionX/positionY to null for the rest

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON array (no markdown, no explanation)
- Each item MUST have "name" (required), "dosage" (can be null if not visible), "positionX" and "positionY"
- Include "confidence" score (0.0 to 1.0) for each extraction
- Sort items from left to right, top to bottom as they appear in the image

Example output format:
[{"name": "Paracetamol", "dosage": "500mg", "confidence": 0.95, "positionX": 0, "positionY": 0}]`;
}

interface ExtractedMedicine {
  name: string;
  dosage: string | null;
  confidence: number;
  positionX?: number;
  positionY?: number;
}

interface ExtractionResult {
  success: boolean;
  medicines: ExtractedMedicine[];
  error?: string;
  processingTimeMs?: number;
}

// OpenRouter API configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Model options (uncomment to use different models):
// - Free: "qwen/qwen3-vl-30b-a3b-thinking" (Best free vision model)
// - Paid Fast: "google/gemini-3-flash-preview" ($0.0000005/token)
// - Paid Best: "anthropic/claude-sonnet-4.6" (Excellent OCR)
// - Paid Balanced: "openai/gpt-4o-mini" (Fast & accurate)
const MODEL = "google/gemini-3-flash-preview";

export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResult>> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, medicines: [], error: "OPENROUTER_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let imageBase64: string;
    let mimeType: string;

    // Parse rack dimensions (default to sensible values if not provided)
    let rackColumns = 5;
    let rackRows = 1;

    // Handle JSON request (from frontend hook)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const imageDataUrl = body.imageDataUrl;
      rackColumns = body.rackColumns ?? 5;
      rackRows = body.rackRows ?? 1;

      if (!imageDataUrl) {
        return NextResponse.json(
          { success: false, medicines: [], error: "No imageDataUrl provided in JSON body" },
          { status: 400 }
        );
      }

      const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json(
          { success: false, medicines: [], error: "Invalid data URL format" },
          { status: 400 }
        );
      }
      mimeType = matches[1];
      imageBase64 = matches[2];
    }
    // Handle FormData request (from multipart/form-data)
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const imageFile = formData.get("image") as File | null;
      const imageDataUrl = formData.get("imageDataUrl") as string | null;

      if (imageDataUrl) {
        const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          return NextResponse.json(
            { success: false, medicines: [], error: "Invalid data URL format" },
            { status: 400 }
          );
        }
        mimeType = matches[1];
        imageBase64 = matches[2];
      } else if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
        mimeType = imageFile.type || "image/jpeg";
      } else {
        return NextResponse.json(
          { success: false, medicines: [], error: "No image provided" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, medicines: [], error: `Unsupported Content-Type: ${contentType}. Use application/json or multipart/form-data` },
        { status: 400 }
      );
    }

    // Build the prompt with actual rack dimensions
    const systemPrompt = buildSystemPrompt(rackColumns, rackRows);

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Smart Shelf Locator",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `Extract all medicine names and dosages from this pharmacy shelf image. The rack grid is ${rackColumns} columns x ${rackRows} rows. Map each medicine to its grid position (positionX: 0-${rackColumns - 1}, positionY: 0-${rackRows - 1}) based on where it appears in the image. Return ONLY a valid JSON array, no other text or markdown.`,
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json(
        { success: false, medicines: [], error: `OpenRouter API error: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json(
        { success: false, medicines: [], error: "No response from OpenRouter API" },
        { status: 500 }
      );
    }

    // Try to extract JSON from the response
    let medicines: ExtractedMedicine[];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      medicines = JSON.parse(cleanedResponse);
    } catch {
      console.error("Failed to parse OpenRouter response:", responseText);
      return NextResponse.json(
        { success: false, medicines: [], error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    // Validate and filter medicines
    if (!Array.isArray(medicines)) {
      return NextResponse.json(
        { success: false, medicines: [], error: "AI response is not an array" },
        { status: 500 }
      );
    }

    const filteredMedicines = medicines.filter(
      (med) => med.confidence >= 0.5 && med.name && med.name.trim().length > 0
    );

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      medicines: filteredMedicines,
      processingTimeMs,
    });

  } catch (error) {
    console.error("Vision extraction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        medicines: [],
        error: `Failed to extract medicines: ${errorMessage}`,
        processingTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
