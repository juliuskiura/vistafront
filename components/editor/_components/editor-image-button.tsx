"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Image } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Inserts an image from a URL into the editor.
 *
 * Uses a popover rather than `window.prompt` so the control matches the rest
 * of the toolbar and stays usable in embedded contexts.
 */
export function ImageButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function handleOpenChange(next: boolean) {
    if (next) {
      const src = editor.getAttributes("image").src as string | undefined;
      setUrl(src ?? "");
    } else {
      setUrl("");
    }
    setOpen(next);
  }

  function apply() {
    const value = url.trim();
    if (value) {
      if (editor.isActive("image")) {
        editor.chain().focus().updateAttributes("image", { src: value }).run();
      } else {
        editor.chain().focus().setImage({ src: value }).run();
      }
    }
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Image"
          aria-pressed={editor.isActive("image")}
          title="Image"
          className={cn(
            "inline-flex size-7 shrink-0 items-center justify-center rounded transition-colors",
            editor.isActive("image")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Image size={15} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <div className="text-xs font-medium text-foreground">Image URL</div>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/image.png"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply}>
            Insert
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
