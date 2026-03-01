"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useShelfLocations, useCreateShelfLocation } from "@/lib/hooks/use-medicines";
import type { ShelfLocation } from "@/lib/types";

interface LocationSelectorProps {
  selectedLocation: ShelfLocation | null;
  onSelectLocation: (location: ShelfLocation) => void;
  onNext: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Cardiology: "bg-red-100 text-red-800 border-red-200",
  Antibiotics: "bg-blue-100 text-blue-800 border-blue-200",
  "Pain Management": "bg-green-100 text-green-800 border-green-200",
  Diabetes: "bg-purple-100 text-purple-800 border-purple-200",
  Respiratory: "bg-yellow-100 text-yellow-800 border-yellow-200",
  General: "bg-gray-100 text-gray-800 border-gray-200",
};

export function LocationSelector({
  selectedLocation,
  onSelectLocation,
  onNext,
}: LocationSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCategory, setNewLocationCategory] = useState("");
  const [newLocationAisle, setNewLocationAisle] = useState("");
  const [newLocationRow, setNewLocationRow] = useState("");
  const [newLocationColumns, setNewLocationColumns] = useState("5");
  const [newLocationRows, setNewLocationRows] = useState("1");

  const { data: locations = [], isLoading, error } = useShelfLocations();
  const createMutation = useCreateShelfLocation();

  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) return;

    try {
      const location = await createMutation.mutateAsync({
        name: newLocationName.trim(),
        category: newLocationCategory || null,
        aisleNumber: newLocationAisle || null,
        rowNumber: newLocationRow ? parseInt(newLocationRow, 10) : null,
        columns: parseInt(newLocationColumns, 10) || 5,
        rows: parseInt(newLocationRows, 10) || 1,
      });

      onSelectLocation(location);
      setIsCreateDialogOpen(false);
      setNewLocationName("");
      setNewLocationCategory("");
      setNewLocationAisle("");
      setNewLocationRow("");
      setNewLocationColumns("5");
      setNewLocationRows("1");
    } catch {
      // Error is handled by the mutation
    }
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800 border-gray-200";
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Select Shelf Location</CardTitle>
          <CardDescription>Loading available locations...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Locations</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "Failed to load shelf locations"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Select Shelf Location</CardTitle>
        <CardDescription>
          Choose the shelf or rack you want to map medicines to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {locations.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => onSelectLocation(location)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all duration-200
                min-h-[88px] flex flex-col justify-between
                active:scale-[0.98] touch-manipulation
                ${selectedLocation?.id === location.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-base">{location.name}</span>
                {location.aisleNumber && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    Aisle {location.aisleNumber}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {location.category && (
                  <Badge className={`text-xs ${getCategoryColor(location.category)}`}>
                    {location.category}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {location._count.medicines} items
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Create New Location Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full h-14 text-base">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Shelf Location</DialogTitle>
              <DialogDescription>
                Add a new shelf or rack to organize your medicines
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">
                  Location Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Rack 1, Shelf A"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base">
                  Category
                </Label>
                <Select value={newLocationCategory} onValueChange={setNewLocationCategory}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                    <SelectItem value="Pain Management">Pain Management</SelectItem>
                    <SelectItem value="Diabetes">Diabetes</SelectItem>
                    <SelectItem value="Respiratory">Respiratory</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="aisle" className="text-base">
                    Aisle
                  </Label>
                  <Input
                    id="aisle"
                    placeholder="e.g., A1"
                    value={newLocationAisle}
                    onChange={(e) => setNewLocationAisle(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="row" className="text-base">
                    Row
                  </Label>
                  <Input
                    id="row"
                    type="number"
                    placeholder="e.g., 1"
                    value={newLocationRow}
                    onChange={(e) => setNewLocationRow(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              {/* Rack Dimensions */}
              <div className="space-y-2">
                <Label className="text-base">Rack Dimensions</Label>
                <p className="text-xs text-muted-foreground">
                  Set how many columns (left-right) and rows (top-bottom) this rack has
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="columns" className="text-sm">Columns (Width)</Label>
                    <Input
                      id="columns"
                      type="number"
                      min="1"
                      max="20"
                      placeholder="5"
                      value={newLocationColumns}
                      onChange={(e) => setNewLocationColumns(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rows" className="text-sm">Rows (Height)</Label>
                    <Input
                      id="rows"
                      type="number"
                      min="1"
                      max="10"
                      placeholder="1"
                      value={newLocationRows}
                      onChange={(e) => setNewLocationRows(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                {/* Visual Preview */}
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Preview ({newLocationColumns}x{newLocationRows})</p>
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${parseInt(newLocationColumns) || 1}, 1fr)`,
                    }}
                  >
                    {Array.from({ length: (parseInt(newLocationColumns) || 1) * (parseInt(newLocationRows) || 1) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-6 bg-background border border-dashed border-border rounded-sm"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLocation}
                disabled={!newLocationName.trim() || createMutation.isPending}
                className="h-12"
              >
                {createMutation.isPending ? "Creating..." : "Create Location"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Next Button */}
        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold"
          disabled={!selectedLocation}
          onClick={onNext}
        >
          Continue to Image Capture
          <svg
            className="ml-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Button>
      </CardContent>
    </Card>
  );
}
