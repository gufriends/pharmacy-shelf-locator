"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(error);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // If no token exists, redirect to forgot-password
    if (!token && typeof window !== "undefined") {
        router.replace("/forgot-password");
        return null;
    }

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setFormError("Password tidak cocok");
            return;
        }
        setLoading(true);
        setFormError(null);
        try {
            const { error: resetError } = await authClient.resetPassword({
                newPassword,
                token: token as string,
            });

            if (resetError) {
                setFormError(resetError.message || "Gagal mereset password. Link mungkin sudah kedaluwarsa.");
                return;
            }

            setMessage("Password berhasil direset! Mengalihkan ke login...");
            setTimeout(() => router.push("/login"), 2000);
        } catch {
            setFormError("Terjadi kesalahan sistem. Coba lagi nanti.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                    <iconify-icon icon="solar:lock-password-bold-duotone" width="32" height="32" style={{ color: "white" }}></iconify-icon>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Password Baru</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Masukkan password baru Anda di bawah ini.</p>
            </div>

            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                <CardContent className="pt-6">
                    {message && (
                        <Alert className="mb-4 border-teal-200 bg-teal-50 text-teal-800">
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    {formError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Password Baru</Label>
                            <div className="relative">
                                <Input id="newPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="h-11 pr-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
                                    <iconify-icon icon={showPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} width="20" height="20"></iconify-icon>
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                            <div className="relative">
                                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="h-11 pr-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" tabIndex={-1}>
                                    <iconify-icon icon={showConfirmPassword ? "solar:eye-bold" : "solar:eye-closed-bold"} width="20" height="20"></iconify-icon>
                                </button>
                            </div>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/25 transition-all duration-200 font-medium">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <iconify-icon icon="svg-spinners:ring-resize" width="18" height="18"></iconify-icon>
                                    Memproses...
                                </span>
                            ) : "Simpan Password Baru"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="text-center text-xs text-slate-400 mt-8">© 2026 rivpharma. All rights reserved.</p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
            </div>
            <Suspense fallback={
                <div className="text-center">
                    <iconify-icon icon="svg-spinners:ring-resize" width="40" height="40" className="text-teal-600"></iconify-icon>
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
