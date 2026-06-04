"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  categoryLabel: string;
  accept: string;
  disabled?: boolean;
  uploading?: boolean;
  onFile: (file: File) => void | Promise<void>;
  className?: string;
};

export function HubCategoryUpload({
  categoryLabel,
  accept,
  disabled,
  uploading,
  onFile,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    await onFile(file);
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed p-4 transition-colors",
        dragOver
          ? "border-teal-400 bg-teal-50/50 dark:border-teal-500/50 dark:bg-teal-950/20"
          : "border-slate-200/90 bg-slate-50/40 dark:border-white/10 dark:bg-white/[0.02]",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled && !uploading) void handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Upload to {categoryLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            Tap to choose a file or drag and drop here
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-1.5 shrink-0"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-3.5 w-3.5" aria-hidden />
          )}
          {uploading ? "Uploading…" : "Choose file"}
        </Button>
      </div>
    </div>
  );
}
