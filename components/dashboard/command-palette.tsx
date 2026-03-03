"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Package,
    Layout,
    Tag,
    Settings,
    UserPlus,
    Command as CommandIcon,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ACTIONS = [
    { id: "overview", label: "Dashboard Overview", icon: <Package className="w-4 h-4" />, href: "/overview" },
    { id: "search", label: "Cari Obat", icon: <Search className="w-4 h-4" />, href: "/search" },
    { id: "racks", label: "Lihat Rak Visual", icon: <Layout className="w-4 h-4" />, href: "/racks" },
    { id: "setup", label: "Setup Inventaris (AI)", icon: <Search className="w-4 h-4" />, href: "/setup" },
    { id: "categories", label: "Manajemen Kategori", icon: <Tag className="w-4 h-4" />, href: "/categories" },
    { id: "settings", label: "Pengaturan Pharmacy", icon: <Settings className="w-4 h-4" />, href: "/pharmacy/settings" },
    { id: "invite", label: "Undang Anggota Tim", icon: <UserPlus className="w-4 h-4" />, href: "/pharmacy/settings" },
];

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const filteredActions = query === ""
        ? ACTIONS
        : ACTIONS.filter(action =>
            action.label.toLowerCase().includes(query.toLowerCase())
        );

    const onSelect = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setQuery("");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <Search className="w-5 h-5 text-slate-400 mr-3" />
                            <input
                                autoFocus
                                placeholder="Apa yang ingin Anda lakukan?"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-lg"
                            />
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-3 custom-scrollbar">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
                                Actions & Navigation
                            </div>
                            <div className="space-y-1">
                                {filteredActions.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => onSelect(action.href)}
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-teal-50 dark:hover:bg-teal-900/20 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition-all text-left group"
                                    >
                                        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
                                            {action.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold group-hover:translate-x-1 transition-transform">{action.label}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{action.href}</p>
                                        </div>
                                    </button>
                                ))}
                                {filteredActions.length === 0 && (
                                    <div className="py-12 text-center text-slate-400">
                                        <p className="text-sm">Tidak ditemukan hasil untuk "{query}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold shadow-sm">Enter</kbd>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Select</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <kbd className="px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold shadow-sm">Esc</kbd>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Close</span>
                                </div>
                            </div>
                            <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-lg">
                                Rivpharma AI
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
