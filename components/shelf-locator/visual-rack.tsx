"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useVisualization, useUpdateMedicinePosition, useUpdateMedicine, useDeleteMedicine, useCreateMedicine, useUpdateShelfLayout, type RackVisualization, type MedicineInRack } from "@/lib/hooks/use-medicines";
import { useCategories } from "@/lib/hooks/use-categories";
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VisualRackProps {
  highlightedMedicine?: string | null;
  onRackClick?: (rackId: string) => void;
}

function DraggableMedicine({ medicine }: { medicine: MedicineInRack }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: medicine.id,
    data: medicine,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-2 sm:p-3 rounded-lg border text-[10px] sm:text-xs flex flex-col justify-center items-center text-center transition-all cursor-grab active:cursor-grabbing
        bg-white dark:bg-slate-700 border-teal-100 dark:border-teal-800 shadow-sm hover:shadow-md
        ${isDragging ? "opacity-30 z-50 ring-2 ring-teal-500 ring-offset-2" : ""}
      `}
    >
      <div className="font-semibold text-slate-700 dark:text-slate-200 w-full leading-tight text-center break-words" title={medicine.name}>
        {medicine.name}
      </div>
      {medicine.dosage && (
        <div className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5 leading-tight text-center break-words">{medicine.dosage}</div>
      )}
      {medicine.quantity !== null && (
        <Badge variant="secondary" className="mt-1.5 text-[8px] px-1 py-0 h-3.5 bg-teal-50 text-teal-700">
          Qty: {medicine.quantity}
        </Badge>
      )}
    </div>
  );
}

function GridCell({ x, y, children }: { x: number; y: number; children?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${x}-${y}`,
    data: { x, y },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative min-h-[90px] rounded-lg transition-all duration-200 flex flex-col gap-1 p-1
        ${children ? "" : "border-dashed border-slate-200 dark:border-slate-700 border"}
        ${isOver ? "bg-teal-50/50 border-teal-300 scale-[1.02] shadow-sm z-10" : "bg-transparent"}
      `}
    >
      {children || (
        <div className="absolute inset-0 flex items-center justify-center opacity-30 text-[9px] pointer-events-none uppercase tracking-tighter">
          Slot {x},{y}
        </div>
      )}
    </div>
  );
}

function MedicineList({ rack }: { rack: RackVisualization }) {
  const { medicines, columns, rows, id: shelfLocationId } = rack;
  const updateLayout = useUpdateShelfLayout();
  // ... other hooks (keep existing ones)
  const deleteMedicine = useDeleteMedicine();
  const updateMedicine = useUpdateMedicine();
  const createMedicine = useCreateMedicine();
  const { data: categories } = useCategories();

  // Local state for realtime feedback
  const [localMedicines, setLocalMedicines] = useState<MedicineInRack[]>(medicines);
  const [localColumns, setLocalColumns] = useState<number>(columns);
  const [localRows, setLocalRows] = useState<number>(rows);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Sync with props when rack changes (e.g. after a save or layout refresh)
  useEffect(() => {
    setLocalMedicines(medicines);
    setLocalColumns(columns);
    setLocalRows(rows);
  }, [medicines, columns, rows]);

  const [editingMedicine, setEditingMedicine] = useState<MedicineInRack | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMedicineForm, setNewMedicineForm] = useState({ name: "", dosage: "", quantity: "0", categoryId: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const medId = active.id;
    const { x, y } = over.data.current;

    setLocalMedicines(prev => prev.map(m =>
      m.id === medId ? { ...m, positionX: x, positionY: y } : m
    ));
  };

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id as string);
  };

  const openEdit = (med: MedicineInRack) => {
    setEditingMedicine(med);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (medId: string) => {
    if (confirm("Hapus obat ini dari inventaris?")) {
      toast.promise(
        deleteMedicine.mutateAsync(medId),
        {
          loading: "Menghapus obat...",
          success: () => {
            setIsEditDialogOpen(false);
            return "Obat berhasil dihapus";
          },
          error: "Gagal menghapus obat"
        }
      );
    }
  };

  const handleAddSubmit = async () => {
    if (!newMedicineForm.name.trim()) return;
    toast.promise(
      createMedicine.mutateAsync({
        shelfLocationId,
        name: newMedicineForm.name,
        dosage: newMedicineForm.dosage || null,
        quantity: parseInt(newMedicineForm.quantity) || 0,
        categoryId: newMedicineForm.categoryId || null
      }),
      {
        loading: "Menambah obat...",
        success: () => {
          setIsAddDialogOpen(false);
          setNewMedicineForm({ name: "", dosage: "", quantity: "0", categoryId: "" });
          return "Obat berhasil ditambahkan";
        },
        error: "Gagal menambah obat"
      }
    );
  };

  const handleSaveLayout = async () => {
    toast.promise(
      updateLayout.mutateAsync({
        id: shelfLocationId,
        columns: localColumns,
        rows: localRows,
        medicines: localMedicines.map(m => ({
          id: m.id,
          positionX: m.positionX,
          positionY: m.positionY
        }))
      }),
      {
        loading: "Sedang menyimpan tata letak...",
        success: "Layout berhasil disimpan",
        error: (err) => `Gagal menyimpan layout: ${err.message}`
      }
    );
  };

  const handleReset = () => {
    setLocalMedicines(medicines);
    setLocalColumns(columns);
    setLocalRows(rows);
  };

  const hasChanges = useMemo(() => {
    if (localColumns !== columns || localRows !== rows) return true;
    if (localMedicines.length !== medicines.length) return false;

    return localMedicines.some(lm => {
      const orig = medicines.find(m => m.id === lm.id);
      return !orig || orig.positionX !== lm.positionX || orig.positionY !== lm.positionY;
    });
  }, [localMedicines, localColumns, localRows, medicines, columns, rows]);

  const gridCells = useMemo(() => {
    return Array.from({ length: localRows * localColumns }).map((_, index) => {
      const x = index % localColumns;
      const y = Math.floor(index / localColumns);
      const items = localMedicines.filter(m => m.positionX === x && m.positionY === y);
      return { x, y, items };
    });
  }, [localMedicines, localColumns, localRows]);

  const unmappedMedicines = useMemo(() => {
    return localMedicines.filter(m =>
      m.positionX === null ||
      m.positionY === null ||
      m.positionX >= localColumns ||
      m.positionY >= localRows
    );
  }, [localMedicines, localColumns, localRows]);

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        collisionDetection={closestCenter}
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-teal-50/50 dark:bg-slate-800/50 rounded-2xl border border-teal-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-teal-600 dark:text-teal-400 font-bold">Kolom</Label>
                <Input
                  type="number"
                  className="w-16 h-8 text-xs bg-white dark:bg-slate-900 border-teal-100"
                  value={localColumns}
                  onChange={(e) => setLocalColumns(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-teal-600 dark:text-teal-400 font-bold">Baris</Label>
                <Input
                  type="number"
                  className="w-16 h-8 text-xs bg-white dark:bg-slate-900 border-teal-100"
                  value={localRows}
                  onChange={(e) => setLocalRows(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="text-[10px] sm:text-xs text-teal-600/60 font-medium self-end pb-1.5 uppercase tracking-wider">
                {localColumns}×{localRows} Grid
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsAddDialogOpen(true)} className="h-8 text-xs bg-white">
                <iconify-icon icon="solar:add-circle-bold" width="14" height="14" className="mr-1.5"></iconify-icon>
                Tambah Obat
              </Button>
              {hasChanges && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                  <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 text-xs text-slate-500 hover:text-red-500">
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleSaveLayout} className="h-8 text-xs bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20">
                    <iconify-icon icon="solar:diskette-bold" width="14" height="14" className="mr-1.5"></iconify-icon>
                    Simpan Perubahan
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div
            className="grid gap-2 p-3 sm:p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 overflow-x-auto shadow-inner min-h-[400px]"
            style={{
              gridTemplateColumns: `repeat(${localColumns}, minmax(130px, 1fr))`,
              gridTemplateRows: `repeat(${localRows}, minmax(100px, auto))`
            }}
          >
            {gridCells.map((cell) => (
              <GridCell key={`cell-${cell.x}-${cell.y}`} x={cell.x} y={cell.y}>
                {cell.items.map((med) => (
                  <div key={med.id} onClick={(e) => { e.stopPropagation(); openEdit(med); }}>
                    <DraggableMedicine medicine={med} />
                  </div>
                ))}
              </GridCell>
            ))}
          </div>
        </div>

        {/* List items with no position */}
        {unmappedMedicines.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[10px] sm:text-xs text-slate-500 mb-3 font-medium flex items-center gap-1.5 uppercase tracking-wider">
              <iconify-icon icon="solar:list-bold-duotone" width="14" height="14"></iconify-icon>
              Item Belum Dipetakan ({unmappedMedicines.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {unmappedMedicines.map((med) => (
                <div key={med.id} onClick={() => openEdit(med)}>
                  <DraggableMedicine medicine={med} />
                </div>
              ))}
            </div>
          </div>
        )}

        <DragOverlay zIndex={100}>
          {activeDragId ? (
            <div className="opacity-80 scale-105 pointer-events-none">
              <DraggableMedicine medicine={localMedicines.find(m => m.id === activeDragId)!} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Obat</DialogTitle>
            <DialogDescription>Perbarui detail informasi obat ini</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Obat</Label>
              <Input
                value={editingMedicine?.name || ""}
                onChange={(e) => setEditingMedicine(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dosis</Label>
                <Input
                  value={editingMedicine?.dosage || ""}
                  onChange={(e) => setEditingMedicine(prev => prev ? { ...prev, dosage: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah (Qty)</Label>
                <Input
                  type="number"
                  value={editingMedicine?.quantity || 0}
                  onChange={(e) => setEditingMedicine(prev => prev ? { ...prev, quantity: parseInt(e.target.value) } : null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2">
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => editingMedicine && handleDelete(editingMedicine.id)}>
              Hapus
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
            <Button className="bg-teal-600" onClick={async () => {
              if (editingMedicine) {
                await updateMedicine.mutateAsync({
                  id: editingMedicine.id,
                  name: editingMedicine.name,
                  dosage: editingMedicine.dosage,
                  quantity: editingMedicine.quantity || 0
                });
                setIsEditDialogOpen(false);
              }
            }}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medicine Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Obat Baru</DialogTitle>
            <DialogDescription>Masukkan obat baru ke rak {rack.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Obat *</Label>
              <Input
                placeholder="mis. Paracetamol"
                value={newMedicineForm.name}
                onChange={(e) => setNewMedicineForm({ ...newMedicineForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dosis</Label>
                <Input
                  placeholder="mis. 500mg"
                  value={newMedicineForm.dosage}
                  onChange={(e) => setNewMedicineForm({ ...newMedicineForm, dosage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  value={newMedicineForm.quantity}
                  onChange={(e) => setNewMedicineForm({ ...newMedicineForm, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategori (Opsional)</Label>
              <Select
                value={newMedicineForm.categoryId}
                onValueChange={(val) => setNewMedicineForm({ ...newMedicineForm, categoryId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
            <Button className="bg-teal-600" onClick={handleAddSubmit}>Tambah Obat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function VisualRack({ highlightedMedicine, onRackClick }: VisualRackProps) {
  const [selectedRack, setSelectedRack] = useState<RackVisualization | null>(null);
  const { data, isLoading, error } = useVisualization();

  const allRacks = useMemo(() => data?.allLocations || [], [data]);

  // Identify which rack has the highlighted medicine
  const rackWithHighlightedMed = useMemo(() => {
    if (!highlightedMedicine || allRacks.length === 0) return null;
    return allRacks.find(rack =>
      rack.medicines.some(m => m.name.toLowerCase().includes(highlightedMedicine.toLowerCase()))
    )?.id;
  }, [allRacks, highlightedMedicine]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Gagal memuat data visualisasi: {error instanceof Error ? error.message : "Error tidak diketahui"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRacks.map((rack) => (
          <RackCard
            key={rack.id}
            rack={rack}
            isMedicineHighlighted={rackWithHighlightedMed === rack.id}
            onClick={(r) => {
              setSelectedRack(r);
              if (onRackClick) onRackClick(r.id);
            }}
          />
        ))}

        {allRacks.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <iconify-icon icon="solar:box-minimalistic-bold-duotone" width="48" height="48" className="opacity-30 mb-2"></iconify-icon>
            <p>Belum ada rak yang terdaftar</p>
          </div>
        )}
      </div>

      <Sheet open={!!selectedRack} onOpenChange={(open) => !open && setSelectedRack(null)}>
        <SheetContent side="right" className="w-[95%] sm:max-w-xl overflow-y-auto">
          {selectedRack && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-xl text-teal-600">
                    <iconify-icon icon="solar:widget-6-bold-duotone" width="24" height="24"></iconify-icon>
                  </div>
                  <div>
                    <SheetTitle className="text-xl sm:text-2xl font-bold">{selectedRack.name}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      {selectedRack.category && (
                        <Badge variant="outline" className="bg-teal-50/50 text-teal-700 border-teal-100">
                          {selectedRack.category}
                        </Badge>
                      )}
                      <span>Aisle {selectedRack.aisleNumber || "-"}</span>
                      <span>Row {selectedRack.rowNumber || "-"}</span>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <MedicineList rack={selectedRack} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RackCard({
  rack,
  isMedicineHighlighted,
  onClick
}: {
  rack: RackVisualization;
  isMedicineHighlighted: boolean;
  onClick: (rack: RackVisualization) => void;
}) {
  const hasMedicines = rack.medicineCount > 0;

  return (
    <button
      onClick={() => onClick(rack)}
      className={`
        relative group w-full text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${isMedicineHighlighted
          ? "border-teal-500 ring-4 ring-teal-500/10 shadow-xl scale-[1.02]"
          : "border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg"
        }
        bg-white dark:bg-slate-900
      `}
    >
      {/* Rack Header/Status */}
      <div className={`h-2 w-full ${hasMedicines ? "bg-teal-500" : "bg-slate-200"}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {rack.name}
              {rack.category && (
                <Badge variant="outline" className="text-[10px] sm:text-xs font-medium border-slate-200 text-slate-500 uppercase tracking-wider h-5">
                  {rack.category}
                </Badge>
              )}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs sm:text-sm">
              {rack.aisleNumber && (
                <span className="flex items-center gap-1">
                  <iconify-icon icon="solar:globus-outline" width="14" height="14"></iconify-icon>
                  Aisle {rack.aisleNumber}
                </span>
              )}
              {rack.rowNumber && (
                <span className="flex items-center gap-1">
                  <iconify-icon icon="solar:layers-minimalistic-outline" width="14" height="14"></iconify-icon>
                  Baris {rack.rowNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Medicine Preview */}
        {hasMedicines ? (
          <div className="flex flex-wrap gap-1.5 min-h-12 mt-4">
            {rack.medicines.slice(0, 3).map((med) => {
              return (
                <div
                  key={med.id}
                  className={`
                    text-[10px] sm:text-xs px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-colors
                    ${isMedicineHighlighted ? "font-bold text-teal-700 bg-teal-50 border-teal-200" : "text-slate-600"}
                  `}
                >
                  {med.name}
                </div>
              );
            })}
            {rack.medicineCount > 3 && (
              <div className="text-[10px] sm:text-xs text-slate-400 px-1 py-1 italic">
                +{rack.medicineCount - 3} lainnya...
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-12 text-slate-400 text-sm gap-1.5 opacity-50">
            <iconify-icon icon="solar:box-bold-duotone" width="16" height="16"></iconify-icon>
            Rak kosong
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2">
        <Badge className={`h-6 min-w-6 rounded-full text-[10px] font-bold ${hasMedicines ? "bg-teal-600" : "bg-slate-200"}`}>
          {rack.medicineCount}
        </Badge>
      </div>
    </button>
  );
}
