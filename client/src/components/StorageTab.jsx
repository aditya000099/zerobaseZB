import { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  HardDrives,
  CloudArrowUp,
  Warning,
  CheckCircle,
  FilePdf,
  FileImage,
  File,
  Trash,
  DownloadSimple,
  ArrowClockwise,
} from "@phosphor-icons/react";
import CustomDialog from "./CustomDialog";
import CustomInput from "./CustomInput";

// ── utils ─────────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function formatMb(mb) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb} MB`;
}
function FileIcon({ ext, size = 28 }) {
  if (ext === ".pdf") return <FilePdf size={size} weight="fill" className="text-red-400" />;
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext))
    return <FileImage size={size} weight="fill" className="text-blue-400" />;
  return <File size={size} weight="fill" className="text-white/40" />;
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function StorageGauge({ usedMb, quotaMb }) {
  const pct = quotaMb > 0 ? Math.min((usedMb / quotaMb) * 100, 100) : 0;
  const color =
    pct >= 90 ? "from-red-500 to-rose-600" : pct >= 70 ? "from-amber-400 to-orange-500" : "from-zb-cyan to-teal-400";
  const statusColor = pct >= 90 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-white/50 text-sm font-outfit">Storage Used</span>
        <span className={`text-sm font-mono font-semibold ${statusColor}`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/10">
        <div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
        <div className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color} blur-sm opacity-50 transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-white/30 font-mono">
        <span>{formatMb(usedMb)} used</span>
        <span>{formatMb(quotaMb)} quota</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function StorageTab() {
  const { projectId } = useOutletContext();
  const [info, setInfo] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandOpen, setExpandOpen] = useState(false);
  const [newQuota, setNewQuota] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/storage/${projectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInfo(data);
      setNewQuota(String(data.quotaMb));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchFiles = useCallback(async () => {
    setFilesLoading(true);
    try {
      const res = await fetch(`/api/storage/${projectId}/files`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {
      console.error("List files error:", e);
    } finally {
      setFilesLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchInfo();
    fetchFiles();
  }, [fetchInfo, fetchFiles]);

  const refresh = () => {
    fetchInfo();
    fetchFiles();
  };

  // ── Upload ──
  const handleFiles = async (fileList) => {
    const accepted = Array.from(fileList).filter((f) =>
      ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"].includes(f.type)
    );
    if (accepted.length === 0) {
      showToast("err", "Only PDF, PNG, JPG, GIF, or WebP files are allowed.");
      return;
    }

    setUploading(true);
    let failures = 0;
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i];
      setUploadProgress(`Uploading ${i + 1}/${accepted.length}: ${file.name}`);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch(`/api/storage/${projectId}/files`, {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } catch (e) {
        console.error("Upload failed:", file.name, e);
        failures++;
      }
    }
    setUploading(false);
    setUploadProgress(null);
    if (failures === 0) showToast("ok", `${accepted.length} file(s) uploaded successfully.`);
    else showToast("err", `${failures} file(s) failed to upload.`);
    refresh();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Delete ──
  const handleDelete = async (filename) => {
    if (!window.confirm(`Delete "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/storage/${projectId}/files/${encodeURIComponent(filename)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("ok", `"${filename}" deleted.`);
      refresh();
    } catch (e) {
      showToast("err", e.message);
    }
  };

  // ── Quota update ──
  const handleExpandQuota = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/storage/${projectId}/quota`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newQuotaMb: parseInt(newQuota, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("ok", "Quota updated.");
      setExpandOpen(false);
      fetchInfo();
    } catch (e) {
      showToast("err", e.message);
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = (filename) => `/api/storage/${projectId}/files/${encodeURIComponent(filename)}`;

  return (
    <div className="px-6 py-3 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-clip-text text-transparent text-2xl font-outfit tracking-tighter">
            Storage
          </h1>
          <p className="text-white/50 text-sm mt-0.5">Upload and manage project files.</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-zb-cyan/30 transition-all">
          <ArrowClockwise size={18} />
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${toast.type === "ok" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-red-500/30 bg-red-500/5 text-red-400"}`}>
          {toast.type === "ok" ? <CheckCircle size={16} weight="fill" /> : <Warning size={16} weight="fill" />}
          {toast.text}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-black/20 p-5 text-red-400">
          <Warning size={22} weight="fill" /> <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Storage gauge card */}
      {info && !loading && (
        <div className="backdrop-blur-md bg-black/20 rounded-2xl border border-zb-cyan/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-black/30"><HardDrives size={24} weight="fill" className="text-zb-cyan" /></div>
              <div>
                <p className="text-white font-outfit font-medium text-sm">Quota</p>
                <p className="text-white/30 text-xs font-mono">{formatMb(info.usedMb)} / {formatMb(info.quotaMb)}</p>
              </div>
            </div>
            <button onClick={() => { setNewQuota(String(info.quotaMb)); setExpandOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zb-cyan/30 bg-zb-cyan/5 text-zb-cyan text-xs font-outfit hover:bg-zb-cyan/10 transition-all">
              <CloudArrowUp size={14} weight="bold" /> Expand
            </button>
          </div>
          <StorageGauge usedMb={info.usedMb} quotaMb={info.quotaMb} />
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: "Used", value: formatMb(info.usedMb), color: "text-white" },
              { label: "Quota", value: formatMb(info.quotaMb), color: "text-zb-cyan" },
              { label: "Server Free", value: formatMb(info.availableDiskMb), color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-black/20 border border-white/5 p-3 text-center">
                <p className="text-white/30 text-xs mb-0.5">{s.label}</p>
                <p className={`text-base font-mono font-semibold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200
          ${dragging ? "border-zb-cyan/60 bg-zb-cyan/5 scale-[1.01]" : "border-white/10 bg-black/10 hover:border-zb-cyan/30 hover:bg-black/20"}`}
      >
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {uploading ? (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-zb-cyan/40 border-t-zb-cyan animate-spin" />
            <p className="text-white/60 text-sm">{uploadProgress}</p>
          </>
        ) : (
          <>
            <CloudArrowUp size={36} weight="thin" className={dragging ? "text-zb-cyan" : "text-white/30"} />
            <div className="text-center">
              <p className="text-white/70 text-sm font-outfit">Drop files here or <span className="text-zb-cyan">browse</span></p>
              <p className="text-white/30 text-xs mt-1">PDF, PNG, JPG, GIF, WebP · max 50 MB per file</p>
            </div>
          </>
        )}
      </div>

      {/* File list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium">
            Files {files.length > 0 && <span className="ml-1 text-white/40">({files.length})</span>}
          </h3>
        </div>

        {filesLoading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-zb-cyan/30 border-t-zb-cyan animate-spin" />
          </div>
        )}

        {!filesLoading && files.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-black/10 p-8 text-center">
            <p className="text-white/30 text-sm">No files uploaded yet.</p>
          </div>
        )}

        {!filesLoading && files.map((file) => (
          <div key={file.name}
            className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3
                       hover:border-zb-cyan/20 hover:bg-black/30 transition-all duration-200 group">
            {/* Icon / thumbnail */}
            <div className="shrink-0">
              {[".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(file.ext) ? (
                <img src={previewUrl(file.name)} alt={file.name}
                  className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-black/30" />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/30 border border-white/10">
                  <FileIcon ext={file.ext} size={22} />
                </div>
              )}
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm font-medium truncate">{file.name}</p>
              <p className="text-white/30 text-xs font-mono mt-0.5">
                {formatBytes(file.sizeBytes)} · {new Date(file.modifiedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={previewUrl(file.name)} download={file.name}
                className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-zb-cyan hover:border-zb-cyan/30 transition-all"
                title="Download">
                <DownloadSimple size={16} weight="bold" />
              </a>
              <button onClick={() => handleDelete(file.name)}
                className="p-1.5 rounded-lg border border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/30 transition-all"
                title="Delete">
                <Trash size={16} weight="bold" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Expand Quota Dialog */}
      <CustomDialog open={expandOpen} onClose={() => setExpandOpen(false)} title="Expand Storage Quota"
        onConfirm={handleExpandQuota} confirmText={saving ? "Saving…" : "Save Quota"}>
        <p className="text-white/50 text-sm mb-4">
          Current: <span className="text-white/80">{info ? formatMb(info.quotaMb) : "—"}</span>.
          {info && <> Server free: <span className="text-emerald-400">{formatMb(info.availableDiskMb)}</span>.</>}
        </p>
        <CustomInput label="New Quota (MB)" type="number" value={newQuota}
          onChange={(e) => setNewQuota(e.target.value)} inputProps={{ min: info ? info.usedMb : 1 }} />
        <div className="flex flex-wrap gap-2 mt-3">
          {[512, 1024, 2048, 5120, 10240].map((mb) => (
            <button key={mb} onClick={() => setNewQuota(String(mb))}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all
                ${String(newQuota) === String(mb)
                  ? "bg-zb-cyan/20 border-zb-cyan/50 text-zb-cyan"
                  : "bg-black/20 border-white/10 text-white/50 hover:border-zb-cyan/30"}`}>
              {mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`}
            </button>
          ))}
        </div>
      </CustomDialog>
    </div>
  );
}
