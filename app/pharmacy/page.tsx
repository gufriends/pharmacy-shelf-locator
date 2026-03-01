"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient, useSession, useListOrganizations, useActiveOrganization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PharmacyPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { data: organizations, refetch } = useListOrganizations();
    const { data: activeOrg } = useActiveOrganization();

    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect to login after render (do not call router.push during render)
    useEffect(() => {
        if (!session) {
            router.push("/login");
        }
    }, [session, router]);

    if (!session) {
        return null;
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await authClient.organization.create({
                name: name.trim(),
                slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            });
            if (result.error) {
                setError(result.error.message || "Gagal membuat pharmacy");
                return;
            }
            // Set as active
            await authClient.organization.setActive({ organizationId: result.data!.id });
            await refetch();
            router.push("/");
            router.refresh();
        } catch {
            setError("Gagal membuat pharmacy. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (orgId: string) => {
        setLoading(true);
        try {
            await authClient.organization.setActive({ organizationId: orgId });
            router.push("/");
            router.refresh();
        } catch {
            setError("Gagal memilih pharmacy.");
        } finally {
            setLoading(false);
        }
    };

    const orgList = organizations || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
            </div>

            <div className="max-w-2xl mx-auto relative z-10 pt-8 sm:pt-12">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                        <iconify-icon icon="solar:buildings-bold-duotone" width="28" height="28" style={{ color: "white" }}></iconify-icon>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Pharmacy</h1>
                    <p className="text-sm text-slate-500 mt-1 px-4">
                        {orgList.length > 0
                            ? "Pilih pharmacy atau buat baru"
                            : "Buat pharmacy pertama Anda untuk memulai"}
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Existing pharmacies */}
                {orgList.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pharmacy Anda</h2>
                        {orgList.map((org) => (
                            <Card
                                key={org.id}
                                className={`border cursor-pointer transition-all hover:shadow-md ${activeOrg?.id === org.id
                                    ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20"
                                    : "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80"
                                    }`}
                                onClick={() => handleSelect(org.id)}
                            >
                                <CardContent className="py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{org.name}</p>
                                            <p className="text-xs text-slate-500">{org.slug}</p>
                                        </div>
                                    </div>
                                    {activeOrg?.id === org.id && (
                                        <span className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 px-2.5 py-1 rounded-full font-medium">
                                            Aktif
                                        </span>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Create new pharmacy */}
                {!showCreate ? (
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/25 font-medium"
                    >
                        <iconify-icon icon="solar:add-circle-bold" width="20" height="20" className="mr-2"></iconify-icon>
                        Buat Pharmacy Baru
                    </Button>
                ) : (
                    <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <iconify-icon icon="solar:buildings-2-bold-duotone" width="22" height="22" className="text-teal-600"></iconify-icon>
                                Buat Pharmacy Baru
                            </CardTitle>
                            <CardDescription>Isi detail pharmacy Anda</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Pharmacy</Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Apotek Sinar Sehat"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                                        }}
                                        required
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (URL)</Label>
                                    <Input
                                        id="slug"
                                        placeholder="apotek-sinar-sehat"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        required
                                        className="h-11"
                                    />
                                    <p className="text-xs text-slate-400">Digunakan sebagai identifier unik</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                                    >
                                        {loading ? "Membuat..." : "Buat Pharmacy"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Back link */}
                {orgList.length > 0 && (
                    <div className="text-center mt-6">
                        <a href="/" className="text-sm text-teal-600 hover:text-teal-700 font-medium">← Kembali ke Dashboard</a>
                    </div>
                )}
            </div>
        </div>
    );
}
