"use client";

import { useState } from "react";
import { QuickSetup } from "@/components/shelf-locator/quick-setup";
import { ShelfLocator } from "@/components/shelf-locator";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, Settings2 } from "lucide-react";

type MapMode = "quick" | "manual";

export default function SetupPage() {
    const [mapMode, setMapMode] = useState<MapMode>("quick");
    const router = useRouter();

    const handleQuickSetupComplete = () => {
        router.push("/racks");
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pemetaan Inventaris</h1>
                <p className="text-slate-500">Atur tata letak obat di dalam rak menggunakan AI atau secara manual.</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex justify-center mb-10">
                <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                    <button
                        onClick={() => setMapMode("quick")}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                            mapMode === "quick"
                                ? "bg-white dark:bg-slate-700 shadow-md text-teal-600 dark:text-teal-400 scale-[1.02]"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <Sparkles size={18} className={cn(mapMode === "quick" ? "text-teal-500" : "text-slate-400")} />
                        AI Auto Scan
                    </button>
                    <button
                        onClick={() => setMapMode("manual")}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                            mapMode === "manual"
                                ? "bg-white dark:bg-slate-700 shadow-md text-slate-900 dark:text-white scale-[1.02]"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        <Settings2 size={18} className={cn(mapMode === "manual" ? "text-slate-900 dark:text-white" : "text-slate-400")} />
                        Manual Setup
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-2 sm:p-6 lg:p-8 min-h-[600px] shadow-sm">
                {mapMode === "quick" ? (
                    <QuickSetup onComplete={handleQuickSetupComplete} />
                ) : (
                    <ShelfLocator />
                )}
            </div>
        </div>
    );
}
