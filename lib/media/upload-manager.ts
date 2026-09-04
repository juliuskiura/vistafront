/**
 * Browser-managed, resumable upload manager for the media library.
 *
 * Upload flow (multipart relay through Django → OCI/S3 multipart):
 *
 *   1. POST /apis/media/assets/uploads/initiate/  → session nanoid
 *   2. Slice the file into >=5 MiB parts; POST each part (raw octet-stream)
 *      to /apis/media/assets/uploads/{session}/part/?part_number=N with
 *      granular XHR progress; run up to CONCURRENCY parts in parallel.
 *   3. POST /apis/media/assets/uploads/{session}/complete/ with the collected
 *      [{part_number, etag}] list → Asset
 *
 * Every upload's state is persisted to IndexedDB so a full page reload does not
 * kill an in-flight upload: the manager resumes from where it left off by asking
 * the backend which parts are already present and uploading only the rest.
 *
 * All multipart requests go directly from the browser to Django. This keeps
 * the JSON session calls and raw part uploads on the same client-side path.
 *
 * The raw part POST uses XMLHttpRequest (fetch cannot report upload progress)
 * and carries the same cookie + X-Workspace + CSRF headers.
 */
import type { VideoProbeResult } from "./video-probe";

const DB_NAME = "media_libary_uploads";
const STORE = "uploads";
const DB_VERSION = 5;

// Multipart transport tuning (mirrors the nested uploader engine).
const CONCURRENCY = 3; // parallel parts in flight
const MAX_ATTEMPTS = 5; // automatic retries per part
const BASE_BACKOFF_MS = 800; // exponential backoff base
const MAX_BACKOFF_MS = 10_000;
const MIN_PART_SIZE = 5 * 1024 * 1024; // OCI minimum part size
const DEFAULT_PART_SIZE = 5 * 1024 * 1024;
const NOTIFY_THROTTLE_MS = 120; // min interval between UI progress flushes
const DJANGO_API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

/** One slice of the file being uploaded via the relay endpoint. */
export interface UploadPart {
  part_number: number;
  size: number;
  loaded: number;
  status: "pending" | "uploading" | "retrying" | "done" | "failed";
  attempts: number;
  etag?: string;
}

export interface PersistedUpload {
  id: string;
  file: File;
  filename: string;
  size: number;
  mimeType: string;
  workspace: string;
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled";
  error?: string;
  createdAt: number;
  /** Multipart session id returned by initiate; the resume key on reload. */
  sessionId?: string;
  /** Bytes per part (>=5 MiB), from the server config. */
  partSize?: number;
  /** Total number of parts the file was split into. Stored so that on resume
   * (when the File object is available but we may not reach the backend)
   * we can still compute the correct part boundaries. */
  doneParts?: Array<{ part_number: number; etag: string }>;
  /** Total number of parts the file was split into. */
  totalParts?: number;
  /** Upload progress 0-100 (in-memory only, not persisted to IndexedDB). */
  progress?: number;
  /** Live per-segment states for the segment-bar UI (in-memory only). */
  parts?: UploadPart[];
  /** Current transfer speed in bytes/sec (in-memory sliding window). */
  speedBps?: number;
}

export interface UploadItem {
  id: string;
  file: File;
  filename: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled";
  error?: string;
  segments?: UploadPart[];
  speedBps?: number;
}

type Listener = () => void;

// ----------------------------------------------------------------- IndexedDB

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      } else {
        const tx = req.transaction!;
        const store = tx.objectStore(STORE);
        store.clear();
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = idbOpen();
  return dbPromise;
}

function apiUrl(path: string): string {
  return `${DJANGO_API_BASE.replace(/\/$/, "")}${path}`;
}

async function browserApi<T>(
  path: string,
  workspace: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
    "X-Workspace": workspace,
  };
  const csrfToken = getCookie("csrftoken");
  if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(apiUrl(path), {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    const error = new Error(`Server error ${response.status}`) as Error & {
      status?: number;
      data?: unknown;
    };
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = await response.text();
    }
    throw error;
  }
  return (await response.json()) as T;
}

async function idbPut(record: PersistedUpload): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAll(): Promise<PersistedUpload[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as PersistedUpload[]) || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------- XHR (binary)

function getCookie(name: string): string | null {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return value ? decodeURIComponent(value.split("=")[1]) : null;
}

class PartUploadError extends Error {
  retryable: boolean;
  status: number;
  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * POST one raw multipart segment to Django's relay endpoint with granular
 * progress events. Uses XMLHttpRequest (fetch cannot report upload progress)
 * and sends the same cookie + X-Workspace + CSRF headers.
 */
function xhrUploadPart(
  sessionId: string,
  partNumber: number,
  blob: Blob,
  workspace: string,
  onProgress?: (loaded: number) => void,
  signal?: AbortSignal,
): Promise<{ etag: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = apiUrl(
      `/apis/media/assets/uploads/${sessionId}/part/?part_number=${partNumber}`,
    );
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.responseType = "text";
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader("X-Workspace", workspace);
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) xhr.setRequestHeader("X-CSRFToken", csrfToken);

    let done = false;
    const abort = () => {
      if (done) return;
      xhr.abort();
    };
    signal?.addEventListener("abort", abort, { once: true });

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      done = true;
      signal?.removeEventListener("abort", abort);
      if (xhr.status >= 200 && xhr.status < 300) {
        // Prefer the `etag` field in the JSON body. If the body doesn't
        // arrive intact (Next.js rewrites can alter the response body, unlike
        // the legacy Vite proxy), fall back to the `ETag` response header that
        // Django also sets (viewsets.py upload_part → Response(headers={"ETag"})).
        // Headers survive the rewrite proxy reliably; bodies may not.
        let etag = "";
        try {
          const parsed = JSON.parse(xhr.responseText || "{}");
          if (parsed && typeof parsed.etag === "string") etag = parsed.etag;
        } catch {
          /* body unparseable — fall back to header */
        }
        if (!etag) {
          const headerEtag = xhr.getResponseHeader("ETag");
          if (headerEtag) etag = headerEtag.replace(/^W\//, "").replace(/^"|"$/g, "");
        }
        resolve({ etag });
      } else {
        let detail = `Server error ${xhr.status}`;
        try {
          const parsed = JSON.parse(xhr.responseText || "{}");
          if (parsed.errors?.length) {
            detail = parsed.errors
              .map((e: any) => e.detail || e.message)
              .filter(Boolean)
              .join(", ");
          } else if (parsed.detail) {
            detail = parsed.detail;
          }
        } catch {
          /* keep default */
        }
        reject(
          new PartUploadError(
            detail,
            xhr.status,
            !!(xhr.status >= 500 || xhr.status === 429 || xhr.status === 0),
          ),
        );
      }
    };
    xhr.onerror = () => {
      done = true;
      signal?.removeEventListener("abort", abort);
      reject(
        new PartUploadError("Network error while uploading a segment", 0, true),
      );
    };
    xhr.onabort = () => {
      done = true;
      signal?.removeEventListener("abort", abort);
      const err = new Error("Aborted");
      (err as any).aborted = true;
      reject(err);
    };
    xhr.send(blob);
  });
}

function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

function AbortError(): Error {
  const err = new Error("Upload cancelled");
  (err as any).aborted = true;
  return err;
}

// ---------------------------------------------------------------- manager

interface UploadSupplement {
  probePromise?: Promise<VideoProbeResult | null>;
}
const supplements = new Map<string, UploadSupplement>();

function parseApiError(error: unknown): string {
  if (!error) return "An unexpected error occurred";
  const payload = error as any;
  const data = payload.data ?? payload;

  if (data && typeof data === "object" && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e: any) => {
        const detail = e.detail || e.message || "";
        const attr = e.attr ? `${e.attr}: ` : "";
        return attr + detail;
      })
      .filter(Boolean)
      .join("\n");
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const messages: string[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val) && val.length > 0) {
        messages.push(`${key}: ${val.join(", ")}`);
      } else if (typeof val === "string" && val) {
        messages.push(val);
      }
    }
    if (messages.length > 0) return messages.join("\n");
  }

  if (typeof data === "string" && data) {
    const trimmed = data.trimStart();
    if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
      return "The server is unreachable. Please try again in a moment.";
    }
    return data;
  }

  if (payload.message) return payload.message;

  if (payload.status && typeof payload.status === "number") {
    const statusTexts: Record<number, string> = {
      400: "Bad request",
      403: "Access denied",
      404: "Resource not found",
      405: "Method not allowed",
      409: "Conflict",
      429: "Too many requests",
      500: "Internal server error",
      502: "Bad gateway",
      503: "Service unavailable",
    };
    return statusTexts[payload.status] || `Request failed (${payload.status})`;
  }

  return "An unexpected error occurred";
}

async function backfillVideoAsset(
  assetNanoid: string,
  probe: VideoProbeResult | null,
  workspace: string,
): Promise<void> {
  if (!assetNanoid || !probe) return;
  const form = new FormData();
  if (probe.duration) {
    form.append(
      "duration_seconds",
      String(Math.round(probe.duration * 1000) / 1000),
    );
  }
  if (probe.width) form.append("width", String(probe.width));
  if (probe.height) form.append("height", String(probe.height));
  if (probe.posterBlob) {
    form.append("thumbnail", probe.posterBlob, `${assetNanoid}-poster.jpg`);
  }
  if ([...form.keys()].length === 0) return;

  const { patchAssetMultipartAction } = await import("./actions");
  await patchAssetMultipartAction(assetNanoid, form, workspace);
}

class UploadManager {
  private uploads = new Map<string, PersistedUpload>();
  private listeners = new Set<Listener>();
  private running = new Set<string>();
  private initialized = false;
  private snapshot: PersistedUpload[] = [];
  private samples = new Map<string, Array<{ t: number; b: number }>>();
  private liveParts = new Map<string, UploadPart[]>();
  private notifyTimer: ReturnType<typeof setTimeout> | null = null;
  private aborts = new Map<string, AbortController>();

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    try {
      const records = await idbGetAll();
      for (const r of records) {
        if (r.status === "failed" || r.status === "cancelled") {
          try {
            await idbDelete(r.id);
          } catch {
            /* ignore */
          }
          continue;
        }
        this.uploads.set(r.id, r);
      }
      this.emit();
      for (const r of this.uploads.values()) {
        if (r.status === "uploading" || r.status === "pending") {
          void this.resume(r.id);
        }
      }
    } catch (err) {
      console.warn(
        "Upload manager: IndexedDB unavailable, uploads will not persist.",
        err,
      );
    }
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): PersistedUpload[] => this.snapshot;

  private async persist(record: PersistedUpload): Promise<void> {
    this.uploads.set(record.id, record);
    this.emit();
    try {
      await idbPut(record);
    } catch {
      /* non-fatal: in-memory state still works */
    }
  }

  private emit() {
    this.snapshot = Array.from(this.uploads.values());
    for (const l of this.listeners) l();
  }

  async enqueue(file: File, workspace: string): Promise<string> {
    const record: PersistedUpload = {
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      size: file.size,
      mimeType: file.type || "",
      workspace,
      status: "pending",
      createdAt: Date.now(),
    };
    await this.persist(record);

    if (record.mimeType.startsWith("video/")) {
      const { probeVideoFile } = await import("./video-probe");
      supplements.set(record.id, {
        probePromise: probeVideoFile(file).catch(() => null),
      });
    }

    void this.resume(record.id);
    return record.id;
  }

  private async resume(id: string): Promise<void> {
    if (this.running.has(id)) return;
    this.running.add(id);
    try {
      await this.run(id);
    } finally {
      this.running.delete(id);
    }
  }

  private buildParts(record: PersistedUpload): UploadPart[] {
    const partSize = record.partSize ?? DEFAULT_PART_SIZE;
    const totalParts = Math.max(1, Math.ceil(record.size / partSize));
    const parts: UploadPart[] = [];
    const done = new Map<number, string>(
      (record.doneParts || []).map((p) => [p.part_number, p.etag]),
    );
    for (let n = 1; n <= totalParts; n += 1) {
      const isLast = n === totalParts;
      const size = isLast ? record.size - (n - 1) * partSize : partSize;
      const etag = done.get(n);
      parts.push({
        part_number: n,
        size,
        loaded: etag ? size : 0,
        status: etag ? "done" : "pending",
        attempts: 0,
        etag,
      });
    }
    record.parts = parts;
    return parts;
  }

  private loadedBytes(parts: UploadPart[]): number {
    let loaded = 0;
    for (const p of parts) {
      loaded += p.status === "done" ? p.size : Math.min(p.loaded, p.size);
    }
    return loaded;
  }

  private flushProgress(): void {
    this.notifyTimer = null;
    for (const [id, parts] of Array.from(this.liveParts.entries())) {
      const record = this.uploads.get(id);
      if (!record) continue;

      const loaded = this.loadedBytes(parts);
      const progress = record.size
        ? Math.round((loaded / record.size) * 100)
        : 0;

      const now = Date.now();
      const s = this.samples.get(id) || [];
      s.push({ t: now, b: loaded });
      while (s.length > 2 && now - s[0].t > 3000) s.shift();
      this.samples.set(id, s);
      let speedBps = 0;
      if (s.length >= 2) {
        const first = s[0];
        const last = s[s.length - 1];
        const dt = (last.t - first.t) / 1000;
        if (dt > 0.25) speedBps = Math.max(0, (last.b - first.b) / dt);
      }

      record.progress = progress;
      record.speedBps = speedBps;
    }
    if (this.liveParts.size > 0) this.emit();
  }

  private scheduleNotify(record: PersistedUpload, parts: UploadPart[]): void {
    this.liveParts.set(record.id, parts);
    record.parts = parts;
    if (this.notifyTimer) return;
    this.notifyTimer = setTimeout(() => this.flushProgress(), NOTIFY_THROTTLE_MS);
  }

  private async uploadOnePart(
    record: PersistedUpload,
    parts: UploadPart[],
    part: UploadPart,
    signal: AbortSignal,
  ): Promise<void> {
    const partSize = record.partSize ?? DEFAULT_PART_SIZE;
    const startByte = (part.part_number - 1) * partSize;
    const blob = record.file.slice(startByte, startByte + part.size);

    for (let attempt = 1; ; attempt += 1) {
      if (signal.aborted) throw AbortError();
      part.attempts = attempt;
      part.status = "uploading";
      try {
        const resp = await xhrUploadPart(
          record.sessionId!,
          part.part_number,
          blob,
          record.workspace,
          (loaded) => {
            part.loaded = loaded;
            this.scheduleNotify(record, parts);
          },
          signal,
        );
        part.loaded = part.size;
        part.etag = resp?.etag;
        part.status = "done";
        this.recordDonePart(record, part);
        this.scheduleNotify(record, parts);
        return;
      } catch (err: any) {
        if (err?.aborted || signal.aborted) throw err;
        const retryable = !!err?.retryable;
        if (attempt >= MAX_ATTEMPTS || !retryable) {
          part.status = "failed";
          this.scheduleNotify(record, parts);
          throw err;
        }
        part.status = "retrying";
        this.scheduleNotify(record, parts);
        const delay =
          Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS) *
          (0.7 + Math.random() * 0.6);
        await abortableSleep(delay, signal);
      }
    }
  }

  private recordDonePart(record: PersistedUpload, part: UploadPart): void {
    if (!part.etag) return;
    const done = new Map<number, string>(
      (record.doneParts || []).map((p) => [p.part_number, p.etag]),
    );
    done.set(part.part_number, part.etag);
    record.doneParts = Array.from(done.entries()).map(([part_number, etag]) => ({
      part_number,
      etag,
    }));
    void this.persist(record);
  }

  private async runWorkers(
    record: PersistedUpload,
    parts: UploadPart[],
    signal: AbortSignal,
  ): Promise<boolean> {
    let cursor = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        if (signal.aborted) throw AbortError();
        const idx = cursor;
        cursor += 1;
        if (idx >= parts.length) return;
        const part = parts[idx];
        if (!part || part.status === "done") continue;
        await this.uploadOnePart(record, parts, part, signal);
      }
    });
    const results = await Promise.allSettled(workers);
    return results.some((r) => r.status === "rejected");
  }

  private async run(id: string): Promise<void> {
    const record = this.uploads.get(id);
    if (!record) return;
    if (record.status === "completed" || record.status === "cancelled") return;

    const controller = new AbortController();
    this.aborts.set(id, controller);
    const signal = controller.signal;

    try {

      // 1. Ensure a session exists (fresh initiate, or reuse for resume).
      if (!record.sessionId) {
        const config = await browserApi<{ part_size?: number }>(
          "/apis/media/assets/config/",
          record.workspace,
        ).catch(
          () => null,
        );
        record.partSize = Math.max(
          config?.part_size || DEFAULT_PART_SIZE,
          MIN_PART_SIZE,
        );
        record.totalParts = Math.max(
          1,
          Math.ceil(record.size / record.partSize),
        );
        const session = await browserApi<{ nanoid: string }>(
          "/apis/media/assets/uploads/initiate/",
          record.workspace,
          {
            method: "POST",
            body: {
              file_name: record.filename,
              file_size: record.size,
              content_type: record.mimeType || "application/octet-stream",
            },
          },
        );
        record.sessionId = session.nanoid;
        await this.persist(record);
      } else if (!record.partSize) {
        record.partSize = DEFAULT_PART_SIZE;
        record.totalParts = Math.max(
          1,
          Math.ceil(record.size / record.partSize),
        );
      }

      // 2. Reconcile vs the server ledger (so resume skips already-done
      //    parts). The backend is the source of truth. Mirror the legacy
      //    uploader: only reconcile when we have no local ledger yet, and on
      //    any error treat the ledger as empty and continue — never fail
      //    startup. This is what keeps the commit payload in lockstep with the
      //    backend, so the commit never reports parts as "missing".
      if (!record.doneParts || record.doneParts.length === 0) {
        try {
          const info = await browserApi<{
            parts: Array<{ part_number: number; etag?: string }>;
            part_size: number;
          }>(
            `/apis/media/assets/uploads/${record.sessionId}/parts/`,
            record.workspace,
          );
          record.partSize = Math.max(
            info?.part_size || record.partSize || DEFAULT_PART_SIZE,
            MIN_PART_SIZE,
          );
          record.totalParts = Math.max(
            1,
            Math.ceil(record.size / (record.partSize ?? DEFAULT_PART_SIZE)),
          );
          record.doneParts = (info?.parts || []).map((p: any) => ({
            part_number: p.part_number,
            etag: p.etag || "",
          }));
          record.status = "uploading";
          await this.persist(record);
        } catch {
          /* fresh session has no parts; treat as empty */
          record.status = "uploading";
          await this.persist(record);
        }
      } else {
        record.status = "uploading";
        await this.persist(record);
      }

      // 3. Upload remaining parts with a small worker pool.
      const parts = this.buildParts(record);
      const hadFailure = await this.runWorkers(record, parts, signal);

      if (signal.aborted) return;
      if (hadFailure) {
        throw new Error("Some segments failed after several automatic retries.");
      }

      const commitParts = parts
        .filter((p) => p.status === "done" && p.etag)
        .map((p) => ({ part_number: p.part_number, etag: p.etag! }));

      // 4. Complete / assemble the object and resolve it into an Asset.
      //    Single commit, exactly like the legacy uploader: no retry loop, no
      //    pre-commit re-sync. The server ledger reconcile in step 2 already
      //    guarantees the commit payload matches what Django has stored.
      const result = await browserApi<{ asset?: { nanoid?: string } }>(
        `/apis/media/assets/uploads/${record.sessionId}/complete/`,
        record.workspace,
        { method: "POST", body: { parts: commitParts } },
      );
      const asset = result?.asset ?? null;

      record.status = "completed";
      record.progress = 100;
      await this.persist(record);
      this.deactivateProgress(id);

      // 5. Backfill video metadata if this is a video.
      await this.backfillVideo(asset?.nanoid ?? undefined, id, record);
    } catch (err: any) {
      if (signal.aborted || err?.aborted) {
        this.deactivateProgress(id);
        return;
      }
      record.status = "failed";
      record.error = parseApiError(err);
      record.progress = undefined;
      await this.persist(record);
      this.deactivateProgress(id);
    } finally {
      this.aborts.delete(id);
    }
  }

  private deactivateProgress(id: string): void {
    this.liveParts.delete(id);
    this.samples.delete(id);
  }

  async cancel(id: string): Promise<void> {
    const record = this.uploads.get(id);
    if (!record) return;
    this.aborts.get(id)?.abort();
    record.status = "cancelled";
    await this.persist(record);
    if (record.sessionId) {
      try {
        await browserApi(
          `/apis/media/assets/uploads/${record.sessionId}/abort/`,
          record.workspace,
          { method: "POST", body: {} },
        );
      } catch {
        /* orphaned session cleaned up by lifecycle rules */
      }
    }
    this.uploads.delete(id);
    try {
      await idbDelete(id);
    } catch {
      /* ignore */
    }
    this.deactivateProgress(id);
    this.aborts.delete(id);
    this.emit();
  }

  async retry(id: string): Promise<void> {
    const record = this.uploads.get(id);
    if (!record) return;
    record.status = "pending";
    record.error = undefined;
    await this.persist(record);
    void this.resume(id);
  }

  async clearCompleted(): Promise<void> {
    for (const [key, record] of Array.from(this.uploads.entries())) {
      if (record.status === "completed" || record.status === "cancelled") {
        this.deactivateProgress(key);
        this.uploads.delete(key);
        try {
          await idbDelete(key);
        } catch {
          /* ignore */
        }
      }
    }
    this.emit();
  }

  async clearFailed(): Promise<void> {
    for (const [key, record] of Array.from(this.uploads.entries())) {
      if (record.status === "failed") {
        this.deactivateProgress(key);
        this.uploads.delete(key);
        try {
          await idbDelete(key);
        } catch {
          /* ignore */
        }
      }
    }
    this.emit();
  }

  private async backfillVideo(
    assetNanoid: string | undefined,
    id: string,
    record: PersistedUpload,
  ): Promise<void> {
    if (!assetNanoid) return;
    if (!record.mimeType.startsWith("video/")) return;
    const supp = supplements.get(id);
    let probe: VideoProbeResult | null = null;
    if (supp?.probePromise) {
      try {
        probe = await supp.probePromise;
      } catch {
        probe = null;
      }
    }
    if (!probe) return;
    try {
      await backfillVideoAsset(assetNanoid, probe, record.workspace);
    } catch (err) {
      console.warn(
        "Video upload backfill failed (upload already succeeded):",
        err,
      );
    }
  }

  async clear(id: string): Promise<void> {
    this.deactivateProgress(id);
    this.uploads.delete(id);
    try {
      await idbDelete(id);
    } catch {
      /* ignore */
    }
    this.emit();
  }
}

export const uploadManager = new UploadManager();
