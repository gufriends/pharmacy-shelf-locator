"use client";

import { VisualRack } from "@/components/shelf-locator/visual-rack";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Target } from "lucide-react";
import { Suspense } from "react";

function RacksContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const highlightedMedicine = searchParams.get("highlight");

    const clearHighlight = () => {
        router.push("/racks");
    };

    return (
        <div className="space-y-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Visual Rack Browser</h1>
                <p className="text-slate-500">Lihat distribusi obat di seluruh rak apotek secara visual.</p>

                {highlightedMedicine && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Badge className="py-2 px-4 bg-teal-50 text-teal-700 border-teal-200 gap-2 flex items-center rounded-xl">
                            <Target size={14} />
                            Menyorot: <span className="font-bold">{highlightedMedicine}</span>
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearHighlight}
                            className="text-slate-400 hover:text-red-500 rounded-full"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                )}
            </div>

            <VisualRack
                highlightedMedicine={highlightedMedicine}
                onRackClick={() => { }}
            />
        </div>
    );
}

export default function RacksPage() {
    return (
        <Suspense fallback={<div>Memuat rak...</div>}>
            <RacksContent />
        </Suspense>
    );
}
