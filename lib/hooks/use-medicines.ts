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
  dashboardStats: ["dashboard-stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Gagal memuat statistik");
      return data as {
        stats: {
          medicineCount: number;
          rackCount: number;
          categoryCount: number;
          lowStockCount: number;
          expiringSoonCount: number;
        };
        recentActivity: any[];
      };
    },
  });
}

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

// Update medicine position (for drag and drop)
export function useUpdateMedicinePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, positionX, positionY }: { id: string; positionX: number; positionY: number }) => {
      const response = await fetch(`/api/medicines/${id}/position`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionX, positionY }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to update position");
      return data.medicine;
    },
    // Optimistic Update
    onMutate: async ({ id, positionX, positionY }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.visualization });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<VisualizationData>(queryKeys.visualization);

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<VisualizationData>(queryKeys.visualization, {
          ...previousData,
          allLocations: previousData.allLocations.map(location => ({
            ...location,
            medicines: location.medicines.map(med =>
              med.id === id ? { ...med, positionX, positionY } : med
            ),
          })),
        });
      }

      return { previousData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.visualization, context.previousData);
      }
    },
    // Always refetch after error or success to ensure we have the correct data
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}

// Update medicine details
export function useUpdateMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; dosage?: string | null; quantity?: number; notes?: string | null; categoryId?: string | null }) => {
      const response = await fetch(`/api/medicines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to update medicine");
      return data.medicine;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}

// Delete medicine
export function useDeleteMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/medicines/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to delete medicine");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}

// Create single medicine
export function useCreateMedicine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medicine: { shelfLocationId: string; name: string; dosage?: string | null; quantity?: number; notes?: string | null; positionX?: number | null; positionY?: number | null; categoryId?: string | null }) => {
      const response = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicine),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to create medicine");
      return data.medicine;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}

// Batch update shelf layout and medicine positions
export function useUpdateShelfLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      columns,
      rows,
      medicines
    }: {
      id: string;
      columns: number;
      rows: number;
      medicines: Array<{ id: string; positionX: number | null; positionY: number | null }>;
    }) => {
      const response = await fetch(`/api/shelf-locations/${id}/batch-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns, rows, medicines }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to update layout");
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.visualization });
    },
  });
}
