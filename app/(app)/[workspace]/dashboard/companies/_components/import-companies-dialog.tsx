"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "@/lib/icons";
import type { CompanyImportResult } from "@/lib/api";
import { useToast } from "@/lib/context";
import {
  getCompanyImportStatusAction,
  importCompaniesAction,
} from "@/app/(app)/[workspace]/dashboard/companies/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { nanoid: string; name: string; domain: string };
}

const POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 2000;

export function ImportCompaniesDialog({ open, onOpenChange, workspace }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyImportResult | null>(null);

  const handleDownload = () => {
    window.open(
      `/api/crm/companies/import_template?workspace=${encodeURIComponent(workspace.domain)}`,
      "_blank",
    );
  };

  const reset = () => {
    setFile(null);
    setStatus(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.push({ variant: "error", message: "Choose an .xlsx file first." });
      return;
    }
    setSubmitting(true);
    setStatus("PENDING");
    setResult(null);

    const formData = new FormData();
    formData.set("file", file);
    const upload = await importCompaniesAction(workspace.domain, formData);
    if ("error" in upload) {
      setSubmitting(false);
      setStatus("FAILURE");
      toast.push({ variant: "error", message: upload.error });
      return;
    }

    const taskId = upload.task_id;
    let settled = false;
    let importResult: CompanyImportResult | null = null;
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
      try {
        const payload = await getCompanyImportStatusAction(taskId, workspace.domain);
        setStatus(payload.status);
        if (payload.result) {
          importResult = payload.result;
          setResult(payload.result);
        }
        if (
          payload.status === "SUCCESS" ||
          payload.status === "FAILURE" ||
          payload.status === "REVOKED"
        ) {
          settled = true;
          break;
        }
      } catch {
        /* transient poll failure — retry */
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    setSubmitting(false);
    router.refresh();
    if (settled && status !== "FAILURE") {
      // status may be stale; rely on result
    }
    if (importResult) {
      const r = importResult;
      if (r) {
        toast.push({
          variant: "success",
          message: `Imported: ${r.created} created, ${r.updated} updated, ${r.skipped} skipped.`,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            <Upload className="mr-2 inline-block size-4" />
            Import Companies
          </DialogTitle>
          <DialogDescription>
            Upload an .xlsx file. Rows are matched by name + domain within{" "}
            {workspace.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div>
            <Button type="button" variant="outline" onClick={handleDownload}>
              <Download className="mr-1.5 size-4" />
              Download template
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-file">Excel file (.xlsx)</Label>
            <Input
              id="import-file"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={submitting}
            />
          </div>

          {status && (
            <p className="text-sm text-muted-foreground">Status: {status}</p>
          )}

          {result && (
            <div className="rounded-md border p-3 text-sm">
              <p>
                Created {result.created}, updated {result.updated}, skipped{" "}
                {result.skipped}.
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-40 list-disc overflow-auto pl-5 text-xs text-destructive">
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.row}: {e.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Close
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting || !file}>
            {submitting ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
