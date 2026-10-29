"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  DatabaseBackup,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";

type BackupFormat = "json" | "sql" | "csv-zip";

interface DryRunPlan {
  checksumValid: boolean;
  perTable: { key: string; tableName: string; rows: number }[];
  totalRows: number;
  warnings: string[];
}

interface SelectedFile {
  name: string;
  size: number;
  parsed: Record<string, unknown>;
  version: number;
  exportedAt: string;
  totalRows: number;
  checksum: string;
}

const CONFIRM_PHRASE = "RESTORE";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function BackupClient(): React.JSX.Element {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [downloading, setDownloading] = useState<BackupFormat | null>(null);
  const [lastDownload, setLastDownload] = useState<{
    file: string;
    checksum: string;
    rows: string;
  } | null>(null);
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dryRun, setDryRun] = useState<DryRunPlan | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [confirm, setConfirm] = useState<string>("");
  const [acked, setAcked] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restored, setRestored] = useState<{ rows: number; at: string } | null>(null);

  async function handleDownload(format: BackupFormat): Promise<void> {
    setDownloading(format);
    setRestoreError(null);
    try {
      const res = await fetch(`/api/admin/backup?format=${format}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `Download failed (${res.status}).`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename =
        match?.[1] ?? `im-pos-backup.${format === "csv-zip" ? "zip" : format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setLastDownload({
        file: filename,
        checksum: res.headers.get("X-Backup-Checksum") ?? "—",
        rows: res.headers.get("X-Backup-Rows") ?? "—",
      });
      toast({
        title: "Backup downloaded",
        description: `${filename} — store it somewhere safe (encrypted drive).`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed.";
      toast({ title: "Download failed", description: message, variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  }

  async function handleFile(file: File): Promise<void> {
    setFileError(null);
    setDryRun(null);
    setRestored(null);
    setRestoreError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (parsed["kind"] !== "im-pos-full-backup") {
        throw new Error("Not an IM-POS backup — upload the .json file (not .sql/.zip).");
      }
      if (typeof parsed["version"] !== "number" || parsed["version"] !== 1) {
        throw new Error("Unsupported backup version — expected version 1.");
      }
      if (typeof parsed["checksumSha256"] !== "string") {
        throw new Error("Backup has no checksum — it may be corrupted.");
      }
      setSelected({
        name: file.name,
        size: file.size,
        parsed,
        version: parsed["version"] as number,
        exportedAt: String(parsed["exportedAt"] ?? "unknown"),
        totalRows: Number(parsed["totalRows"] ?? 0),
        checksum: String(parsed["checksumSha256"]),
      });
    } catch (err) {
      setSelected(null);
      setFileError(err instanceof Error ? err.message : "Could not read backup file.");
    }
  }

  async function handleDryRun(): Promise<void> {
    if (!selected) return;
    setChecking(true);
    setRestoreError(null);
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup: selected.parsed, dryRun: true }),
      });
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
        plan?: DryRunPlan;
        warnings?: string[];
      };
      if (!res.ok || !data.success || !data.plan) {
        const detail =
          data.error ??
          (Array.isArray(data.warnings) ? data.warnings.join(" ") : "Dry-run failed.");
        throw new Error(detail);
      }
      setDryRun(data.plan);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : "Dry-run failed.");
    } finally {
      setChecking(false);
    }
  }

  async function handleRestore(): Promise<void> {
    if (!selected || confirm !== CONFIRM_PHRASE || !acked) return;
    setRestoring(true);
    setRestoreError(null);
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backup: selected.parsed,
          dryRun: false,
          confirm: CONFIRM_PHRASE,
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
        warnings?: string[];
        totalInserted?: number;
        restoredAt?: string;
      };
      if (!res.ok || !data.success) {
        const detail =
          data.error ??
          (Array.isArray(data.warnings) ? data.warnings.join(" ") : "Restore failed.");
        throw new Error(detail);
      }
      setRestored({
        rows: data.totalInserted ?? selected.totalRows,
        at: data.restoredAt ?? new Date().toISOString(),
      });
      toast({
        title: "Restore completed",
        description: `${data.totalInserted ?? selected.totalRows} rows restored.`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setRestoring(false);
    }
  }

  const canRestore = selected !== null && confirm === CONFIRM_PHRASE && acked && !restoring;

  return (
    <div className="space-y-6" aria-label="System backup console">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DatabaseBackup className="h-7 w-7" aria-hidden="true" />
          System Backup
        </h1>
        <p className="text-muted-foreground">
          Full-database export and verified restore. Admin only — every download and
          restore is tied to your admin account.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" aria-hidden="true" />
              Download full backup
            </CardTitle>
            <CardDescription>
              24 tables (products, inventory, transactions, staff, customers, cash
              shifts…). Nothing is stored on the server — the file streams straight to
              you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={() => void handleDownload("json")}
              disabled={downloading !== null}
            >
              {downloading === "json" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="mr-2 h-4 w-4" />
              )}
              {downloading === "json" ? "Preparing JSON…" : "Download JSON (for restore)"}
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => void handleDownload("sql")}
              disabled={downloading !== null}
            >
              {downloading === "sql" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              {downloading === "sql" ? "Preparing SQL…" : "Download SQL (psql / audit)"}
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => void handleDownload("csv-zip")}
              disabled={downloading !== null}
            >
              {downloading === "csv-zip" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              {downloading === "csv-zip" ? "Preparing ZIP…" : "Download CSV archive (.zip)"}
            </Button>
            {lastDownload !== null && (
              <div className="rounded-lg border p-3 text-xs space-y-1" role="status">
                <div className="font-medium">{lastDownload.file}</div>
                <div className="text-muted-foreground">Rows: {lastDownload.rows}</div>
                <div className="text-muted-foreground break-all">
                  SHA-256: {lastDownload.checksum}
                </div>
              </div>
            )}
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
              <p>Only the JSON backup can be restored from this console.</p>
              <p>Store downloads encrypted, off this machine. Database PITR in Supabase is separate — this export is your portable copy.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              Restore from backup
            </CardTitle>
            <CardDescription>
              Destructive: replaces ALL current data in one transaction. Restore only
              during a maintenance window, after downloading a fresh backup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-file">Backup JSON file</Label>
              <Input
                id="backup-file"
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              {fileError !== null && (
                <p className="text-sm text-destructive" role="alert">{fileError}</p>
              )}
              {selected !== null && (
                <div className="rounded-lg border p-3 text-xs space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">v{selected.version}</Badge>
                    <span className="font-medium">{selected.name}</span>
                    <span className="text-muted-foreground">{formatBytes(selected.size)}</span>
                  </div>
                  <div className="text-muted-foreground">Exported: {selected.exportedAt}</div>
                  <div className="text-muted-foreground">Rows: {selected.totalRows}</div>
                  <div className="text-muted-foreground break-all">SHA-256: {selected.checksum}</div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => void handleDryRun()}
              disabled={selected === null || checking}
            >
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {checking ? "Validating…" : "1) Validate (dry-run, safe)"}
            </Button>

            {dryRun !== null && (
              <div className="rounded-lg border p-3 text-xs space-y-2" role="status">
                <div className="flex items-center gap-2">
                  <Badge variant={dryRun.checksumValid ? "default" : "destructive"}>
                    {dryRun.checksumValid ? "checksum OK" : "checksum FAILED"}
                  </Badge>
                  <span>{dryRun.totalRows} rows / {dryRun.perTable.length} tables</span>
                </div>
                <div className="max-h-40 overflow-auto space-y-0.5">
                  {dryRun.perTable.map((t) => (
                    <div key={t.key} className="flex justify-between gap-2">
                      <span className="text-muted-foreground">{t.key}</span>
                      <span>{t.rows}</span>
                    </div>
                  ))}
                </div>
                {dryRun.warnings.length > 0 && (
                  <ul className="space-y-1 text-amber-700">
                    {dryRun.warnings.map((w, i) => (
                      <li key={i} className="flex gap-1.5">
                        <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="restore-confirm">
                Type <span className="font-mono font-bold">{CONFIRM_PHRASE}</span> to confirm
              </Label>
              <Input
                id="restore-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value.trim())}
                placeholder={CONFIRM_PHRASE}
                autoComplete="off"
              />
              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={acked}
                  onChange={(e) => setAcked(e.target.checked)}
                />
                <span>I downloaded a fresh backup of the current data, I am in a maintenance window, and I understand this replaces all data.</span>
              </label>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={() => void handleRestore()}
              disabled={!canRestore}
            >
              {restoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {restoring ? "Restoring…" : "2) Restore now (destructive)"}
            </Button>

            {restoreError !== null && (
              <p className="text-sm text-destructive" role="alert">{restoreError}</p>
            )}
            {restored !== null && (
              <p className="text-sm text-green-700" role="status">
                Restored {restored.rows} rows at {restored.at}. Verify POS, inventory and reports before reopening.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
