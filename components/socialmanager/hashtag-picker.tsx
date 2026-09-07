"use client";

import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Plus } from "lucide-react";

interface HashtagPickerProps {
  onHashtagSelect: (hashtag: string) => void;
  platformCharLimit?: number | null;
  currentContent?: string;
  children?: React.ReactNode;
  existingTags?: string[];
}

export default function HashtagPicker({
  onHashtagSelect,
  platformCharLimit,
  currentContent = "",
  children,
  existingTags = [],
}: HashtagPickerProps) {
  const [search, setSearch] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allTags = [...new Set(existingTags)];

  const filteredTags = search
    ? allTags.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
    : allTags;

  const suggestedTags = allTags
    .sort((a, b) => {
      return 0;
    })
    .slice(0, 10);

  const remainingChars = platformCharLimit
    ? platformCharLimit - currentContent.length
    : null;

  const handleSelect = (tag: string) => {
    onHashtagSelect(`#${tag}`);
    setSearch("");
    setOpen(false);
  };

  const handleCreateAndSelect = () => {
    const tag = search.replace(/^#/, "").trim();
    if (!tag) return;
    onHashtagSelect(`#${tag}`);
    setSearch("");
    setShowNewTag(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1">
            <Hash className="h-3.5 w-3.5" />
            <span className="text-xs">Hashtags</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="mb-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search or type new tag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowNewTag(e.target.value.length > 0);
            }}
            className="h-8 text-xs"
          />
        </div>

        {search && showNewTag && (
          <button
            onClick={handleCreateAndSelect}
            className="mb-2 flex w-full items-center gap-2 rounded-md bg-indigo-50 px-2 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add "#{search.replace(/^#/, "")}" and insert
          </button>
        )}

        <ScrollArea className="max-h-48">
          <div className="space-y-0.5">
            {(search ? filteredTags : suggestedTags).map((tag) => (
              <button
                key={tag}
                onClick={() => handleSelect(tag)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-100 transition-colors"
              >
                <Hash className="h-3 w-3 text-slate-400 shrink-0" />
                <span>{tag}</span>
                {remainingChars !== null && (
                  <span
                    className={`ml-auto text-[10px] ${
                      remainingChars - tag.length - 1 < 0
                        ? "text-red-600"
                        : "text-slate-400"
                    }`}
                  >
                    -{tag.length + 1} chars
                  </span>
                )}
              </button>
            ))}
            {!search && filteredTags.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-slate-400">
                No hashtags yet. Type to create one.
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
