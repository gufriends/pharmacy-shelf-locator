"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient, useActiveOrganization, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type MemberRole = "owner" | "admin" | "member";

interface OrgMember {
    id: string;
    role: MemberRole;
    createdAt: Date;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
}

const roleLabels: Record<MemberRole, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Anggota",
};

const roleBadgeStyles: Record<MemberRole, string> = {
    owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    member: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function PharmacySettingsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { data: activeOrg, refetch: refetchOrg } = useActiveOrganization();

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<MemberRole>("member");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Edit pharmacy name
    const [editName, setEditName] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // Redirect after render (do not call router.push during render)
    useEffect(() => {
        if (!session) {
            router.push("/login");
            return;
        }
        if (!activeOrg) {
            router.push("/pharmacy");
        }
    }, [session, activeOrg, router]);

    if (!session || !activeOrg) {
        return null;
    }

    const members: OrgMember[] = (activeOrg.members || []) as OrgMember[];
    const currentMember = members.find((m) => m.userId === session.user.id);
    const isOwnerOrAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await authClient.organization.inviteMember({
                email: inviteEmail.trim(),
                role: inviteRole,
                organizationId: activeOrg.id,
            });
            if (result.error) {
                setError(result.error.message || "Gagal mengirim undangan");
                return;
            }
            setSuccess(`Undangan terkirim ke ${inviteEmail}`);
            setInviteEmail("");
        } catch {
            setError("Gagal mengirim undangan. Coba lagi.");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Yakin ingin menghapus anggota ini?")) return;
        try {
            await authClient.organization.removeMember({
                memberIdOrEmail: memberId,
                organizationId: activeOrg.id,
            });
            await refetchOrg();
        } catch {
            setError("Gagal menghapus anggota.");
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: MemberRole) => {
        try {
            await authClient.organization.updateMemberRole({
                memberId,
                role: newRole,
                organizationId: activeOrg.id,
            });
            await refetchOrg();
        } catch {
            setError("Gagal mengubah peran.");
        }
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            await authClient.organization.update({
                data: { name: editName.trim() },
                organizationId: activeOrg.id,
            });
            await refetchOrg();
            setEditName("");
            setSuccess("Nama pharmacy berhasil diperbarui");
        } catch {
            setError("Gagal memperbarui nama.");
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteOrg = async () => {
        if (!confirm("⚠️ PERINGATAN: Semua data pharmacy (rak, obat, anggota) akan dihapus permanen. Yakin?")) return;
        try {
            await authClient.organization.delete({ organizationId: activeOrg.id });
            router.push("/pharmacy");
            router.refresh();
        } catch {
            setError("Gagal menghapus pharmacy.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
            <div className="max-w-3xl mx-auto pt-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <a href="/" className="text-sm text-teal-600 hover:text-teal-700 font-medium mb-2 inline-flex items-center gap-1">
                            <iconify-icon icon="solar:arrow-left-linear" width="16" height="16"></iconify-icon>
                            Dashboard
                        </a>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <iconify-icon icon="solar:settings-bold-duotone" width="24" height="24" className="text-teal-600"></iconify-icon>
                            Pengaturan Pharmacy
                        </h1>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="mb-6 border-teal-200 bg-teal-50 text-teal-800">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    {/* Pharmacy Info */}
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80">
                        <CardHeader>
                            <CardTitle className="text-lg">Informasi Pharmacy</CardTitle>
                            <CardDescription>Kelola informasi dasar pharmacy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                                    {activeOrg.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{activeOrg.name}</h3>
                                    <p className="text-sm text-slate-500">{activeOrg.slug}</p>
                                </div>
                            </div>

                            {isOwnerOrAdmin && (
                                <form onSubmit={handleUpdateName} className="flex gap-2">
                                    <Input placeholder="Nama baru" value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10" />
                                    <Button type="submit" disabled={editLoading || !editName.trim()} variant="outline" className="h-10 px-4">
                                        {editLoading ? "..." : "Ubah"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Members */}
                    <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <iconify-icon icon="solar:users-group-rounded-bold-duotone" width="22" height="22" className="text-teal-600"></iconify-icon>
                                Anggota ({members.length})
                            </CardTitle>
                            <CardDescription>Kelola anggota pharmacy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                                                {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {member.user.name}
                                                    {member.userId === session.user.id && <span className="text-xs text-slate-400 ml-1">(Anda)</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">{member.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadgeStyles[member.role as MemberRole]}`}>
                                                {roleLabels[member.role as MemberRole]}
                                            </span>
                                            {isOwnerOrAdmin && member.userId !== session.user.id && member.role !== "owner" && (
                                                <div className="flex items-center gap-1">
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleUpdateRole(member.id, e.target.value as MemberRole)}
                                                        className="text-xs border rounded px-1.5 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                                    >
                                                        <option value="member">Anggota</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:text-red-700 p-1">
                                                        <iconify-icon icon="solar:trash-bin-2-bold" width="16" height="16"></iconify-icon>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invite Members */}
                    {isOwnerOrAdmin && (
                        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <iconify-icon icon="solar:user-plus-bold-duotone" width="22" height="22" className="text-teal-600"></iconify-icon>
                                    Undang Anggota
                                </CardTitle>
                                <CardDescription>Kirim undangan via email</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleInvite} className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="flex-1 space-y-2">
                                            <Label htmlFor="inviteEmail">Email</Label>
                                            <Input id="inviteEmail" type="email" placeholder="colleague@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required className="h-10" />
                                        </div>
                                        <div className="w-32 space-y-2">
                                            <Label htmlFor="inviteRole">Peran</Label>
                                            <select
                                                id="inviteRole"
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                                                className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
                                            >
                                                <option value="member">Anggota</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={inviteLoading} className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white">
                                        {inviteLoading ? "Mengirim..." : "Kirim Undangan"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Danger Zone */}
                    {currentMember?.role === "owner" && (
                        <Card className="border border-red-200 dark:border-red-900/30 shadow-lg bg-white/80 dark:bg-slate-900/80">
                            <CardHeader>
                                <CardTitle className="text-lg text-red-600">Zona Bahaya</CardTitle>
                                <CardDescription>Tindakan ini tidak dapat dibatalkan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" onClick={handleDeleteOrg} className="flex items-center gap-2">
                                    <iconify-icon icon="solar:trash-bin-2-bold" width="18" height="18"></iconify-icon>
                                    Hapus Pharmacy
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
