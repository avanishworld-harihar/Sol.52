"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  filename: string;
  mimeType: string | null;
  downloadUrl: string | null;
  className?: string;
  heightClass?: string;
};

function isImageMime(mime: string | null): boolean {
  return Boolean(mime?.startsWith("image/"));
}

function isPdfMime(mime: string | null, filename: string): boolean {
  if (mime === "application/pdf") return true;
  return filename.toLowerCase().endsWith(".pdf");
}

export function DocumentThumbnail({
  filename,
  mimeType,
  downloadUrl,
  className,
  heightClass = "h-32",
}: Props) {
  const isImage = isImageMime(mimeType);
  const isPdf = isPdfMime(mimeType, filename);

  if (isImage && downloadUrl) {
    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("block overflow-hidden bg-slate-100 dark:bg-white/5", heightClass, className)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={downloadUrl}
          alt={filename}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (isPdf && downloadUrl) {
    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex flex-col items-center justify-center gap-1 bg-red-50 dark:bg-red-950/20",
          heightClass,
          className
        )}
      >
        <FileText className="h-10 w-10 text-red-500 dark:text-red-400" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-300">
          PDF
        </span>
      </a>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-slate-50 dark:bg-white/5",
        heightClass,
        className
      )}
    >
      <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
    </div>
  );
}
