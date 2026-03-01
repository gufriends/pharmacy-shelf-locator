"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useVisualization } from "@/lib/hooks/use-medicines";
import type { RackVisualization, MedicineInRack } from "@/lib/hooks/use-medicines";

interface VisualRackProps {
  highlightedMedicine?: string | null;
  onRackClick?: (rack: RackVisualization) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  Cardiology: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "solar:heart-pulse-bold-duotone" },
  Antibiotics: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "solar:test-tube-bold-duotone" },
  "Pain Management": { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "solar:adhesive-plaster-bold-duotone" },
  Diabetes: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "solar:dropper-bold-duotone" },
  Respiratory: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "solar:lungs-bold-duotone" },
  General: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", icon: "solar:medical-kit-bold-duotone" },
};

function getCategoryColor(category: string | null) {
  if (!category) return CATEGORY_COLORS.General;
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
}

function RackCard({
  rack,
  highlightedMedicine,
  onClick
}: {
  rack: RackVisualization;
  highlightedMedicine: string | null;
  onClick: () => void;
}) {
  const colors = getCategoryColor(rack.category);
  const hasMedicines = rack.medicineCount > 0;

  const isHighlighted = highlightedMedicine
    ? rack.medicines.some((m) =>
      m.name.toLowerCase().includes(highlightedMedicine.toLowerCase())
    )
    : false;

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full p-4 rounded-xl border-2 transition-all duration-300
        ${colors.bg} ${colors.border}
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        ${isHighlighted ? "ring-4 ring-teal-500 ring-offset-2 shadow-lg" : ""}
        min-h-[120px] flex flex-col text-left group
      `}
    >
      {/* Rack Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className={`font-bold text-lg ${colors.text}`}>{rack.name}</h3>
          {rack.category && (
            <Badge variant="outline" className="mt-1 text-xs border-current/20">
              {rack.category}
            </Badge>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {rack.aisleNumber && (
            <span className="text-xs text-slate-400 font-medium">
              Lorong {rack.aisleNumber}
            </span>
          )}
          {rack.rowNumber && (
            <span className="text-xs text-slate-400">
              Baris {rack.rowNumber}
            </span>
          )}
        </div>
      </div>

      {/* Medicine Preview */}
      <div className="flex-1">
        {hasMedicines ? (
          <div className="space-y-1">
            {rack.medicines.slice(0, 3).map((med) => {
              const isMedicineHighlighted = highlightedMedicine
                ? med.name.toLowerCase().includes(highlightedMedicine.toLowerCase())
                : false;

              return (
                <div
                  key={med.id}
                  className={`
                    text-xs px-2 py-1 rounded-lg bg-white/70 truncate transition-colors
                    ${isMedicineHighlighted
                      ? "font-bold text-teal-700 bg-teal-50 border border-teal-200"
                      : "text-slate-600"}
                  `}
                >
                  {med.name}
                  {med.dosage && <span className="text-slate-400 ml-1">({med.dosage})</span>}
                </div>
              );
            })}
            {rack.medicineCount > 3 && (
              <div className="text-xs text-slate-400 px-2 italic">
                +{rack.medicineCount - 3} lainnya...
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-12 text-slate-400 text-sm gap-1.5">
            <iconify-icon icon="solar:box-bold-duotone" width="16" height="16"></iconify-icon>
            Rak kosong
          </div>
        )}
      </div>

      {/* Medicine Count Badge */}
      <div className="absolute -top-2 -right-2">
        <Badge
          className={`
            h-6 min-w-6 rounded-full text-xs font-bold
            ${hasMedicines
              ? "bg-teal-600 text-white shadow-md shadow-teal-600/30"
              : "bg-slate-200 text-slate-500"
            }
          `}
        >
          {rack.medicineCount}
        </Badge>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <iconify-icon icon="solar:arrow-right-bold" width="16" height="16" style={{ color: "var(--color-muted-foreground)" }}></iconify-icon>
      </div>
    </button>
  );
}

function MedicineList({ rack }: { rack: RackVisualization }) {
  const { medicines, columns, rows } = rack;

  if (medicines.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <iconify-icon icon="solar:box-bold-duotone" width="48" height="48" style={{ opacity: 0.3 }}></iconify-icon>
        <p className="mt-2">Tidak ada obat di lokasi ini</p>
      </div>
    );
  }

  // Generate grid slots
  const gridCells = Array.from({ length: rows * columns }).map((_, index) => {
    const x = index % columns;
    const y = Math.floor(index / columns);
    const item = medicines.find(m => m.positionX === x && m.positionY === y);
    return { x, y, item };
  });

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500 mb-2 font-medium flex items-center gap-1.5">
        <iconify-icon icon="solar:widget-bold-duotone" width="14" height="14"></iconify-icon>
        Layout Visual ({columns}×{rows})
      </div>
      <div
        className="grid gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-x-auto"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(120px, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(100px, auto))`
        }}
      >
        {gridCells.map((cell, idx) => (
          <div
            key={idx}
            className={`
              p-3 rounded-lg border text-sm flex flex-col justify-center items-center text-center transition-all
              ${cell.item
                ? "bg-white dark:bg-slate-700 border-teal-100 dark:border-teal-800 shadow-sm hover:shadow-md"
                : "bg-transparent border-dashed border-slate-200 dark:border-slate-700 text-slate-400"
              }
            `}
          >
            {cell.item ? (
              <>
                <div className="font-semibold text-slate-700 dark:text-slate-200 truncate w-full" title={cell.item.name}>
                  {cell.item.name}
                </div>
                {cell.item.dosage && (
                  <div className="text-xs text-slate-500 mt-1">{cell.item.dosage}</div>
                )}
                {cell.item.quantity !== null && (
                  <Badge variant="secondary" className="mt-2 text-[10px] px-1.5 py-0 h-4 bg-teal-50 text-teal-700">
                    Qty: {cell.item.quantity}
                  </Badge>
                )}
              </>
            ) : (
              <span className="opacity-50 text-xs">Slot Kosong</span>
            )}
          </div>
        ))}
      </div>

      {/* Unmapped medicines */}
      {medicines.some(m => m.positionX === null || m.positionY === null) && (
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="text-xs text-slate-500 mb-2 font-medium flex items-center gap-1.5">
            <iconify-icon icon="solar:list-bold-duotone" width="14" height="14"></iconify-icon>
            Item Belum Dipetakan
          </div>
          <div className="space-y-2">
            {medicines.filter(m => m.positionX === null || m.positionY === null).map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
              >
                <div>
                  <span className="font-medium text-sm">{med.name}</span>
                  {med.dosage && (
                    <span className="text-slate-500 ml-2 text-xs">({med.dosage})</span>
                  )}
                </div>
                {med.quantity !== null && (
                  <Badge variant="secondary" className="text-xs bg-teal-50 text-teal-700">Qty: {med.quantity}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VisualRack({ highlightedMedicine, onRackClick }: VisualRackProps) {
  const [selectedRack, setSelectedRack] = useState<RackVisualization | null>(null);
  const { data, isLoading, error } = useVisualization();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center text-destructive">
          <iconify-icon icon="solar:danger-triangle-bold-duotone" width="32" height="32" className="mb-2"></iconify-icon>
          <p>Gagal memuat visualisasi rak</p>
        </CardContent>
      </Card>
    );
  }

  const handleRackClick = (rack: RackVisualization) => {
    setSelectedRack(rack);
    onRackClick?.(rack);
  };

  return (
    <>
      <div className="space-y-6">
        {data.aisles.map((aisle) => (
          <div key={aisle.name} className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-bold text-teal-700 dark:text-teal-300">
                {aisle.name}
              </span>
              Lorong {aisle.name}
            </h3>

            {aisle.rows.map((row) => (
              <div key={row.name} className="space-y-2">
                <h4 className="text-sm font-medium text-slate-500 ml-2">{row.name}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {row.racks.map((rack) => (
                    <RackCard
                      key={rack.id}
                      rack={rack}
                      highlightedMedicine={highlightedMedicine ?? null}
                      onClick={() => handleRackClick(rack)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {data.allLocations.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <iconify-icon icon="solar:archive-bold-duotone" width="64" height="64" style={{ opacity: 0.3 }}></iconify-icon>
            <p className="text-lg font-medium mt-4">Belum ada lokasi rak</p>
            <p className="text-sm mt-1">Mulai dengan memetakan rak pertama Anda di tab &quot;Pemetaan&quot;</p>
          </div>
        )}
      </div>

      {/* Rack Detail Sheet (replaces Dialog) */}
      <Sheet open={!!selectedRack} onOpenChange={() => setSelectedRack(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-lg">
              <iconify-icon
                icon={getCategoryColor(selectedRack?.category ?? null).icon}
                width="22"
                height="22"
              ></iconify-icon>
              {selectedRack?.name}
              {selectedRack?.category && (
                <Badge variant="outline" className="text-xs">{selectedRack.category}</Badge>
              )}
            </SheetTitle>
            <SheetDescription className="flex items-center gap-2 text-sm">
              {selectedRack?.aisleNumber && (
                <span className="flex items-center gap-1">
                  <iconify-icon icon="solar:map-point-bold-duotone" width="14" height="14"></iconify-icon>
                  Lorong {selectedRack.aisleNumber}
                </span>
              )}
              {selectedRack?.rowNumber && (
                <span>• Baris {selectedRack.rowNumber}</span>
              )}
              <span>• {selectedRack?.medicineCount} obat</span>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {selectedRack && <MedicineList rack={selectedRack} />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
