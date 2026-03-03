"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Category {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    createdAt: string;
    updatedAt: string;
}

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: async (): Promise<Category[]> => {
            const response = await fetch("/api/categories");
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to fetch categories");
            return data.categories;
        },
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (category: Partial<Category>) => {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(category),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to create category");
            return data.category;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...category }: Partial<Category> & { id: string }) => {
            const response = await fetch(`/api/categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(category),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to update category");
            return data.category;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/categories/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error || "Failed to delete category");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
}
