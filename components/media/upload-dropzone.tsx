"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode, DragEvent, ChangeEvent, RefObject } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";

export interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  acceptExtensions?: string[];
  maxFiles?: number;
  maxSize?: number;
  rejectExtensions?: string[];
  onRejected?: (rejected: File[]) => void;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  fileInputRef?: RefObject<HTMLInputElement | null>;
}

export function UploadDropzone({
  onFilesSelected,
  accept = "*/*",
  acceptExtensions,
  maxFiles,
  maxSize,
  rejectExtensions,
  onRejected,
  disabled,
  className,
  children,
  fileInputRef,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteReady, setPasteReady] = useState(false);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = fileInputRef ?? internalInputRef;

  const stop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const matchesAccept = useCallback(
    (file: File): boolean => {
      if (!accept || accept === "*/*") return true;

      if (acceptExtensions?.length) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (acceptExtensions.map((e) => e.toLowerCase()).includes(ext))
          return true;
      }

      const types = accept
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      for (const t of types) {
        if (t === "*/*") return true;
        if (file.type === t) return true;
        if (t.endsWith("/*")) {
          const prefix = t.slice(0, -1);
          if (file.type.startsWith(prefix)) return true;
          const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
          const mimeToExt: Record<string, string[]> = {
            "image/": [
              "jpg",
              "jpeg",
              "png",
              "gif",
              "webp",
              "svg",
              "bmp",
              "tiff",
              "avif",
              "heic",
            ],
            "video/": ["mp4", "webm"],
            "audio/": ["mp3", "wav", "ogg", "flac", "m4a", "aac", "wma"],
          };
          if (mimeToExt[prefix]?.includes(ext)) return true;
        }
      }
      return false;
    },
    [accept, acceptExtensions],
  );

  const filterFiles = useCallback(
    (files: File[]): { valid: File[]; rejected: File[] } => {
      const valid: File[] = [];
      const rejected: File[] = [];
      for (const f of Array.from(files)) {
        if (!f || f.size <= 0) {
          rejected.push(f);
          continue;
        }
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (rejectExtensions?.map((e) => e.toLowerCase()).includes(ext)) {
          rejected.push(f);
          continue;
        }
        if (!matchesAccept(f)) {
          rejected.push(f);
          continue;
        }
        if (maxSize && f.size > maxSize) {
          rejected.push(f);
          continue;
        }
        valid.push(f);
      }
      if (maxFiles && valid.length > maxFiles) {
        rejected.push(...valid.splice(maxFiles));
      }
      return { valid, rejected };
    },
    [matchesAccept, maxSize, maxFiles, rejectExtensions],
  );

  const commitFiles = useCallback(
    (files: File[]) => {
      const { valid, rejected } = filterFiles(files);
      if (rejected.length && onRejected) onRejected(rejected);
      if (valid.length) onFilesSelected(valid);
    },
    [filterFiles, onFilesSelected, onRejected],
  );

  const handleDragOver = (e: DragEvent) => {
    stop(e);
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    stop(e);
    if (!disabled) setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    stop(e);
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length)
      commitFiles(Array.from(e.dataTransfer.files));
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;
      const dt = e.clipboardData;
      if (!dt) return;
      const files = Array.from(dt.files);
      if (files.length) {
        setPasteReady(true);
        setTimeout(() => setPasteReady(false), 1200);
        commitFiles(files);
        return;
      }
      const items = Array.from(dt.items);
      const pasted: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) pasted.push(file);
        }
      }
      if (pasted.length) {
        setPasteReady(true);
        setTimeout(() => setPasteReady(false), 1200);
        commitFiles(pasted);
      }
    },
    [disabled, commitFiles],
  );

  useEffect(() => {
    if (disabled) return;
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste, disabled]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) commitFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-center transition-all duration-200",
        isDragOver && !disabled
          ? "border-primary bg-primary/5"
          : "border-gray-300 hover:border-muted-foreground/50 hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
        aria-label="File upload"
      />
      {children}
      {!children && (
        <>
          <UploadCloud
            className={cn(
              "h-16 w-16 text-muted-foreground/50 transition-all",
              isDragOver && !disabled && "h-20 w-20 text-primary",
            )}
          />
          <div className="space-y-1">
            <p className="text-base font-semibold">
              {isDragOver && !disabled
                ? "Drop your files here"
                : "Drag & drop files to upload"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
            {pasteReady && (
              <p className="text-xs text-emerald-600">
                Clipboard content detected — paste supported
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
