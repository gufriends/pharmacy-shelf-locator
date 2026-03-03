"use client";

import { MedicineSearch } from "@/components/shelf-locator/medicine-search";
import { useRouter } from "next/navigation";

export default function SearchPage() {
    const router = useRouter();

    const handleSearchResultClick = (medicine: {
        name: string;
        shelfLocation: { name: string; category: string | null; id: string; };
    }) => {
        // Navigate to racks page with highlight parameter
        router.push(`/racks?highlight=${encodeURIComponent(medicine.name)}&rackId=${medicine.shelfLocation.id}`);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Cari Lokasi Obat</h1>
                <p className="text-slate-500">Ketik nama obat untuk menemukan lokasinya di dalam apotek.</p>
            </div>

            <MedicineSearch onResultClick={handleSearchResultClick} />
        </div>
    );
}
