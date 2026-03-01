"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShelfLocator } from "@/components/shelf-locator";
import { VisualRack } from "@/components/shelf-locator/visual-rack";
import { MedicineSearch } from "@/components/shelf-locator/medicine-search";
import { QuickSetup } from "@/components/shelf-locator/quick-setup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut, useActiveOrganization } from "@/lib/auth-client";

type Tab = "map" | "search" | "browse";
type MapMode = "quick" | "manual";

export default function Home() {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [highlightedMedicine, setHighlightedMedicine] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("quick");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Redirect to pharmacy selector if no active pharmacy (after render, not during)
  useEffect(() => {
    if (session && !activeOrg) {
      router.push("/pharmacy");
    }
  }, [session, activeOrg, router]);

  // Show nothing while redirecting
  if (session && !activeOrg) {
    return null;
  }

  const handleSearchResultClick = (medicine: {
    name: string;
    shelfLocation: { name: string; category: string | null; };
  }) => {
    setHighlightedMedicine(medicine.name);
    setActiveTab("browse");
  };

  const handleQuickSetupComplete = () => {
    setActiveTab("browse");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "search", label: "Cari Obat", icon: "solar:minimalistic-magnifer-bold-duotone" },
    { id: "browse", label: "Lihat Rak", icon: "solar:archive-bold-duotone" },
    { id: "map", label: "Pemetaan", icon: "solar:camera-bold-duotone" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-teal-100/80 bg-white/90 backdrop-blur-xl dark:bg-slate-950/90 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-2 shadow-lg shadow-teal-500/20">
                <iconify-icon icon="solar:medical-kit-bold-duotone" width="24" height="24" style={{ color: "white" }}></iconify-icon>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  rivpharma
                </h1>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">
                  {activeOrg?.name || "Pharmacy Shelf Management"}
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block text-slate-700 dark:text-slate-300 font-medium max-w-[120px] truncate">
                  {session?.user?.name || "User"}
                </span>
                <iconify-icon icon="solar:alt-arrow-down-linear" width="16" height="16" style={{ color: "var(--color-muted-foreground)" }}></iconify-icon>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {session?.user?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {session?.user?.email || ""}
                      </p>
                    </div>
                    <a
                      href="/pharmacy"
                      className="w-full px-4 py-2.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <iconify-icon icon="solar:buildings-bold-duotone" width="18" height="18"></iconify-icon>
                      Ganti Pharmacy
                    </a>
                    <a
                      href="/pharmacy/settings"
                      className="w-full px-4 py-2.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <iconify-icon icon="solar:settings-bold-duotone" width="18" height="18"></iconify-icon>
                      Pengaturan
                    </a>
                    <div className="border-t border-slate-100 dark:border-slate-800"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
                    >
                      <iconify-icon icon="solar:logout-2-bold-duotone" width="18" height="18"></iconify-icon>
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-3 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 h-10 text-sm font-medium transition-all duration-200 rounded-lg
                  ${activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-300"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }
                `}
              >
                <iconify-icon icon={tab.icon} width="18" height="18" className="mr-1.5"></iconify-icon>
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-8">
        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Cari Lokasi Obat
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Cari obat dan temukan lokasinya di rak dalam hitungan detik
              </p>
            </div>
            <MedicineSearch onResultClick={handleSearchResultClick} />
          </div>
        )}

        {/* Browse Tab */}
        {activeTab === "browse" && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Visual Rack Browser
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Klik pada rak untuk melihat obat di dalamnya
              </p>
              {highlightedMedicine && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="py-1.5 bg-teal-50 text-teal-700 border border-teal-200">
                    <iconify-icon icon="solar:target-bold" width="14" height="14" className="mr-1"></iconify-icon>
                    {highlightedMedicine}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHighlightedMedicine(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <iconify-icon icon="solar:close-circle-bold" width="18" height="18"></iconify-icon>
                  </Button>
                </div>
              )}
            </div>
            <VisualRack
              highlightedMedicine={highlightedMedicine}
              onRackClick={() => setHighlightedMedicine(null)}
            />
          </div>
        )}

        {/* Map Tab */}
        {activeTab === "map" && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Pemetaan Inventaris Rak
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Gunakan AI untuk mengekstrak nama obat dari foto dan memetakan ke lokasi rak
              </p>
            </div>

            {/* Mode Selector */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setMapMode("quick")}
                  className={`
                    flex-1 h-10 text-sm font-medium transition-all duration-200 rounded-lg
                    ${mapMode === "quick"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                    }
                  `}
                >
                  <iconify-icon icon="solar:bolt-bold-duotone" width="18" height="18" className="mr-1.5"></iconify-icon>
                  Quick Setup
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setMapMode("manual")}
                  className={`
                    flex-1 h-10 text-sm font-medium transition-all duration-200 rounded-lg
                    ${mapMode === "manual"
                      ? "bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-300"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                    }
                  `}
                >
                  <iconify-icon icon="solar:settings-bold-duotone" width="18" height="18" className="mr-1.5"></iconify-icon>
                  Manual Setup
                </Button>
              </div>
            </div>

            {mapMode === "quick" ? (
              <div className="w-full max-w-2xl mx-auto">
                <QuickSetup onComplete={handleQuickSetupComplete} />
              </div>
            ) : (
              <ShelfLocator />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
