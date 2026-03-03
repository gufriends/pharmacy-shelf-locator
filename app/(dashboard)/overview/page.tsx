"use client";

import { useDashboardStats } from "@/lib/hooks/use-medicines";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    Package,
    Layout,
    AlertTriangle,
    History,
    ArrowRight,
    Plus,
    Calendar,
    Layers
} from "lucide-react";

export default function OverviewPage() {
    const { data, isLoading } = useDashboardStats();

    if (isLoading) {
        return <OverviewLoading />;
    }

    const stats = data?.stats || {
        medicineCount: 0,
        rackCount: 0,
        categoryCount: 0,
        lowStockCount: 0,
        expiringSoonCount: 0,
    };

    const recentActivity = data?.recentActivity || [];

    const STAT_CARDS = [
        {
            label: "Total Obat",
            value: stats.medicineCount,
            icon: <Package className="w-5 h-5" />,
            color: "blue",
            description: "Item terdaftar di semua rak"
        },
        {
            label: "Total Rak",
            value: stats.rackCount,
            icon: <Layout className="w-5 h-5" />,
            color: "teal",
            description: "Lokasi penyimpanan fisik"
        },
        {
            label: "Stok Menipis",
            value: stats.lowStockCount,
            icon: <AlertTriangle className="w-5 h-5" />,
            color: "amber",
            description: "Quantity kurang dari 5",
            alert: stats.lowStockCount > 0
        },
        {
            label: "Segera Kadaluarsa",
            value: stats.expiringSoonCount,
            icon: <Calendar className="w-5 h-5" />,
            color: "red",
            description: "Dalam 30 hari ke depan",
            alert: stats.expiringSoonCount > 0
        }
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">Pantau inventaris dan aktivitas apotek Anda secara realtime.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/setup">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-500/20">
                            <Plus size={18} className="mr-2" />
                            Scan Rak Baru
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STAT_CARDS.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden relative group hover:shadow-md transition-shadow duration-300 rounded-3xl">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className={cn(
                                        "p-2.5 rounded-xl",
                                        stat.color === "blue" && "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                                        stat.color === "teal" && "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
                                        stat.color === "amber" && "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                                        stat.color === "red" && "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                    )}>
                                        {stat.icon}
                                    </div>
                                    {stat.alert && (
                                        <Badge variant="destructive" className="animate-pulse">Perlu Cek</Badge>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">{stat.label}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold">{stat.description}</p>
                                </div>

                                {/* Decorative background element */}
                                <div className={cn(
                                    "absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] group-hover:scale-110 transition-transform duration-500",
                                    stat.color === "blue" && "text-blue-600",
                                    stat.color === "teal" && "text-teal-600",
                                    stat.color === "amber" && "text-amber-600",
                                    stat.color === "red" && "text-red-600"
                                )}>
                                    {stat.icon}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400">
                                    <History size={20} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
                                    <CardDescription>Log perubahan inventaris terbaru</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((log: any) => (
                                    <div key={log.id} className="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                                log.action === "CREATE" && "bg-emerald-50 text-emerald-600",
                                                log.action === "UPDATE" && "bg-blue-50 text-blue-600",
                                                log.action === "DELETE" && "bg-red-50 text-red-600",
                                            )}>
                                                <iconify-icon
                                                    icon={log.action === "CREATE" ? "solar:add-circle-bold-duotone" : log.action === "UPDATE" ? "solar:pen-new-square-bold-duotone" : "solar:trash-bin-trash-bold-duotone"}
                                                    width="24" height="24"
                                                ></iconify-icon>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {getActionLabel(log)}
                                                    </p>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {new Date(log.createdAt).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-1">
                                                    {log.entityType} ID: <span className="font-mono text-[10px]">{log.entityId}</span>
                                                </p>
                                            </div>
                                            <iconify-icon icon="solar:alt-arrow-right-linear" className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all"></iconify-icon>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-slate-400 text-sm">Belum ada aktivitas tercatat</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    {recentActivity.length > 0 && (
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 text-xs font-bold uppercase tracking-wider">
                                Lihat Semua Log <ArrowRight size={14} className="ml-1.5" />
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Quick Actions / Categories Summary */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-3xl p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Pharmacy Pro Tip</h3>
                            <p className="text-teal-50/80 text-sm mb-6 leading-relaxed">Gunakan fitur <b>Quick Setup</b> untuk memetakan seluruh isi rak hanya dengan satu foto!</p>
                            <Link href="/setup">
                                <Button className="w-full bg-white text-teal-700 hover:bg-teal-50 font-bold py-6 rounded-2xl shadow-xl shadow-teal-900/20">
                                    🚀 Mulai Setup Sekarang
                                </Button>
                            </Link>
                        </div>
                        <iconify-icon icon="solar:stars-minimalistic-bold-duotone" width="120" height="120" className="absolute -right-8 -bottom-8 text-white/10 rotate-12"></iconify-icon>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-900/20 rounded-xl">
                                <Layers size={18} />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white">Kategori Rak</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center group">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Total Kategori</span>
                                <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{stats.categoryCount}</span>
                            </div>
                            <Link href="/categories" className="block">
                                <Button variant="outline" className="w-full h-11 rounded-xl text-xs font-bold text-slate-600 border-slate-200 hover:border-teal-500 hover:text-teal-600 transition-all group">
                                    Kelola Kategori <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function getActionLabel(log: any) {
    const type = log.entityType === "MedicineItem" ? "Obat" : "Rak";
    if (log.action === "CREATE") return `Menambah ${type} Baru`;
    if (log.action === "UPDATE") return `Memperbarui Data ${type}`;
    if (log.action === "DELETE") return `Menghapus ${type}`;
    return `${log.action} ${type}`;
}

function OverviewLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="lg:col-span-2 h-[500px] rounded-3xl" />
                <div className="space-y-6">
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-48 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}
