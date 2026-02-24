import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    GlobeHemisphereWest,
    Plus,
    Trash,
    Key,
    CheckCircle,
    Warning,
    Copy,
    Eye,
    EyeSlash,
} from "@phosphor-icons/react";
import CustomInput from "./CustomInput";

// ── helpers ───────────────────────────────────────────────────────────────────
function Card({ title, subtitle, icon, children }) {
    return (
        <div className="backdrop-blur-md bg-black/20 rounded-2xl border border-zb-cyan/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-black/30 text-zb-cyan">{icon}</div>
                <div>
                    <p className="text-white font-outfit font-medium">{title}</p>
                    {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Toast({ msg, onDone }) {
    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(onDone, 3500);
        return () => clearTimeout(t);
    }, [msg, onDone]);
    if (!msg) return null;
    const ok = msg.type === "ok";
    return (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm
      ${ok ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-red-500/30 bg-red-500/5 text-red-400"}`}>
            {ok ? <CheckCircle size={16} weight="fill" /> : <Warning size={16} weight="fill" />}
            {msg.text}
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsTab() {
    const { projectId } = useOutletContext();
    const [urls, setUrls] = useState([]);
    const [newUrl, setNewUrl] = useState("");
    const [urlLoading, setUrlLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // API key state
    const [newKey, setNewKey] = useState(null);       // only shown once after regen
    const [keyVisible, setKeyVisible] = useState(false);
    const [regenLoading, setRegenLoading] = useState(false);

    const notify = (type, text) => { setToast({ type, text }); };

    // ── Fetch URLs ──
    const fetchUrls = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/urls`);
            const data = await res.json();
            setUrls(data.urls || []);
        } catch { setUrls([]); }
    }, [projectId]);

    useEffect(() => { fetchUrls(); }, [fetchUrls]);

    // ── Add URL ──
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newUrl.trim()) return;
        setUrlLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/urls`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: newUrl.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUrls(data.urls);
            setNewUrl("");
            notify("ok", "URL added successfully.");
        } catch (err) { notify("err", err.message); }
        finally { setUrlLoading(false); }
    };

    // ── Remove URL ──
    const handleRemove = async (url) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/urls`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUrls(data.urls);
            notify("ok", "URL removed.");
        } catch (err) { notify("err", err.message); }
    };

    // ── Regenerate API key ──
    const handleRegen = async () => {
        if (!window.confirm("Regenerate API key? The old key will stop working immediately.")) return;
        setRegenLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}/regenerate-key`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setNewKey(data.apiKey);
            setKeyVisible(true);
            notify("ok", "New API key generated. Copy it now — it won't be shown again.");
        } catch (err) { notify("err", err.message); }
        finally { setRegenLoading(false); }
    };

    // ── Copy ──
    const copyKey = () => {
        if (newKey) navigator.clipboard.writeText(newKey);
        notify("ok", "API key copied to clipboard.");
    };

    return (
        <div className="px-6 py-3 space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
                       bg-clip-text text-transparent text-2xl font-outfit tracking-tighter">
                    Settings
                </h1>
                <p className="text-white/50 text-sm mt-0.5">
                    Manage authorized origins and API access for this project.
                </p>
            </div>

            {/* Toast */}
            <Toast msg={toast} onDone={() => setToast(null)} />

            {/* ── Authorized URLs ─────────────────────────────────────────────── */}
            <Card
                title="Authorized URLs"
                subtitle="Browser SDK calls from these origins are allowed without an API key"
                icon={<GlobeHemisphereWest size={22} weight="fill" />}
            >
                <div className="space-y-4">
                    {/* Add form */}
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <div className="flex-1">
                            <CustomInput
                                placeholder="https://myapp.com"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={urlLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zb-cyan/30
                         bg-zb-cyan/5 text-zb-cyan text-sm font-outfit
                         hover:bg-zb-cyan/10 hover:border-zb-cyan/50 transition-all
                         disabled:opacity-50 shrink-0">
                            <Plus size={16} weight="bold" />
                            Add
                        </button>
                    </form>

                    {/* Rules */}
                    <div className="bg-black/20 rounded-xl border border-white/5 px-4 py-3 text-xs text-white/40 space-y-1">
                        <p>• Must be a full http/https origin — no trailing path (e.g. <span className="text-white/60">https://myapp.com</span>)</p>
                        <p>• <span className="text-white/60">http://localhost:PORT</span> is fine for development</p>
                        <p>• Requests from unlisted origins still work with a valid <span className="text-white/60">X-API-Key</span> header</p>
                    </div>

                    {/* URL list */}
                    {urls.length === 0 ? (
                        <div className="rounded-xl border border-white/5 bg-black/10 p-6 text-center">
                            <GlobeHemisphereWest size={32} weight="thin" className="text-white/20 mx-auto mb-2" />
                            <p className="text-white/30 text-sm">No authorized URLs yet.</p>
                            <p className="text-white/20 text-xs mt-1">Add your app's origin above.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {urls.map((url) => (
                                <div key={url}
                                    className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20
                             px-4 py-3 group hover:border-zb-cyan/20 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                        <span className="text-sm text-white/80 font-mono">{url}</span>
                                    </div>
                                    <button onClick={() => handleRemove(url)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40
                               hover:text-red-400 hover:bg-red-500/10 transition-all">
                                        <Trash size={15} weight="bold" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* ── API Key ─────────────────────────────────────────────────────── */}
            <Card
                title="API Key"
                subtitle="Use this key for server-to-server SDK calls only — never in browser code"
                icon={<Key size={22} weight="fill" />}
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 px-4 py-3 text-xs text-amber-400 flex items-start gap-2">
                        <Warning size={16} weight="fill" className="mt-0.5 shrink-0" />
                        <p>API keys grant full access to your project. Only use them in backend environments where the key cannot be read by users.</p>
                    </div>

                    {newKey ? (
                        <div className="space-y-3">
                            <p className="text-xs text-white/50">
                                New key generated. <span className="text-amber-400 font-medium">Copy it now — it will not be shown again.</span>
                            </p>
                            <div className="flex items-center gap-2 rounded-xl border border-zb-cyan/20 bg-black/30 px-4 py-3">
                                <span className="flex-1 text-sm font-mono text-zb-cyan truncate">
                                    {keyVisible ? newKey : "•".repeat(36)}
                                </span>
                                <button onClick={() => setKeyVisible(!keyVisible)}
                                    className="text-white/30 hover:text-white transition-colors p-1">
                                    {keyVisible ? <EyeSlash size={16} /> : <Eye size={16} />}
                                </button>
                                <button onClick={copyKey}
                                    className="flex items-center gap-1 text-xs text-zb-cyan hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-zb-cyan/10">
                                    <Copy size={14} />Copy
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-sm text-white/30 font-mono">
                            ••••••••-••••-••••-••••-••••••••••••
                        </div>
                    )}

                    <button onClick={handleRegen} disabled={regenLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10
                       bg-black/20 text-white/60 text-sm font-outfit
                       hover:border-zb-cyan/30 hover:text-white hover:bg-black/30
                       transition-all disabled:opacity-50">
                        <Key size={16} weight="bold" />
                        {regenLoading ? "Regenerating…" : "Regenerate API Key"}
                    </button>
                </div>
            </Card>

            {/* ── SDK Usage hint ────────────────────────────────────────────── */}
            <div className="rounded-xl border border-white/5 bg-black/10 p-5 space-y-3">
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">How access works</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-black/20 border border-white/5 p-3 space-y-1.5">
                        <p className="text-zb-cyan font-medium">🌐 Browser / Frontend</p>
                        <p className="text-white/40 leading-relaxed">Add your app's URL above. SDK calls from that origin are automatically allowed — <span className="text-white/60">no API key needed</span>.</p>
                    </div>
                    <div className="rounded-xl bg-black/20 border border-white/5 p-3 space-y-1.5">
                        <p className="text-emerald-400 font-medium">🖥️ Server / Backend</p>
                        <p className="text-white/40 leading-relaxed">Pass the API key as <span className="text-white/60">X-API-Key</span> header in your server-side code. Works from any origin.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
