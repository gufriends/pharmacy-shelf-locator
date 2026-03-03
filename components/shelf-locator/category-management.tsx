"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/lib/hooks/use-categories";

const COLOR_OPTIONS = [
    { name: "Teal", class: "bg-teal-500", value: "teal" },
    { name: "Blue", class: "bg-blue-500", value: "blue" },
    { name: "Red", class: "bg-red-500", value: "red" },
    { name: "Green", class: "bg-green-500", value: "green" },
    { name: "Purple", class: "bg-purple-500", value: "purple" },
    { name: "Amber", class: "bg-amber-500", value: "amber" },
    { name: "Slate", class: "bg-slate-500", value: "slate" },
];

export function CategoryManagement() {
    const { data: categories, isLoading, error: fetchError } = useCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [form, setForm] = useState({ name: "", description: "", color: "teal" });
    const [error, setError] = useState<string | null>(null);

    const resetForm = () => {
        setForm({ name: "", description: "", color: "teal" });
        setEditingCategory(null);
        setError(null);
    };

    const handleOpenDialog = (category?: any) => {
        if (category) {
            setEditingCategory(category);
            setForm({
                name: category.name,
                description: category.description || "",
                color: category.color || "teal",
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setError("Nama kategori harus diisi");
            return;
        }

        try {
            if (editingCategory) {
                await updateMutation.mutateAsync({
                    id: editingCategory.id,
                    ...form,
                });
            } else {
                await createMutation.mutateAsync(form);
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Apakah Anda yakin ingin menghapus kategori ini? Semua rak yang menggunakan kategori ini akan kehilangan label kategorinya.")) {
            try {
                await deleteMutation.mutateAsync(id);
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold font-display">Manage Categories</h2>
                    <p className="text-sm text-slate-500">Buat dan atur kategori untuk rak apotek Anda</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="bg-teal-600 hover:bg-teal-700">
                    <iconify-icon icon="solar:add-circle-bold" width="20" height="20" className="mr-2"></iconify-icon>
                    Tambah Kategori
                </Button>
            </div>

            {fetchError && (
                <Alert variant="destructive">
                    <AlertDescription>Gagal memuat kategori: {fetchError.message}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories?.map((category) => (
                    <Card key={category.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-${category.color}-500 shadow-sm shadow-${category.color}-500/20`} />
                                    <CardTitle className="text-lg">{category.name}</CardTitle>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(category)} className="h-8 w-8 p-0">
                                        <iconify-icon icon="solar:pen-bold" width="16" height="16"></iconify-icon>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <iconify-icon icon="solar:trash-bin-trash-bold" width="16" height="16"></iconify-icon>
                                    </Button>
                                </div>
                            </div>
                            {category.description && (
                                <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                            )}
                        </CardHeader>
                    </Card>
                ))}

                {categories?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <iconify-icon icon="solar:folder-error-bold-duotone" width="48" height="48" className="opacity-30 mb-2"></iconify-icon>
                        <p className="font-medium">Belum ada kategori</p>
                        <p className="text-sm mt-1">Tambah kategori pertama Anda untuk mulai mengatur rak</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Update Kategori" : "Tambah Kategori Baru"}</DialogTitle>
                        <DialogDescription>
                            Atur detail kategori untuk membantu pengelompokan rak
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Nama Kategori *</Label>
                            <Input
                                id="category-name"
                                placeholder="mis. Cardiology, Antibiotics"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-description">Deskripsi (opsional)</Label>
                            <Input
                                id="category-description"
                                placeholder="Keterangan kategori..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Warna Aksen</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_OPTIONS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, color: color.value })}
                                        className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${form.color === color.value ? "border-slate-900 scale-110 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}
                      bg-${color.value}-500
                    `}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11">
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="bg-teal-600 hover:bg-teal-700 h-11"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                                editingCategory ? "Simpan Perubahan" : "Tambah Kategori"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
