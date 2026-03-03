"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useActiveOrganization, useSession, authClient } from "@/lib/auth-client";
import {
    BarChart3,
    Search,
    LayoutGrid,
    Camera,
    Tags,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    UserPlus
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
    {
        label: "Overview",
        icon: "solar:chart-2-bold-duotone",
        href: "/overview",
    },
    {
        label: "Pencarian",
        icon: "solar:magnifer-zoom-in-bold-duotone",
        href: "/search",
    },
    {
        label: "Rak Visual",
        icon: "solar:widget-6-bold-duotone",
        href: "/racks",
    },
    {
        label: "Quick Setup",
        icon: "solar:camera-add-bold-duotone",
        href: "/setup",
    },
    {
        label: "Kategori",
        icon: "solar:tag-bold-duotone",
        href: "/categories",
    },
];

const SECONDARY_NAV_ITEMS = [
    {
        label: "Undang Tim",
        icon: "solar:user-plus-bold-duotone",
        href: "/pharmacy/settings",
    },
    {
        label: "Settings",
        icon: "solar:settings-bold-duotone",
        href: "/pharmacy/settings",
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: activeOrg } = useActiveOrganization();
    const { data: session } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await authClient.signOut();
        window.location.href = "/login";
    };

    return (
        <div className={cn(
            "relative flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo Section */}
            <div className="flex items-center h-20 px-6 border-b border-slate-50 dark:border-slate-800/50">
                <Link href="/overview" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
                        <iconify-icon icon="solar:pill-bold" width="24" height="24"></iconify-icon>
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            rivpharma
                        </span>
                    )}
                </Link>
            </div>

            {/* Navigation Rails */}
            <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Main Nav */}
                <div className="space-y-1">
                    {!isCollapsed && (
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">
                            Main Menu
                        </p>
                    )}
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                pathname === item.href
                                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <iconify-icon
                                icon={item.icon}
                                width="22"
                                height="22"
                                className={cn(
                                    "transition-transform duration-200 group-hover:scale-110",
                                    pathname === item.href ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"
                                )}
                            ></iconify-icon>
                            {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}

                            {/* Active Indicator Pipe */}
                            {pathname === item.href && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-full" />
                            )}

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>

                {/* Support Nav */}
                <div className="space-y-1">
                    {!isCollapsed && (
                        <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">
                            Settings & Team
                        </p>
                    )}
                    {SECONDARY_NAV_ITEMS.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                pathname === item.href
                                    ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <iconify-icon
                                icon={item.icon}
                                width="22"
                                height="22"
                                className={cn(
                                    "transition-transform duration-200 group-hover:scale-110",
                                    pathname === item.href ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"
                                )}
                            ></iconify-icon>
                            {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </div>

            {/* User Section */}
            <div className="p-4 border-t border-slate-50 dark:border-slate-800/50">
                <div className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50",
                    isCollapsed ? "justify-center" : ""
                )}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold flex-shrink-0 border-2 border-white dark:border-slate-700">
                        {session?.user.name?.charAt(0) || "U"}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {session?.user.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-medium">
                                {activeOrg?.name}
                            </p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <iconify-icon icon="solar:logout-2-bold-duotone" width="20" height="20"></iconify-icon>
                        </button>
                    )}
                </div>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-teal-600 shadow-sm z-30 transition-colors"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </div>
    );
}
