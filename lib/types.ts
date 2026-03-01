// API Response Types

export interface ExtractedMedicine {
  name: string;
  dosage: string | null;
  confidence: number;
  positionX?: number;
  positionY?: number;
}

export interface VisionExtractionResponse {
  success: boolean;
  medicines: ExtractedMedicine[];
  error?: string;
  processingTimeMs?: number;
}

export interface MedicineItemInput {
  id?: string; // Temporary ID for frontend state management
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
  _isNew?: boolean; // Flag for items added manually
  _isDeleted?: boolean; // Flag for items marked for deletion
}

export interface BatchMedicineResponse {
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

export interface ShelfLocation {
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
}

export interface ShelfLocationsResponse {
  success: boolean;
  locations: ShelfLocation[];
  error?: string;
}

// UI State Types

export type WorkflowStep = "location" | "capture" | "validate" | "success";

export interface AppState {
  currentStep: WorkflowStep;
  selectedLocation: ShelfLocation | null;
  capturedImage: string | null;
  extractedMedicines: MedicineItemInput[];
  isProcessing: boolean;
  error: string | null;
}

// Quick Setup Types

export interface QuickSetupShelf {
  category: string;
  suggestedName: string;
  columns: number;
  rows: number;
  medicines: ExtractedMedicine[];
}

export interface QuickSetupResponse {
  success: boolean;
  shelves: QuickSetupShelf[];
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
