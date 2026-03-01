"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp, authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Mode = "login" | "register";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showVerifyNotice, setShowVerifyNotice] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === "login") {
                const result = await signIn.email({ email, password });
                if (result.error) {
                    setError(result.error.message || "Login gagal. Periksa email dan password Anda.");
                    return;
                }
                router.push(callbackUrl);
                router.refresh();
            } else {
                const result = await signUp.email({ email, password, name });
                if (result.error) {
                    setError(result.error.message || "Registrasi gagal. Coba lagi.");
                    return;
                }
                setShowVerifyNotice(true);
            }
        } catch {
            setError(mode === "login" ? "Login gagal. Periksa email dan password Anda." : "Registrasi gagal. Coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        await signIn.social({
            provider: "google",
            callbackURL: callbackUrl,
        });
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError("Masukkan email terlebih dahulu");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (authClient as any).forgetPassword({ email, redirectTo: "/reset-password" });
            setError(null);
            alert("Link reset password telah dikirim ke email Anda.");
        } catch {
            setError("Gagal mengirim email reset password.");
        } finally {
            setLoading(false);
        }
    };

    if (showVerifyNotice) {
        return (
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                        <iconify-icon icon="solar:letter-bold-duotone" width="32" height="32" style={{ color: "white" }}></iconify-icon>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Verifikasi Email
                    </h1>
                </div>
                <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
                                <iconify-icon icon="solar:mailbox-bold-duotone" width="32" height="32" className="text-teal-600"></iconify-icon>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Kami telah mengirim email verifikasi ke <strong className="text-slate-900 dark:text-white">{email}</strong>.
                                Silakan cek inbox Anda dan klik link verifikasi untuk mengaktifkan akun.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => { setShowVerifyNotice(false); setMode("login"); }}
                                className="w-full"
                            >
                                Kembali ke Login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md relative z-10">
            {/* Logo & Brand */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                    <iconify-icon icon="solar:medical-kit-bold-duotone" width="32" height="32" style={{ color: "white" }}></iconify-icon>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">rivpharma</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pharmacy Shelf Management</p>
            </div>

            <Card className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                <CardHeader className="pb-4">
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setMode("login"); setError(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "login"
                                ? "bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-300"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            Masuk
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMode("register"); setError(null); }}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === "register"
                                ? "bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-300"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            Daftar
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Google OAuth */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleLogin}
                        className="w-full h-11 flex items-center gap-3 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                        <iconify-icon icon="flat-color-icons:google" width="20" height="20"></iconify-icon>
                        {mode === "login" ? "Masuk dengan Google" : "Daftar dengan Google"}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400">atau</span></div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "register" && (
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</Label>
                                <Input id="name" type="text" placeholder="Masukkan nama lengkap" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500/20" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                            <Input id="email" type="email" placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500/20" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</Label>
                                {mode === "login" && (
                                    <button type="button" onClick={handleForgotPassword} className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium">
                                        Lupa password?
                                    </button>
                                )}
                            </div>
                            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500/20" />
                            {mode === "register" && <p className="text-xs text-slate-400 mt-1">Minimal 8 karakter</p>}
                        </div>
                        <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg shadow-teal-600/25 transition-all duration-200 font-medium">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <iconify-icon icon="svg-spinners:ring-resize" width="18" height="18"></iconify-icon>
                                    {mode === "login" ? "Memproses..." : "Mendaftar..."}
                                </span>
                            ) : (mode === "login" ? "Masuk" : "Daftar")}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p className="text-center text-xs text-slate-400 mt-6">© 2026 rivpharma. All rights reserved.</p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
            </div>
            <Suspense fallback={
                <div className="w-full max-w-md text-center">
                    <div className="animate-pulse space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-teal-200 mx-auto" />
                        <div className="h-8 w-40 bg-slate-200 rounded mx-auto" />
                        <div className="h-64 bg-slate-100 rounded-xl" />
                    </div>
                </div>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
