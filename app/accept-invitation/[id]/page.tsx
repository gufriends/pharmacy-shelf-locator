"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AcceptInvitationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleAccept = async () => {
        setLoading(true);
        setError(null);
        try {
            await authClient.organization.acceptInvitation({ invitationId: id });
            setSuccess(true);
            setTimeout(() => router.push("/"), 2000);
        } catch {
            setError("Gagal menerima undangan. Link mungkin sudah expired atau tidak valid.");
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        try {
            await authClient.organization.rejectInvitation({ invitationId: id });
            router.push("/");
        } catch {
            setError("Gagal menolak undangan.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!session) {
            router.push(`/login?callbackUrl=/accept-invitation/${id}`);
        }
    }, [session, router, id]);

    if (!session) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                        <iconify-icon icon="solar:letter-opened-bold-duotone" width="32" height="32" style={{ color: "white" }}></iconify-icon>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Undangan Pharmacy</h1>
                    <p className="text-sm text-slate-500 mt-1">Anda diundang untuk bergabung</p>
                </div>

                <Card className="border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                    <CardContent className="pt-6">
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <iconify-icon icon="solar:check-circle-bold-duotone" width="32" height="32" className="text-teal-600"></iconify-icon>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Undangan diterima! Mengalihkan ke dashboard...
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                    Apakah Anda ingin menerima undangan ini dan bergabung ke pharmacy?
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleReject}
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        Tolak
                                    </Button>
                                    <Button
                                        onClick={handleAccept}
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                                    >
                                        {loading ? "Memproses..." : "Terima"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
