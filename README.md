# Smart Shelf Locator

A Pharmacy Management Application module that uses Multimodal AI (Google Gemini Vision) to extract medicine names from photos of pharmacy shelves, with a "Human-in-the-Loop" validation workflow and **Visual Rack Browser** with AI-guided spatial search.

## Features

### Core Features
- **AI-Powered Medicine Extraction**: Uses Google Gemini Vision API to intelligently extract medicine names, dosages, and **spatial positions** from shelf photos
- **Mobile-First Design**: Optimized for pharmacists using mobile devices in the field
- **Human-in-the-Loop Validation**: Review, edit, and validate AI extractions before saving
- **Shelf Location Management**: Organize medicines by rack, category, and aisle

### Visual Rack Browser
- **Dynamic Grid Layout**: Each rack can be configured with custom dimensions (columns x rows)
- **Spatial Mapping**: AI automatically maps medicines from left-to-right, top-to-bottom when scanning
- **Interactive Rack Cards**: Click any rack to see the visual grid layout of medicines
- **Highlighted Search**: Search results highlight the corresponding rack

### AI-Guided Medicine Search
- **Smart Search**: Handles typos, partial names, Indonesian names, and brand/generic names
- **Location Guide**: AI generates natural language directions like:
  - *"📍 Rack 1, paling kiri — di sebelah kiri Amoxicillin"*
  - *"📍 Rack 3, sisi kanan (posisi 4 dari kiri) — di sebelah kanan Paracetamol"*
- **Neighbor Context**: Shows what medicines are next to the searched item
- **Confidence Scoring**: AI provides confidence scores to help identify uncertain matches

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: TanStack Query (React Query v5)
- **ORM**: Prisma (PostgreSQL)
- **Authentication**: Better Auth
- **AI/Vision**: OpenRouter API (Google Gemini 3 Flash)

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- OpenRouter API Key ([Get one here](https://openrouter.ai))

## Getting Started

### 1. Clone and Install Dependencies

```bash
cd pharmacy-shelf-locator
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pharmacy_shelf?schema=public"

# OpenRouter API Key (for AI features)
OPENROUTER_API_KEY="your-openrouter-api-key-here"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-super-secret-key-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

Create the PostgreSQL database and run migrations:

```bash
# Create the database (if not exists)
createdb pharmacy_shelf

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed with sample shelf locations
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
pharmacy-shelf-locator/
├── app/
│   ├── api/
│   │   ├── vision/
│   │   │   └── extract/
│   │   │       └── route.ts          # Gemini Vision extraction (with spatial mapping)
│   │   ├── medicines/
│   │   │   ├── ai-search/
│   │   │   │   └── route.ts          # AI-powered search with location guide
│   │   │   ├── batch/
│   │   │   │   └── route.ts          # Batch save medicines (with positions)
│   │   │   ├── search/
│   │   │   │   └── route.ts          # Simple text search
│   │   │   └── visualize/
│   │   │       └── route.ts          # Rack visualization data
│   │   └── shelf-locations/
│   │       └── route.ts              # Shelf locations CRUD (with dimensions)
│   ├── layout.tsx
│   ├── page.tsx                      # Main page with tabs (Search, Browse, Map)
│   └── globals.css
├── components/
│   ├── providers/
│   │   └── query-provider.tsx        # TanStack Query provider
│   ├── shelf-locator/
│   │   ├── index.ts
│   │   ├── shelf-locator.tsx         # Main workflow orchestrator
│   │   ├── location-selector.tsx     # Step 1: Location + rack dimension config
│   │   ├── image-capture.tsx         # Step 2: Image capture
│   │   ├── medicine-validator.tsx    # Step 3: Validation UI
│   │   ├── medicine-search.tsx       # AI search with location guide
│   │   └── visual-rack.tsx           # Visual Rack Browser (grid layout)
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── types.ts                      # TypeScript type definitions
│   ├── utils.ts                      # Utility functions
│   └── hooks/
│       ├── index.ts
│       └── use-medicines.ts          # TanStack Query hooks
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/
└── .env.example
```

## Database Schema

### ShelfLocation
| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| id          | String   | Primary key (CUID)                       |
| name        | String   | e.g., "Rack 1", "Shelf A"               |
| category    | String?  | e.g., "Cardiology", "Antibiotics"        |
| description | String?  | Optional description                     |
| aisleNumber | String?  | Optional aisle reference                 |
| rowNumber   | Int?     | Row number within the shelf              |
| **columns** | **Int**  | **Width of virtual rack (default: 5)**   |
| **rows**    | **Int**  | **Height of virtual rack (default: 1)**  |

### MedicineItem
| Field           | Type     | Description                              |
|-----------------|----------|------------------------------------------|
| id              | String   | Primary key (CUID)                       |
| name            | String   | Medicine name                            |
| dosage          | String?  | Dosage (e.g., "500mg")                   |
| quantity        | Int?     | Quantity on shelf                        |
| **positionX**   | **Int?** | **0-indexed column position (L→R)**      |
| **positionY**   | **Int?** | **0-indexed row position (T→B)**         |
| extractedFromAI | Boolean  | Whether extracted via AI                 |
| confidence      | Float?   | AI confidence score (0-1)                |
| shelfLocationId | String   | FK to ShelfLocation                      |

## API Endpoints

### `POST /api/vision/extract`

Extracts medicine names, dosages, and **spatial positions** from an image using Gemini Vision.

**Response:**
```json
{
  "success": true,
  "medicines": [
    { "name": "Paracetamol", "dosage": "500mg", "confidence": 0.95, "positionX": 0, "positionY": 0 },
    { "name": "Amoxicillin", "dosage": "250mg", "confidence": 0.88, "positionX": 1, "positionY": 0 }
  ],
  "processingTimeMs": 1234
}
```

### `POST /api/medicines/ai-search`

AI-powered search with **location guide** for finding medicines.

**Request:**
```json
{ "query": "para" }
```

**Response:**
```json
{
  "success": true,
  "query": "para",
  "aiInterpretation": {
    "suggestedMedicines": ["Paracetamol"],
    "alternativeNames": ["Acetaminophen"],
    "category": "Pain Management"
  },
  "medicines": [
    {
      "id": "cm123...",
      "name": "Paracetamol",
      "dosage": "500mg",
      "positionX": 0,
      "positionY": 0,
      "confidence": 1.0,
      "locationGuide": "📍 Rack 1, paling kiri — di sebelah kiri Amoxicillin",
      "shelfLocation": {
        "id": "cm456...",
        "name": "Rack 1",
        "category": "Pain Management",
        "columns": 5,
        "rows": 1
      }
    }
  ]
}
```

### `POST /api/medicines/batch`

Saves validated medicines with positions to the database.

### `GET /api/shelf-locations`

Retrieves all shelf locations with dimensions and medicine counts.

### `GET /api/medicines/visualize`

Returns rack visualization data with full spatial mapping for the Visual Rack Browser.

## Usage Workflow

### Mapping Shelves
1. **Select Location**: Choose or create a shelf location (with rack dimensions)
2. **Capture Image**: Take a photo using the device camera or upload from gallery
3. **AI Extraction**: The system processes the image and extracts medicine names with positions
4. **Validate & Edit**: Review the extracted list, correct errors, add missing items
5. **Confirm & Save**: Save the validated batch to the database

### Searching Medicines
1. **Type medicine name** in the search bar (handles typos, partial names, Indonesian names)
2. **AI interprets** your query and finds matching medicines
3. **Location guide** tells you exactly where to find it (e.g., "paling kiri, di sebelah kiri Amoxicillin")
4. **Click result** to view the rack in Visual Rack Browser

### Browsing Racks
1. **Browse** all racks organized by aisle
2. **Click** any rack to see the visual grid layout with medicines positioned left-to-right
3. **Highlighted search** shows which rack contains your searched medicine

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type checking
```

### Database Management

```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Create and apply migration
npm run db:push      # Push schema without migration
npm run db:seed      # Seed database with sample locations
npm run db:studio    # Open Prisma Studio GUI
```

## Architecture Notes

### Code Organization
- **API Routes**: Each route file contains interfaces (config) and the handler (logic) separately
- **Business Logic**: Functions like `generateLocationGuide()` are separated from API handler config
- **Components**: Each component is in its own file, focused on a single responsibility
- **Types**: Shared types are in `lib/types.ts`, hook-specific types are co-located with hooks

### AI Integration
- The Vision API extracts medicine names with spatial coordinates (`positionX`, `positionY`)
- The AI Search API uses context (all medicines in inventory) to interpret fuzzy queries
- Location guides are generated server-side using neighbor data, not via AI calls (efficient)

## Security Considerations

- Never commit `.env` file to version control
- Use environment-specific database credentials in production
- Rotate `BETTER_AUTH_SECRET` regularly
- Configure proper CORS origins for production
- Implement rate limiting for the vision API endpoint

## License

MIT
