"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

export default function MediaSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("text") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("text", query);
    } else {
      params.delete("text");
    }
    router.push(`/dashboard/media/search?${params.toString()}`);
  };

  const clearSearch = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("text");
    router.push(`/dashboard/media/search?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Advanced Search</h1>
        <p className="text-sm text-muted-foreground">Search and filter your media assets with precision.</p>
      </div>

      <Card className="rounded-xl p-4 space-y-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by filename, description, tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button type="submit" size="sm">Search</Button>
            {query && (
              <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="text-sm text-muted-foreground">
        Enter a search term above to find assets.
      </div>
    </div>
  );
}
