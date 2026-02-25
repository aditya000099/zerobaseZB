import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Lightning, WifiHigh, Table, ArrowClockwise } from "@phosphor-icons/react";

export default function RealtimeTab() {
    const { projectId } = useOutletContext();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/realtime/stats");
            const data = await res.json();
            setStats(data[projectId] || { connections: 0, tables: {} });
        } catch {
            setStats({ connections: 0, tables: {} });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const iv = setInterval(fetchStats, 5000);
        return () => clearInterval(iv);
    }, [projectId]);

    const tableEntries = stats ? Object.entries(stats.tables) : [];

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Lightning size={24} weight="fill" className="text-zb-cyan" />
                    <h2
                        className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                        bg-clip-text text-transparent text-2xl font-outfit tracking-tighter"
                    >
                        Realtime
                    </h2>
                </div>
                <button
                    onClick={fetchStats}
                    className="p-2 rounded-lg text-white/60 hover:text-zb-cyan hover:bg-zb-cyan/10 transition-all"
                >
                    <ArrowClockwise size={20} />
                </button>
            </div>

            {loading ? (
                <p className="text-white/40 font-outfit">Loading…</p>
            ) : (
                <div className="space-y-4">
                    {/* Connection card */}
                    <div className="backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 p-5
                          shadow-glow-sm hover:shadow-glow-md transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                ${stats.connections > 0
                                    ? "bg-emerald-500/10 border border-emerald-500/20"
                                    : "bg-white/5 border border-white/10"
                                }`}>
                                <WifiHigh
                                    size={22}
                                    weight="bold"
                                    className={stats.connections > 0 ? "text-emerald-400" : "text-white/40"}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="text-white/60 text-xs font-outfit tracking-wider uppercase">
                                    Active Connections
                                </p>
                                <p className="text-2xl font-outfit font-bold text-white mt-0.5">
                                    {stats.connections}
                                </p>
                            </div>
                            {stats.connections > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium border
                                 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                    Live
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Subscribed tables */}
                    <div className="backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 p-5
                          shadow-glow-sm hover:shadow-glow-md transition-all duration-300">
                        <div className="flex items-center gap-2 mb-4">
                            <Table size={18} className="text-white/40" />
                            <span className="text-xs font-outfit font-medium tracking-wider uppercase text-white/50">
                                Subscribed Tables
                            </span>
                        </div>
                        {tableEntries.length === 0 ? (
                            <p className="text-white/30 text-sm font-outfit">No active subscriptions</p>
                        ) : (
                            <div className="space-y-2">
                                {tableEntries.map(([name, count]) => (
                                    <div
                                        key={name}
                                        className="flex items-center justify-between rounded-xl bg-black/20 
                               border border-zb-cyan/10 px-4 py-3"
                                    >
                                        <span className="text-white/80 font-mono text-sm">{name}</span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border
                                     bg-zb-cyan/10 text-zb-cyan border-zb-cyan/20">
                                            {count} sub{count !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SDK quick start */}
                    <div className="backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 p-5
                          shadow-glow-sm hover:shadow-glow-md transition-all duration-300">
                        <span className="text-xs font-outfit font-medium tracking-wider uppercase text-white/50 block mb-3">
                            Quick Start
                        </span>
                        <pre className="bg-black/40 text-zb-cyan/80 rounded-xl p-4 text-xs overflow-x-auto
                            border border-zb-cyan/10 font-mono leading-relaxed">{`import { ZeroBaseClient, RealtimeClient } from "zerobase";

const client = new ZeroBaseClient(projectId, url, apiKey);
const rt = new RealtimeClient(client);
await rt.connect();

rt.subscribe("my_table", (event, data) => {
  console.log(event, data); // "INSERT", { id: 1, ... }
});`}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}
