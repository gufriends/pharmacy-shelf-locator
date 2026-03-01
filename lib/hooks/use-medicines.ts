"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  VisionExtractionResponse,
  BatchMedicineResponse,
  ShelfLocationsResponse,
  MedicineItemInput,
  ShelfLocation,
} from "@/lib/types";

// Query Keys
export const queryKeys = {
  shelfLocations: ["shelf-locations"] as const,
  visualization: ["visualization"] as const,
  medicines: ["medicines"] as const,
};

// Fetch shelf locations
export function useShelfLocations() {
  return useQuery({
    queryKey: queryKeys.shelfLocations,
    queryFn: async (): Promise<ShelfLocation[]> => {
      const response = await fetch("/api/shelf-locations");
      const data: ShelfLocationsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch shelf locations");
      }

      return data.locations;
    },
  });
}

// Vision extraction mutation
export function useVisionExtraction() {
  return useMutation({
    mutationFn: async ({ imageDataUrl, rackColumns, rackRows }: { imageDataUrl: string; rackColumns?: number; rackRows?: number }): Promise<VisionExtractionResponse> => {
      const response = await fetch("/api/vision/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl, rackColumns, rackRows }),
      });

      const data: VisionExtractionResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to extract medicines from image");
      }

      return data;
    },
  });
}

// Batch save medicines mutation
export function useBatchSaveMedicines() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shelfLocationId,
      medicines,
    }: {
      shelfLocationId: string;
      medicines: MedicineItemInput[];
    }): Promise<BatchMedicineResponse> => {
      const response = await fetch("/api/medicines/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shelfLocationId, medicines }),
      });

      const data: BatchMedicineResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save medicines");
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shelfLocations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}

// Create shelf location mutation
export function useCreateShelfLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      category,
      description,
      aisleNumber,
      rowNumber,
      columns,
      rows,
    }: {
      name: string;
      category?: string | null;
      description?: string | null;
      aisleNumber?: string | null;
      rowNumber?: number | null;
      columns?: number;
      rows?: number;
    }): Promise<ShelfLocation> => {
      const response = await fetch("/api/shelf-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category, description, aisleNumber, rowNumber, columns, rows }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create shelf location");
      }

      return data.location;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shelfLocations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}

// Fetch visualization data
export interface MedicineInRack {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  positionX: number | null;
  positionY: number | null;
}

export interface RackVisualization {
  id: string;
  name: string;
  category: string | null;
  aisleNumber: string | null;
  rowNumber: number | null;
  columns: number;
  rows: number;
  medicines: MedicineInRack[];
  medicineCount: number;
}

interface VisualizationData {
  success: boolean;
  aisles: Array<{
    name: string;
    rows: Array<{
      name: string;
      racks: RackVisualization[];
    }>;
  }>;
  allLocations: RackVisualization[];
}

export function useVisualization() {
  return useQuery({
    queryKey: queryKeys.visualization,
    queryFn: async (): Promise<VisualizationData> => {
      const response = await fetch("/api/medicines/visualize");
      return response.json();
    },
  });
}

// AI Search mutation
interface AISearchResult {
  originalQuery: string;
  suggestedMedicines: string[];
  alternativeNames: string[];
  category?: string;
}

export interface MedicineSearchResult {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  positionX: number | null;
  positionY: number | null;
  confidence: number;
  locationGuide: string | null;
  shelfLocation: {
    id: string;
    name: string;
    category: string | null;
    aisleNumber: string | null;
    rowNumber: number | null;
    columns: number;
    rows: number;
  };
}

interface AISearchResponse {
  success: boolean;
  query: string;
  aiInterpretation: AISearchResult | null;
  medicines: MedicineSearchResult[];
}

export function useAISearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<AISearchResponse> => {
      const response = await fetch("/api/medicines/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      return response.json();
    },
  });
}

// Simple search query
export function useMedicineSearch(query: string) {
  return useQuery({
    queryKey: [...queryKeys.medicines, "search", query],
    queryFn: async () => {
      if (!query.trim()) return { success: true, medicines: [] };

      const response = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}`);
      return response.json();
    },
    enabled: query.length > 0,
  });
}

// Quick Setup - extract shelves from image
export function useQuickSetup() {
  return useMutation({
    mutationFn: async ({
      imageDataUrl,
      aisleNumber,
    }: {
      imageDataUrl: string;
      aisleNumber?: string;
    }) => {
      const response = await fetch("/api/vision/quick-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageDataUrl, aisleNumber }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Quick setup failed");
      }

      return data;
    },
  });
}

// Quick Setup - save already-detected shelves to DB
export function useQuickSetupSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shelves,
      aisleNumber,
    }: {
      shelves: Array<{
        category: string;
        suggestedName: string;
        columns: number;
        rows: number;
        medicines: Array<{
          name: string;
          dosage: string | null;
          confidence: number;
          positionX?: number | null;
          positionY?: number | null;
        }>;
      }>;
      aisleNumber?: string;
    }) => {
      const response = await fetch("/api/vision/quick-setup/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shelves, aisleNumber }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save");
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.shelfLocations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}

