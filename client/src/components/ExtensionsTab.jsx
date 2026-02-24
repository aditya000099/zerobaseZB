import { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Cube, MagnifyingGlass, ArrowsClockwise, CheckCircle, XCircle } from "@phosphor-icons/react";

// Extension category metadata (for display grouping & descriptions)
const EXT_CATEGORIES = {
    "uuid-ossp": { cat: "Identifiers", icon: "🆔" },
    "pgcrypto": { cat: "Crypto", icon: "🔐" },
    "pg_trgm": { cat: "Full-Text", icon: "🔍" },
    "fuzzystrmatch": { cat: "Full-Text", icon: "🔍" },
    "unaccent": { cat: "Full-Text", icon: "🔍" },
    "dict_int": { cat: "Full-Text", icon: "🔍" },
    "dict_xsyn": { cat: "Full-Text", icon: "🔍" },
    "hstore": { cat: "JSON & KV", icon: "📦" },
    "ltree": { cat: "Hierarchical", icon: "🌲" },
    "intarray": { cat: "Arrays", icon: "🔢" },
    "tablefunc": { cat: "Analytics", icon: "📊" },
    "citext": { cat: "Text", icon: "📝" },
    "pg_stat_statements": { cat: "Monitoring", icon: "📈" },
    "pgrowlocks": { cat: "Monitoring", icon: "📈" },
    "pgstattuple": { cat: "Monitoring", icon: "📈" },
    "postgis": { cat: "Geospatial", icon: "🗺️" },
    "postgis_topology": { cat: "Geospatial", icon: "🗺️" },
    "postgis_tiger_geocoder": { cat: "Geospatial", icon: "🗺️" },
    "vector": { cat: "AI / ML", icon: "🧠" },
    "bloom": { cat: "Indexes", icon: "⚡" },
    "btree_gin": { cat: "Indexes", icon: "⚡" },
    "btree_gist": { cat: "Indexes", icon: "⚡" },
    "earthdistance": { cat: "Geospatial", icon: "🌍" },
    "cube": { cat: "Math", icon: "📐" },
    "isn": { cat: "Standards", icon: "🏷️" },
    "lo": { cat: "Storage", icon: "💾" },
    "seg": { cat: "Math", icon: "📐" },
    "xml2": { cat: "Data Formats", icon: "🗂️" },
};

function Toast({ msg, onDone }) {
    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(onDone, 3500);
        return () => clearTimeout(t);
    }, [msg, onDone]);
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm shrink-0
      ${msg.type === "ok"
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "border-red-500/30 bg-red-500/5 text-red-400"}`}>
            {msg.text}
        </div>
    );
}

// Small toggle pill - shows enabled/disabled state
function StatusBadge({ installed }) {
    return installed ? (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                     bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <CheckCircle size={12} weight="fill" /> Enabled
        </span>
    ) : (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                     bg-white/5 border border-white/10 text-white/30">
            <XCircle size={12} weight="fill" /> Disabled
        </span>
    );
}

export default function ExtensionsTab() {
    const { projectId } = useOutletContext();
    const [extensions, setExtensions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null); // extension name currently toggling
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // 'all' | 'enabled' | 'available'

    const notify = (type, text) => setToast({ type, text });

    const fetchExtensions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/db/extensions?projectId=${projectId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setExtensions(data.extensions || []);
        } catch (err) {
            notify("err", err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchExtensions(); }, [fetchExtensions]);

    const handleToggle = async (ext) => {
        setToggling(ext.name);
        const endpoint = ext.installed ? "/api/db/extensions/disable" : "/api/db/extensions/enable";
        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, name: ext.name }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            notify("ok", ext.installed
                ? `Extension "${ext.name}" disabled.`
                : `Extension "${ext.name}" enabled.`
            );
            // Optimistic update
            setExtensions((prev) =>
                prev.map((e) => e.name === ext.name
                    ? { ...e, installed: !e.installed, installed_version: e.installed ? null : e.default_version }
                    : e
                )
            );
        } catch (err) {
            notify("err", err.message);
        } finally {
            setToggling(null);
        }
    };

    // Filter + search
    const visible = useMemo(() => {
        const known = new Set(Object.keys(EXT_CATEGORIES));
        return extensions
            .filter((e) => known.has(e.name)) // only show whitelisted ones
            .filter((e) => {
                if (filter === "enabled") return e.installed;
                if (filter === "available") return !e.installed;
                return true;
            })
            .filter((e) => {
                if (!search) return true;
                return (
                    e.name.toLowerCase().includes(search.toLowerCase()) ||
                    (e.comment || "").toLowerCase().includes(search.toLowerCase())
                );
            });
    }, [extensions, filter, search]);

    // Group by category
    const grouped = useMemo(() => {
        const cats = {};
        for (const ext of visible) {
            const { cat, icon } = EXT_CATEGORIES[ext.name] || { cat: "Other", icon: "🧩" };
            if (!cats[cat]) cats[cat] = { icon, exts: [] };
            cats[cat].exts.push(ext);
        }
        return cats;
    }, [visible]);

    const enabledCount = extensions.filter((e) => e.installed && EXT_CATEGORIES[e.name]).length;
    const totalCount = Object.keys(EXT_CATEGORIES).length;

    return (
        <div className="px-6 py-3 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
                         bg-clip-text text-transparent text-2xl font-outfit tracking-tighter">
                        Extensions
                    </h1>
                    <p className="text-white/50 text-sm mt-0.5">
                        {enabledCount} of {totalCount} extensions enabled · click to toggle
                    </p>
                </div>
                <button
                    onClick={fetchExtensions}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10
                     text-white/50 text-sm font-outfit hover:text-white hover:border-white/20 transition-all"
                >
                    <ArrowsClockwise size={15} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search extensions…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/10 bg-black/30
                       text-sm text-white/80 placeholder-white/25 font-outfit
                       focus:outline-none focus:border-zb-cyan/40"
                    />
                </div>

                {/* Filter tabs */}
                {[
                    { key: "all", label: "All" },
                    { key: "enabled", label: "Enabled" },
                    { key: "available", label: "Available" },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-2 rounded-xl border text-sm font-outfit transition-all
              ${filter === f.key
                                ? "border-zb-cyan/30 bg-zb-cyan/5 text-zb-cyan"
                                : "border-white/10 text-white/40 hover:text-white hover:border-white/20"}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Toast */}
            <Toast msg={toast} onDone={() => setToast(null)} />

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-zb-cyan/20 border-t-zb-cyan animate-spin" />
                </div>
            ) : visible.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-black/20 p-12 text-center">
                    <Cube size={40} weight="thin" className="text-white/15 mx-auto mb-3" />
                    <p className="text-white/30">No extensions match your search.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([cat, { icon, exts }]) => (
                        <div key={cat}>
                            {/* Category header */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg leading-none">{icon}</span>
                                <p className="text-xs font-medium text-white/40 uppercase tracking-wider font-outfit">{cat}</p>
                                <div className="flex-1 h-px bg-white/5" />
                                <p className="text-xs text-white/25">{exts.filter(e => e.installed).length}/{exts.length}</p>
                            </div>

                            {/* Extension cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {exts.map((ext) => {
                                    const isToggling = toggling === ext.name;
                                    return (
                                        <div
                                            key={ext.name}
                                            className={`group relative rounded-2xl border p-4 transition-all duration-200
                        ${ext.installed
                                                    ? "border-emerald-500/15 bg-emerald-500/[0.03] hover:border-emerald-500/30"
                                                    : "border-white/5 bg-black/10 hover:border-white/10 hover:bg-white/[0.02]"}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-mono text-white/80 truncate">{ext.name}</p>
                                                        {ext.installed && (
                                                            <span className="shrink-0 text-xs font-mono text-emerald-400/60">
                                                                v{ext.installed_version}
                                                            </span>
                                                        )}
                                                        {!ext.installed && ext.default_version && (
                                                            <span className="shrink-0 text-xs font-mono text-white/20">
                                                                v{ext.default_version}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-white/40 font-outfit leading-relaxed line-clamp-2">
                                                        {ext.comment || "No description available."}
                                                    </p>
                                                </div>

                                                {/* Toggle */}
                                                <button
                                                    onClick={() => handleToggle(ext)}
                                                    disabled={isToggling}
                                                    className={`shrink-0 mt-0.5 relative w-11 h-6 rounded-full border transition-all duration-300
                            ${ext.installed
                                                            ? "bg-emerald-500/70 border-emerald-500/50"
                                                            : "bg-white/5 border-white/10 hover:border-white/20"}
                            disabled:opacity-50`}
                                                >
                                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-all duration-300
                            ${ext.installed ? "left-[22px] bg-white" : "left-0.5 bg-white/40"}`}
                                                    />
                                                </button>
                                            </div>

                                            {/* Bottom status */}
                                            <div className="mt-3 flex items-center justify-between">
                                                <StatusBadge installed={ext.installed} />
                                                {isToggling && (
                                                    <span className="text-xs text-white/30 font-outfit animate-pulse">
                                                        {ext.installed ? "Disabling…" : "Enabling…"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
