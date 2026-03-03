"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBatchSaveMedicines } from "@/lib/hooks/use-medicines";
import type { ShelfLocation, MedicineItemInput } from "@/lib/types";

interface MedicineValidatorProps {
  selectedLocation: ShelfLocation;
  capturedImage: string | null;
  medicines: MedicineItemInput[];
  onSave: () => void;
  onBack: () => void;
}

function getConfidenceBadge(confidence: number | null | undefined) {
  if (confidence === null || confidence === undefined) {
    return { label: "Manual", className: "bg-gray-100 text-gray-800" };
  }
  if (confidence >= 0.9) {
    return { label: "High", className: "bg-green-100 text-green-800" };
  }
  if (confidence >= 0.7) {
    return { label: "Medium", className: "bg-yellow-100 text-yellow-800" };
  }
  return { label: "Low", className: "bg-red-100 text-red-800" };
}

export function MedicineValidator({
  selectedLocation,
  capturedImage,
  medicines: initialMedicines,
  onSave,
  onBack,
}: MedicineValidatorProps) {
  const [medicines, setMedicines] = useState<MedicineItemInput[]>(initialMedicines);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", dosage: "" });
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const saveMutation = useBatchSaveMedicines();

  const updateMedicine = useCallback((id: string, updates: Partial<MedicineItemInput>) => {
    setMedicines((prev) =>
      prev.map((med) => (med.id === id ? { ...med, ...updates } : med))
    );
  }, []);

  const removeMedicine = useCallback((id: string) => {
    setMedicines((prev) => prev.filter((med) => med.id !== id));
  }, []);

  const addMedicine = useCallback(() => {
    const newMedicine: MedicineItemInput = {
      id: `new-${Date.now()}`,
      name: "",
      dosage: null,
      extractedFromAI: false,
      _isNew: true,
    };
    setMedicines((prev) => [...prev, newMedicine]);
    // Start editing the new medicine immediately
    setEditingId(newMedicine.id ?? null);
    setEditForm({ name: "", dosage: "" });
  }, []);

  const startEditing = useCallback((medicine: MedicineItemInput) => {
    setEditingId(medicine.id ?? null);
    setEditForm({
      name: medicine.name,
      dosage: medicine.dosage || "",
    });
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId) return;

    if (!editForm.name.trim()) {
      setError("Medicine name is required");
      return;
    }

    updateMedicine(editingId, {
      name: editForm.name.trim(),
      dosage: editForm.dosage.trim() || null,
    });

    setEditingId(null);
    setEditForm({ name: "", dosage: "" });
    setError(null);
  }, [editingId, editForm, updateMedicine]);

  const cancelEdit = useCallback(() => {
    // If it was a new medicine being edited, remove it if cancelled
    const medicine = medicines.find((m) => m.id === editingId);
    if (medicine?._isNew && !medicine.name.trim()) {
      removeMedicine(editingId!);
    }
    setEditingId(null);
    setEditForm({ name: "", dosage: "" });
    setError(null);
  }, [editingId, medicines, removeMedicine]);

  const handleSave = async () => {
    // Filter out empty medicines
    const validMedicines = medicines.filter((med) => med.name.trim().length > 0);

    if (validMedicines.length === 0) {
      setError("Please add at least one medicine before saving");
      return;
    }

    setError(null);

    try {
      await saveMutation.mutateAsync({
        shelfLocationId: selectedLocation.id,
        medicines: validMedicines.map((med) => ({
          name: med.name,
          dosage: med.dosage,
          extractedFromAI: med.extractedFromAI ?? true,
          confidence: med.confidence ?? null,
          positionX: med.positionX ?? null,
          positionY: med.positionY ?? null,
        })),
      });

      setShowSuccessDialog(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save medicines"
      );
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    onSave();
  };

  const aiExtractedCount = medicines.filter((m) => m.extractedFromAI).length;
  const manualCount = medicines.filter((m) => !m.extractedFromAI || m._isNew).length;

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Isi Obat ke Rak</CardTitle>
              <CardDescription>
                Tambahkan daftar obat untuk rak{" "}
                <Badge variant="secondary">{selectedLocation.name}</Badge>
              </CardDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">
                {aiExtractedCount} AI
              </Badge>
              <Badge variant="outline" className="text-xs">
                {manualCount} Manual
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Image Preview */}
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            <img
              src={capturedImage || ""}
              alt="Captured shelf"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Medicine List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Medicines ({medicines.length})
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addMedicine}
                disabled={editingId !== null}
              >
                <svg
                  className="mr-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Medicine
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {medicines.map((medicine) => {
                const confidenceBadge = getConfidenceBadge(medicine.confidence);
                const isEditing = editingId === medicine.id;

                if (isEditing) {
                  return (
                    <div
                      key={medicine.id}
                      className="p-4 border-2 border-primary rounded-lg bg-primary/5 space-y-3"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`edit-name-${medicine.id}`} className="text-sm">
                          Medicine Name *
                        </Label>
                        <Input
                          id={`edit-name-${medicine.id}`}
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          placeholder="Enter medicine name"
                          className="h-12 text-base"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-dosage-${medicine.id}`} className="text-sm">
                          Dosage (optional)
                        </Label>
                        <Input
                          id={`edit-dosage-${medicine.id}`}
                          value={editForm.dosage}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, dosage: e.target.value }))
                          }
                          placeholder="e.g., 500mg, 10ml"
                          className="h-12 text-base"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          className="flex-1 h-11"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveEdit}
                          className="flex-1 h-11"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={medicine.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-base truncate">
                            {medicine.name || (
                              <span className="text-muted-foreground italic">
                                Untitled medicine
                              </span>
                            )}
                          </span>
                          <Badge className={`text-xs ${confidenceBadge.className}`}>
                            {confidenceBadge.label}
                          </Badge>
                        </div>
                        {medicine.dosage && (
                          <span className="text-sm text-muted-foreground mt-1 block">
                            {medicine.dosage}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(medicine)}
                          className="h-10 w-10 p-0"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMedicine(medicine.id ?? "")}
                          className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {medicines.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <svg
                    className="h-12 w-12 mx-auto mb-3 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-base">No medicines found</p>
                  <p className="text-sm">Add medicines manually or retake the photo</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 pt-2">
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold"
            onClick={handleSave}
            disabled={medicines.length === 0 || saveMutation.isPending || editingId !== null}
          >
            {saveMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Confirm & Save ({medicines.length} items)
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full h-12 text-base"
            onClick={onBack}
            disabled={saveMutation.isPending || editingId !== null}
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            Kembali
          </Button>
        </CardFooter>
      </Card >

      {/* Success Dialog */}
      < Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog} >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-1">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              Medicines Saved Successfully!
            </DialogTitle>
            <DialogDescription>
              {saveMutation.data?.created} medicine items have been added to{" "}
              <strong>{saveMutation.data?.shelfLocation?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              The medicine inventory for this shelf location has been updated. You can
              now map another shelf or view the inventory.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleSuccessClose} className="w-full h-12">
              Start New Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </>
  );
}
