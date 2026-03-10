"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await (authClient as any).forgetPassword({
                email,
                redirectTo: "/reset-password",
            });

            if (authError) {
                setError(authError.message || "Gagal mengirim email reset password.");
                return;
            }

            setSuccess(true);
        } catch {
            setError("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                        <iconify-icon icon="solar:lock-keyhole-bold-duotone" width="32" height="32" style={{ color: "white" }}></iconify-icon>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Lupa Password?
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Jangan khawatir, kami akan mengirimkan instruksi untuk mengatur ulang password Anda.
                    </p>
                </div>

                <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                    <CardContent className="pt-6">
                        {success ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <iconify-icon icon="solar:letter-bold-duotone" width="32" height="32" className="text-teal-600"></iconify-icon>
                                </div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Cek Email Anda</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Kami telah mengirimkan link reset password ke <strong className="text-slate-900 dark:text-white">{email}</strong>.
                                    Silakan cek inbox (atau folder spam) Anda.
                                </p>
                                <div className="pt-4">
                                    <Button asChild variant="outline" className="w-full">
                                        <Link href="/login">Kembali ke Login</Link>
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500/20"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/25 transition-all duration-200 font-medium"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <iconify-icon icon="svg-spinners:ring-resize" width="18" height="18"></iconify-icon>
                                            Mengirim...
                                        </span>
                                    ) : (
                                        "Kirim Link Reset"
                                    )}
                                </Button>

                                <div className="text-center pt-2">
                                    <Link
                                        href="/login"
                                        className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium inline-flex items-center gap-1"
                                    >
                                        <iconify-icon icon="solar:arrow-left-bold" width="16" height="16"></iconify-icon>
                                        Kembali ke Login
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-400 mt-8">
                    © 2026 rivpharma. All rights reserved.
                </p>
            </div>
        </div>
    );
}
