"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAISearch } from "@/lib/hooks/use-medicines";
import type { MedicineSearchResult } from "@/lib/hooks/use-medicines";

// ============================================
// Props & Types
// ============================================

interface MedicineSearchProps {
  onResultClick?: (medicine: MedicineSearchResult) => void;
}

// ============================================
// Sub-Components
// ============================================

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </div>
  );
}

function MedicineResultCard({
  medicine,
  onClick,
  isHighlighted,
}: {
  medicine: MedicineSearchResult;
  onClick: () => void;
  isHighlighted: boolean;
}) {
  const confidencePercent = Math.round(medicine.confidence * 100);

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all duration-200
        ${isHighlighted
          ? "border-primary bg-primary/5 shadow-md"
          : "border-slate-200 bg-white hover:border-primary/30 hover:shadow-sm"}
        active:scale-[0.98]
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-lg text-slate-900 truncate">
            {medicine.name}
          </h4>
          {medicine.dosage && (
            <p className="text-slate-500 text-sm mt-0.5">{medicine.dosage}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              📍 {medicine.shelfLocation.name}
            </Badge>
            {medicine.shelfLocation.category && (
              <Badge variant="outline" className="text-xs">
                {medicine.shelfLocation.category}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {medicine.shelfLocation.aisleNumber && (
            <span className="text-xs text-slate-400">
              Aisle {medicine.shelfLocation.aisleNumber}
            </span>
          )}
          {medicine.shelfLocation.rowNumber && (
            <span className="text-xs text-slate-400">
              Row {medicine.shelfLocation.rowNumber}
            </span>
          )}
          <div
            className={`text-xs font-medium ${confidencePercent >= 90
                ? "text-green-600"
                : confidencePercent >= 70
                  ? "text-yellow-600"
                  : "text-slate-400"
              }`}
          >
            {confidencePercent}% match
          </div>
        </div>
      </div>

      {/* Location Guide - the killer feature */}
      {medicine.locationGuide && (
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800 leading-relaxed">
            {medicine.locationGuide}
          </p>
        </div>
      )}
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export function MedicineSearch({ onResultClick }: MedicineSearchProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useAISearch();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setHasSearched(true);
    setAiSuggestion(null);

    try {
      const result = await searchMutation.mutateAsync(query);

      if (result.success) {
        setSearchResults(result.medicines);

        if (result.aiInterpretation?.alternativeNames?.length) {
          setAiSuggestion(
            `Did you mean: ${result.aiInterpretation.alternativeNames.slice(0, 3).join(", ")}?`
          );
        }
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    }
  }, [query, searchMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleResultClick = (medicine: MedicineSearchResult) => {
    onResultClick?.(medicine);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <span>🔍</span>
          AI Medicine Search
        </CardTitle>
        <CardDescription>
          Cari obat by name — AI akan bantu kasih panduan lokasi dimana obatnya berada di rak
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ketik nama obat... (e.g., 'para', 'amox', 'obat flu')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 text-base"
          />
          <Button
            size="lg"
            onClick={handleSearch}
            disabled={!query.trim() || searchMutation.isPending}
            className="h-12 px-6"
          >
            {searchMutation.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              "Search"
            )}
          </Button>
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-700 text-sm">
              💡 {aiSuggestion}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {searchMutation.isPending && <SearchSkeleton />}

        {/* Results */}
        {!searchMutation.isPending && hasSearched && (
          <div className="space-y-3">
            {searchResults.length > 0 ? (
              <>
                <p className="text-sm text-slate-500">
                  Found {searchResults.length} medicine(s)
                </p>
                <div className="space-y-2">
                  {searchResults.map((medicine) => (
                    <MedicineResultCard
                      key={medicine.id}
                      medicine={medicine}
                      onClick={() => handleResultClick(medicine)}
                      isHighlighted={medicine.confidence >= 0.9}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-medium">No medicines found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="text-center py-8 text-slate-400">
            <svg
              className="h-12 w-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p>Start typing to search for medicines</p>
            <p className="text-sm mt-1">AI akan kasih panduan lokasi obat di rak 🗺️</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
