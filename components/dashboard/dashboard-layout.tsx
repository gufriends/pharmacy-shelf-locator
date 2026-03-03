"use client";

import { Sidebar } from "./sidebar";
import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "./command-palette";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending: isSessionLoading } = useSession();
    const { data: activeOrg, isPending: isActiveOrgLoading } = useActiveOrganization();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Authentication & Org Guard
    useEffect(() => {
        if (!isSessionLoading && !session) {
            router.push("/login");
        } else if (!isSessionLoading && session && !isActiveOrgLoading && !activeOrg) {
            // Allow /pharmacy page for org selection
            if (pathname !== "/pharmacy") {
                router.push("/pharmacy");
            }
        }
    }, [session, isSessionLoading, activeOrg, isActiveOrgLoading, router, pathname]);

    if (isSessionLoading || isActiveOrgLoading || !session) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Menghubungkan ke Rivpharma...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#0b1120] overflow-hidden">
            <CommandPalette />
            {/* Sidebar - Desktop */}
            <div className="hidden md:block h-full">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 z-50 md:hidden"
                        >
                            <Sidebar />
                            {/* Close button for mobile */}
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-6 -right-12 p-2 bg-white dark:bg-slate-800 rounded-full text-slate-500 shadow-xl"
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header */}
                <header className="h-20 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-slate-500 hover:text-teal-600 md:hidden transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
                            <span>{activeOrg?.name}</span>
                            <span className="text-slate-200">/</span>
                            <span className="text-slate-900 dark:text-white">{pathname.split("/").filter(Boolean).pop() || "Dashboard"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Command Palette Trigger Hint */}
                        <button className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 hover:text-slate-600 transition-colors border border-slate-200/50 dark:border-slate-700/50 group">
                            <Search size={16} />
                            <span className="text-xs font-medium">Cari sesuatu...</span>
                            <kbd className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-400 transition-all">⌘ K</kbd>
                        </button>

                        <Button variant="ghost" size="icon" className="relative text-slate-500 rounded-xl hover:bg-teal-50 hover:text-teal-600">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white dark:border-slate-900" />
                        </Button>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                        <div className="hidden sm:flex items-center gap-3 pl-2">
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{session.user.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium">Pharmacist</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold border border-teal-200/50 dark:border-teal-700/50">
                                {session.user.name?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Body */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    );
}
