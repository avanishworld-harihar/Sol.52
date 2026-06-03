"use client";

import { useCallback, useRef, useState } from "react";
import { FilePlus, FileText, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-center";
import { cn } from "@/lib/utils";

type UploadType = "bill" | "site_image" | "document";

const SLOTS: { type: UploadType; label: string; icon: typeof FileText; accept: string }[] = [
  { type: "bill", label: "Bill", icon: FileText, accept: "image/*,application/pdf,.pdf" },
  { type: "site_image", label: "Site image", icon: ImageIcon, accept: "image/*" },
  { type: "document", label: "Document", icon: FilePlus, accept: "image/*,application/pdf,.pdf,.doc,.docx" },
];

export function CustomerDocumentsHubUpload({
  customerId,
  onUploaded,
}: {
  customerId: string;
  onUploaded?: () => void;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState<UploadType | null>(null);
  const inputRefs = {
    bill: useRef<HTMLInputElement>(null),
    site_image: useRef<HTMLInputElement>(null),
    document: useRef<HTMLInputElement>(null),
  };

  const upload = useCallback(
    async (file: File, fileType: UploadType) => {
      setUploading(fileType);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("file_type", fileType);
        const res = await fetch(`/api/customers/${customerId}/files/upload`, {
          method: "POST",
          body: form,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "Upload failed");
        }
        toast.success("Uploaded", file.name);
        onUploaded?.();
      } catch (e) {
        toast.error(
          "Upload failed",
          e instanceof Error ? e.message : "Try again"
        );
      } finally {
        setUploading(null);
      }
    },
    [customerId, onUploaded, toast]
  );

  return (
    <div className="rounded-xl border border-dashed border-teal-200/80 bg-teal-50/30 p-3 dark:border-teal-500/30 dark:bg-teal-950/20">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-200">
        <Upload className="h-3.5 w-3.5" aria-hidden />
        Upload (v2)
      </p>
      <div className="flex flex-wrap gap-2">
        {SLOTS.map(({ type, label, icon: Icon, accept }) => (
          <div key={type}>
            <input
              ref={inputRefs[type]}
              type="file"
              accept={accept}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void upload(f, type);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("gap-1.5 text-xs", uploading === type && "opacity-70")}
              disabled={uploading != null}
              onClick={() => inputRefs[type].current?.click()}
            >
              {uploading === type ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Icon className="h-3.5 w-3.5" aria-hidden />
              )}
              {label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
