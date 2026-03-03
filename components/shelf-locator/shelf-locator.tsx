"use client";

import { useState, useCallback } from "react";
import { LocationSelector } from "./location-selector";
import { ImageCapture } from "./image-capture";
import { MedicineValidator } from "./medicine-validator";
import type { ShelfLocation, MedicineItemInput, WorkflowStep } from "@/lib/types";

export function ShelfLocator() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("location");
  const [selectedLocation, setSelectedLocation] = useState<ShelfLocation | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedMedicines, setExtractedMedicines] = useState<MedicineItemInput[]>([]);

  const handleSelectLocation = useCallback((location: ShelfLocation) => {
    setSelectedLocation(location);
  }, []);

  const handleLocationNext = useCallback(() => {
    if (selectedLocation) {
      setCurrentStep("validate");
    }
  }, [selectedLocation]);

  const handleCaptureComplete = useCallback((imageDataUrl: string, medicines: MedicineItemInput[]) => {
    setCapturedImage(imageDataUrl);
    setExtractedMedicines(medicines);
    setCurrentStep("validate");
  }, []);

  const handleCaptureBack = useCallback(() => {
    setCurrentStep("location");
    setCapturedImage(null);
    setExtractedMedicines([]);
  }, []);

  const handleSaveComplete = useCallback(() => {
    // Reset everything for a new scan
    setCurrentStep("location");
    setSelectedLocation(null);
    setCapturedImage(null);
    setExtractedMedicines([]);
  }, []);

  const handleValidateBack = useCallback(() => {
    setCurrentStep("capture");
    setExtractedMedicines([]);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Step {currentStep === "location" ? 1 : 2} of 2</span>
          <span className="text-sm font-medium capitalize">{currentStep === "validate" ? "Isi Rak" : currentStep}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{
              width:
                currentStep === "location"
                  ? "50%"
                  : "100%",
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      {currentStep === "location" && (
        <LocationSelector
          selectedLocation={selectedLocation}
          onSelectLocation={handleSelectLocation}
          onNext={handleLocationNext}
        />
      )}

      {currentStep === "validate" && selectedLocation && (
        <MedicineValidator
          selectedLocation={selectedLocation}
          capturedImage={null}
          medicines={[]}
          onSave={handleSaveComplete}
          onBack={() => setCurrentStep("location")}
        />
      )}
    </div>
  );
}
