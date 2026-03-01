"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useQuickSetup, useQuickSetupSave } from "@/lib/hooks/use-medicines";

interface QuickSetupShelf {
    category: string;
    suggestedName: string;
    columns: number;
    rows: number;
    medicines: Array<{
        name: string;
        dosage: string | null;
        confidence: number;
        positionX?: number;
        positionY?: number;
    }>;
}

type Step = "capture" | "review" | "saving";

export function QuickSetup({ onComplete }: { onComplete?: () => void }) {
    const [step, setStep] = useState<Step>("capture");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [aisleNumber, setAisleNumber] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [detectedShelves, setDetectedShelves] = useState<QuickSetupShelf[]>([]);
    const [removedIndices, setRemovedIndices] = useState<Set<number>>(new Set());
    const [showSuccess, setShowSuccess] = useState(false);
    const [successData, setSuccessData] = useState<{
        locations: number;
        medicines: number;
        details: Array<{ locationName: string; category: string; medicineCount: number }>;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const quickSetupMutation = useQuickSetup();
    const saveMutation = useQuickSetupSave();

    // Camera functions
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
        setIsCameraActive(false);
    };

    const startCamera = async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            });
            setStream(mediaStream);
            setIsCameraActive(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? `Camera access denied: ${err.message}`
                    : "Failed to access camera."
            );
        }
    };

    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(imageDataUrl);
        stopCamera();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === "string") {
                setCapturedImage(result);
            }
        };
        reader.onerror = () => setError("Failed to read image file");
        reader.readAsDataURL(file);
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // AI extraction
    const handleExtract = async () => {
        if (!capturedImage) return;
        setError(null);

        try {
            const result = await quickSetupMutation.mutateAsync({
                imageDataUrl: capturedImage,
                aisleNumber: aisleNumber || undefined,
            });

            setDetectedShelves(result.shelves || []);
            setRemovedIndices(new Set());
            setStep("review");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to analyze image");
        }
    };

    // Save to DB
    const handleSaveAll = async () => {
        if (!capturedImage) return;
        setError(null);
        setStep("saving");

        // Filter out removed shelves
        const shelvesToSave = detectedShelves.filter((_, i) => !removedIndices.has(i));

        try {
            const result = await saveMutation.mutateAsync({
                shelves: shelvesToSave,
                aisleNumber: aisleNumber || undefined,
            });

            if (result.created) {
                setSuccessData(result.created);
            } else {
                setSuccessData({
                    locations: shelvesToSave.length,
                    medicines: shelvesToSave.reduce((sum, s) => sum + s.medicines.length, 0),
                    details: shelvesToSave.map((s) => ({
                        locationName: s.suggestedName,
                        category: s.category,
                        medicineCount: s.medicines.length,
                    })),
                });
            }
            setShowSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
            setStep("review");
        }
    };

    const handleRemoveShelf = (index: number) => {
        setRemovedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        setStep("capture");
        setCapturedImage(null);
        setDetectedShelves([]);
        setAisleNumber("");
        setRemovedIndices(new Set());
        setSuccessData(null);
        onComplete?.();
    };

    const activeShelvesCount = detectedShelves.filter((_, i) => !removedIndices.has(i)).length;
    const activeMedicinesCount = detectedShelves
        .filter((_, i) => !removedIndices.has(i))
        .reduce((sum, s) => sum + s.medicines.length, 0);

    return (
        <>
            <Card className="w-full">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 p-2 shadow-md">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <CardTitle className="text-xl">Quick Setup</CardTitle>
                            <CardDescription>
                                Take one photo, AI creates everything automatically
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* STEP 1: CAPTURE */}
                    {step === "capture" && (
                        <>
                            {/* Aisle Input */}
                            <div className="space-y-2">
                                <Label htmlFor="aisle-quick" className="text-base font-medium">
                                    Aisle Number (optional)
                                </Label>
                                <Input
                                    id="aisle-quick"
                                    placeholder="e.g., 10"
                                    value={aisleNumber}
                                    onChange={(e) => setAisleNumber(e.target.value)}
                                    className="h-12 text-base"
                                />
                            </div>

                            {/* Camera / Preview */}
                            <div className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden">
                                {!capturedImage && !isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                                        <svg className="h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                            />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                        <p className="text-base font-medium">Take a photo of the entire shelf</p>
                                        <p className="text-sm">Include all category labels and medicines</p>
                                    </div>
                                )}

                                {isCameraActive && (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                )}

                                {capturedImage && (
                                    <img src={capturedImage} alt="Captured shelf" className="w-full h-full object-contain" />
                                )}

                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            {/* Processing indicator */}
                            {quickSetupMutation.isPending && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-3 py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                        <div className="text-center">
                                            <span className="text-base font-medium block">Analyzing entire shelf with AI...</span>
                                            <span className="text-sm text-muted-foreground">Detecting categories, medicines, and positions</span>
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {!capturedImage && !isCameraActive && (
                                    <>
                                        <Button size="lg" className="w-full h-14 text-base font-semibold" onClick={startCamera}>
                                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                />
                                            </svg>
                                            Open Camera
                                        </Button>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-card px-2 text-muted-foreground">or</span>
                                            </div>
                                        </div>
                                        <Button size="lg" variant="outline" className="w-full h-14 text-base" onClick={() => fileInputRef.current?.click()}>
                                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            Upload from Gallery
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </>
                                )}

                                {isCameraActive && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button size="lg" variant="outline" className="h-14 text-base" onClick={stopCamera}>
                                            Cancel
                                        </Button>
                                        <Button size="lg" className="h-14 text-base font-semibold" onClick={takePhoto}>
                                            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" />
                                            </svg>
                                            Capture
                                        </Button>
                                    </div>
                                )}

                                {capturedImage && !quickSetupMutation.isPending && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button size="lg" variant="outline" className="h-14 text-base" onClick={retakePhoto}>
                                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                />
                                            </svg>
                                            Retake
                                        </Button>
                                        <Button size="lg" className="h-14 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" onClick={handleExtract}>
                                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Quick Setup
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* STEP 2: REVIEW */}
                    {step === "review" && (
                        <>
                            {/* Summary Bar */}
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div>
                                    <span className="text-sm font-medium">AI detected</span>
                                    <div className="flex gap-2 mt-1">
                                        <Badge className="bg-amber-500 text-white">{activeShelvesCount} categories</Badge>
                                        <Badge className="bg-orange-500 text-white">{activeMedicinesCount} medicines</Badge>
                                    </div>
                                </div>
                                {aisleNumber && (
                                    <Badge variant="outline" className="text-sm">Aisle {aisleNumber}</Badge>
                                )}
                            </div>

                            {/* Image Preview (small) */}
                            {capturedImage && (
                                <div className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden max-h-40">
                                    <img src={capturedImage} alt="Captured shelf" className="w-full h-full object-contain" />
                                </div>
                            )}

                            {/* Detected Shelves */}
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {detectedShelves.map((shelf, index) => {
                                    const isRemoved = removedIndices.has(index);

                                    return (
                                        <div
                                            key={index}
                                            className={`
                        p-4 rounded-lg border-2 transition-all duration-200
                        ${isRemoved
                                                    ? "opacity-40 border-dashed border-slate-300 bg-slate-50"
                                                    : "border-primary/20 bg-card hover:border-primary/40"
                                                }
                      `}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-base">{shelf.category}</span>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {shelf.suggestedName}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {shelf.medicines.length} medicines
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                                            {shelf.columns}×{shelf.rows} grid
                                                        </Badge>
                                                    </div>
                                                    {/* Medicine list preview */}
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {shelf.medicines.slice(0, 5).map((med, mi) => (
                                                            <span
                                                                key={mi}
                                                                className="inline-block px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-md truncate max-w-[150px]"
                                                                title={`${med.name}${med.dosage ? ` (${med.dosage})` : ""}`}
                                                            >
                                                                {med.name}
                                                                {med.dosage && <span className="text-muted-foreground ml-1">{med.dosage}</span>}
                                                            </span>
                                                        ))}
                                                        {shelf.medicines.length > 5 && (
                                                            <span className="inline-block px-2 py-0.5 text-xs text-muted-foreground">
                                                                +{shelf.medicines.length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={isRemoved ? "default" : "ghost"}
                                                    onClick={() => handleRemoveShelf(index)}
                                                    className={`shrink-0 ${isRemoved ? "bg-green-500 hover:bg-green-600" : "text-destructive hover:text-destructive hover:bg-destructive/10"}`}
                                                >
                                                    {isRemoved ? (
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {detectedShelves.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p className="text-base">No categories detected</p>
                                        <p className="text-sm">Try retaking the photo with clearer category labels</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-2">
                                <Button
                                    size="lg"
                                    className="w-full h-14 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                    onClick={handleSaveAll}
                                    disabled={activeShelvesCount === 0}
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save All ({activeShelvesCount} categories, {activeMedicinesCount} medicines)
                                </Button>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    className="w-full h-12 text-base"
                                    onClick={() => {
                                        setStep("capture");
                                        setDetectedShelves([]);
                                        setRemovedIndices(new Set());
                                    }}
                                >
                                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                                    </svg>
                                    Back to Photo
                                </Button>
                            </div>
                        </>
                    )}

                    {/* STEP: SAVING */}
                    {step === "saving" && (
                        <div className="space-y-4 py-8">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                                <div className="text-center">
                                    <p className="text-lg font-medium">Saving to database...</p>
                                    <p className="text-sm text-muted-foreground">Creating shelf locations and mapping medicines</p>
                                </div>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3 mx-auto" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Success Dialog */}
            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="rounded-full bg-green-100 p-1">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            Quick Setup Complete!
                        </DialogTitle>
                        <DialogDescription>
                            Successfully created {successData?.locations} shelf locations with {successData?.medicines} medicines
                        </DialogDescription>
                    </DialogHeader>

                    {successData && (
                        <div className="space-y-3 py-4">
                            {successData.details.map((detail, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <div>
                                        <span className="font-medium text-sm">{detail.category}</span>
                                        <span className="text-xs text-muted-foreground ml-2">({detail.locationName})</span>
                                    </div>
                                    <Badge variant="secondary">{detail.medicineCount} items</Badge>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button onClick={handleSuccessClose} className="w-full h-12">
                        Done — View Racks
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    );
}
