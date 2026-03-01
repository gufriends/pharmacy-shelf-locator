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

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(error);

    // If token exists, show reset password form
    if (token) {
        const handleReset = async (e: React.FormEvent) => {
            e.preventDefault();
            if (newPassword !== confirmPassword) {
                setFormError("Password tidak cocok");
                return;
            }
            setLoading(true);
            setFormError(null);
            try {
                await authClient.resetPassword({ newPassword, token });
                setMessage("Password berhasil direset! Mengalihkan ke login...");
                setTimeout(() => router.push("/login"), 2000);
            } catch {
                setFormError("Gagal mereset password. Token mungkin sudah expired.");
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
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Password Baru</h1>
                    <p className="text-sm text-slate-500 mt-1">Masukkan password baru Anda</p>
                </div>

                <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
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
                                <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="h-11" />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white">
                                {loading ? "Memproses..." : "Reset Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // No token — show request form
    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFormError(null);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (authClient as any).forgetPassword({ email, redirectTo: "/reset-password" });
            setMessage("Link reset password telah dikirim ke email Anda.");
        } catch {
            setFormError("Gagal mengirim email. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                    <iconify-icon icon="solar:lock-keyhole-bold-duotone" width="32" height="32" style={{ color: "white" }}></iconify-icon>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lupa Password?</h1>
                <p className="text-sm text-slate-500 mt-1">Masukkan email untuk menerima link reset</p>
            </div>

            <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                <CardHeader>
                    <CardTitle className="sr-only">Reset Password</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <form onSubmit={handleRequest} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white">
                            {loading ? "Mengirim..." : "Kirim Link Reset"}
                        </Button>
                    </form>
                    <div className="text-center mt-4">
                        <a href="/login" className="text-sm text-teal-600 hover:text-teal-700 font-medium">← Kembali ke Login</a>
                    </div>
                </CardContent>
            </Card>
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
            <Suspense fallback={<div className="animate-pulse w-full max-w-md h-64 bg-slate-100 rounded-xl" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
