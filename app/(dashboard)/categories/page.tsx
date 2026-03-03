"use client";

import { CategoryManagement } from "@/components/shelf-locator/category-management";

export default function CategoriesPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manajemen Kategori</h1>
                <p className="text-slate-500">Kustomisasi kategori untuk pengelompokan rak dan obat yang lebih rapi.</p>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm">
                <CategoryManagement />
            </div>
        </div>
    );
}
