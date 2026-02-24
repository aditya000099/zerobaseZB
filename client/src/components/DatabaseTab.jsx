import { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Table,
  Plus,
  Trash,
  Lightning,
  CaretRight,
  X,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import CustomDialog from "./CustomDialog";
import CustomInput from "./CustomInput";

// ── Full Postgres type catalogue ──────────────────────────────────────────────
const PG_TYPE_GROUPS = [
  {
    group: "Text",
    types: [
      { value: "TEXT", label: "text — unlimited string" },
      { value: "VARCHAR(255)", label: "varchar(255) — variable length" },
      { value: "CHAR(1)", label: "char(n) — fixed length" },
    ],
  },
  {
    group: "Numeric",
    types: [
      { value: "INTEGER", label: "integer — 4-byte int" },
      { value: "BIGINT", label: "bigint — 8-byte int" },
      { value: "SMALLINT", label: "smallint — 2-byte int" },
      { value: "SERIAL", label: "serial — auto-increment int" },
      { value: "BIGSERIAL", label: "bigserial — auto-increment bigint" },
      { value: "NUMERIC(10,2)", label: "numeric(p,s) — exact decimal" },
      { value: "REAL", label: "real — 4-byte float" },
      { value: "DOUBLE PRECISION", label: "double precision — 8-byte float" },
    ],
  },
  {
    group: "Date & Time",
    types: [
      { value: "TIMESTAMP", label: "timestamp — date + time" },
      { value: "TIMESTAMPTZ", label: "timestamptz — with timezone" },
      { value: "DATE", label: "date — calendar date" },
      { value: "TIME", label: "time — time of day" },
      { value: "INTERVAL", label: "interval — time span" },
    ],
  },
  {
    group: "Boolean & Binary",
    types: [
      { value: "BOOLEAN", label: "boolean — true/false" },
      { value: "BYTEA", label: "bytea — binary data" },
    ],
  },
  {
    group: "JSON & UUID",
    types: [
      { value: "JSONB", label: "jsonb — binary JSON (indexed)" },
      { value: "JSON", label: "json — plain JSON" },
      { value: "UUID", label: "uuid — universally unique id" },
    ],
  },
  {
    group: "Network",
    types: [
      { value: "INET", label: "inet — IPv4/v6 address" },
      { value: "CIDR", label: "cidr — network address" },
      { value: "MACADDR", label: "macaddr — MAC address" },
    ],
  },
];

const INDEX_METHODS = [
  { value: "btree", label: "B-tree (default — equality, ranges, sorting)" },
  { value: "hash", label: "Hash (fast equality only)" },
  { value: "gin", label: "GIN (JSONB, arrays, full-text search)" },
  { value: "gist", label: "GiST (geometric, range types)" },
  { value: "brin", label: "BRIN (large tables, naturally ordered)" },
  { value: "spgist", label: "SP-GiST (partitioned structures)" },
];

// ── Small reusable components ─────────────────────────────────────────────────
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
      ${ok ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
        : "border-red-500/30 bg-red-500/5 text-red-400"}`}>
      {msg.text}
    </div>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-mono border ${className}`}>
      {children}
    </span>
  );
}

function IconBtn({ onClick, icon, danger }) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all
        ${danger
          ? "text-white/30 hover:text-red-400 hover:bg-red-500/10"
          : "text-white/30 hover:text-white hover:bg-white/10"}`}
    >
      {icon}
    </button>
  );
}

// ── TypeSelect component ──────────────────────────────────────────────────────
function TypeSelect({ value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-white/50 font-outfit">Data Type</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zb-cyan/20 bg-black/40 px-3 py-2
                   text-sm text-white/80 font-mono focus:outline-none focus:border-zb-cyan/50
                   appearance-none cursor-pointer"
      >
        {PG_TYPE_GROUPS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.types.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ── IndexPanel — shown in a side-sheet when viewing a table's indexes ─────────
function IndexPanel({ projectId, tableName, columns, onClose }) {
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ cols: [], method: "btree", unique: false });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (type, text) => setToast({ type, text });

  const fetchIndexes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/tables/${tableName}/indexes?projectId=${projectId}`);
      const data = await res.json();
      setIndexes(data.indexes || []);
    } catch { setIndexes([]); }
    finally { setLoading(false); }
  }, [projectId, tableName]);

  useEffect(() => { fetchIndexes(); }, [fetchIndexes]);

  const toggleCol = (col) => {
    setForm((f) => ({
      ...f,
      cols: f.cols.includes(col) ? f.cols.filter((c) => c !== col) : [...f.cols, col],
    }));
  };

  const handleCreate = async () => {
    if (!form.cols.length) { notify("err", "Select at least one column."); return; }
    setCreating(true);
    try {
      const res = await fetch(`/api/db/tables/${tableName}/indexes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, columns: form.cols, method: form.method, unique: form.unique }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify("ok", `Index "${data.indexName}" created.`);
      setForm({ cols: [], method: "btree", unique: false });
      fetchIndexes();
    } catch (err) { notify("err", err.message); }
    finally { setCreating(false); }
  };

  const handleDrop = async (indexName) => {
    if (!window.confirm(`Drop index "${indexName}"?`)) return;
    try {
      const res = await fetch(`/api/db/tables/${tableName}/indexes/${indexName}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify("ok", "Index dropped.");
      fetchIndexes();
    } catch (err) { notify("err", err.message); }
  };

  // User-visible column names (exclude id)
  const userCols = (columns || [])
    .map((c) => c.column_name)
    .filter((c) => c !== "id");

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[480px] flex flex-col
                    bg-black/80 backdrop-blur-2xl border-l border-zb-cyan/15
                    shadow-[−20px_0_60px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-zb-cyan">
            <Lightning size={18} weight="fill" />
            <span className="text-sm font-medium font-outfit">Indexes</span>
          </div>
          <p className="text-white/60 text-sm mt-0.5 font-mono">{tableName}</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 hide-scrollbar">
        {/* Toast */}
        <Toast msg={toast} onDone={() => setToast(null)} />

        {/* Existing indexes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Existing indexes ({indexes.length})
            </p>
            <button onClick={fetchIndexes} className="text-white/30 hover:text-white transition-colors">
              <ArrowsClockwise size={14} />
            </button>
          </div>

          {loading ? (
            <p className="text-white/30 text-sm">Loading…</p>
          ) : indexes.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
              <p className="text-white/30 text-sm">No indexes yet.</p>
              <p className="text-white/20 text-xs mt-0.5">Create one below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {indexes.map((idx) => (
                <div key={idx.indexname}
                  className="rounded-xl border border-white/5 bg-black/20 px-4 py-3
                             flex items-start justify-between group hover:border-zb-cyan/15 transition-all">
                  <div className="space-y-1.5">
                    <p className="text-sm font-mono text-white/70">{idx.indexname}</p>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(idx.columns) ? idx.columns : []).map((col) => (
                        <Pill key={col} className="border-zb-cyan/20 bg-zb-cyan/5 text-zb-cyan/70">{col}</Pill>
                      ))}
                      {idx.is_unique && (
                        <Pill className="border-amber-500/30 bg-amber-500/10 text-amber-400">UNIQUE</Pill>
                      )}
                      <Pill className="border-white/10 text-white/40">
                        {idx.indexdef?.match(/USING (\w+)/)?.[1]?.toUpperCase() || "BTREE"}
                      </Pill>
                    </div>
                  </div>
                  <IconBtn
                    onClick={() => handleDrop(idx.indexname)}
                    icon={<Trash size={15} weight="bold" />}
                    danger
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create index form */}
        <div className="rounded-xl border border-white/5 bg-black/10 p-4 space-y-4">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Create Index</p>

          {/* Column picker */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-outfit">Columns (select one or more)</label>
            <div className="flex flex-wrap gap-2">
              {userCols.length === 0 ? (
                <p className="text-white/30 text-xs">No columns available.</p>
              ) : userCols.map((col) => {
                const active = form.cols.includes(col);
                return (
                  <button key={col} onClick={() => toggleCol(col)}
                    className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all
                      ${active
                        ? "border-zb-cyan/40 bg-zb-cyan/10 text-zb-cyan"
                        : "border-white/10 bg-black/20 text-white/40 hover:border-white/20 hover:text-white/70"}`}>
                    {col}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method */}
          <div className="space-y-1">
            <label className="text-xs text-white/50 font-outfit">Index Method</label>
            <select
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              className="w-full rounded-xl border border-zb-cyan/20 bg-black/40 px-3 py-2
                         text-sm text-white/80 font-outfit focus:outline-none focus:border-zb-cyan/50 appearance-none"
            >
              {INDEX_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Unique toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-200
                            ${form.unique ? "bg-zb-cyan/70" : "bg-white/10"}`}
              onClick={() => setForm((f) => ({ ...f, unique: !f.unique }))}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
                              transition-transform duration-200 ${form.unique ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-sm text-white/60 font-outfit">UNIQUE index</span>
          </label>

          <button onClick={handleCreate} disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                       border border-zb-cyan/30 bg-zb-cyan/5 text-zb-cyan text-sm font-outfit
                       hover:bg-zb-cyan/10 hover:border-zb-cyan/50 transition-all disabled:opacity-50">
            <Lightning size={16} weight="fill" />
            {creating ? "Creating…" : "Create Index"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main DatabaseTab ──────────────────────────────────────────────────────────
export default function DatabaseTab() {
  const { projectId } = useOutletContext();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const notify = (type, text) => setToast({ type, text });

  // Dialogs
  const [createTableOpen, setCreateTableOpen] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [addColTable, setAddColTable] = useState(null); // tableName string
  const [newCol, setNewCol] = useState({ name: "", type: "TEXT" });
  const [indexTable, setIndexTable] = useState(null); // full table object

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/tables?projectId=${projectId}`);
      const data = await res.json();
      setTables((data.tables || []).filter(
        (t) => !["auth_users", "logs"].includes(t.table_name)
      ));
    } catch (err) { notify("err", err.message); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleCreateTable = async () => {
    try {
      const res = await fetch("/api/db/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, tableName: newTableName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewTableName("");
      setCreateTableOpen(false);
      notify("ok", `Table "${newTableName}" created.`);
      fetchTables();
    } catch (err) { notify("err", err.message); }
  };

  const handleDeleteTable = async (tableName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Drop table "${tableName}"? This is irreversible.`)) return;
    try {
      const res = await fetch(`/api/db/tables/${tableName}?projectId=${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      notify("ok", `Table "${tableName}" dropped.`);
      fetchTables();
    } catch (err) { notify("err", err.message); }
  };

  const handleAddColumn = async () => {
    try {
      const res = await fetch(`/api/db/tables/${addColTable}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: newCol.name, type: newCol.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify("ok", `Column "${newCol.name}" added.`);
      setAddColTable(null);
      setNewCol({ name: "", type: "TEXT" });
      fetchTables();
    } catch (err) { notify("err", err.message); }
  };

  return (
    <div className="px-6 py-3 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]
                         bg-clip-text text-transparent text-2xl font-outfit tracking-tighter">
            Database
          </h1>
          <p className="text-white/50 text-sm mt-0.5">
            Manage tables, columns, and indexes.
          </p>
        </div>
        <button
          onClick={() => setCreateTableOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zb-cyan/30
                     bg-zb-cyan/5 text-zb-cyan text-sm font-outfit
                     hover:bg-zb-cyan/10 hover:border-zb-cyan/50 transition-all"
        >
          <Plus size={16} weight="bold" /> Create Table
        </button>
      </div>

      {/* Toast */}
      <Toast msg={toast} onDone={() => setToast(null)} />

      {/* Tables */}
      {loading ? (
        <p className="text-white/30 text-sm">Loading…</p>
      ) : tables.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-black/20 p-12 text-center">
          <Table size={40} weight="thin" className="text-white/15 mx-auto mb-3" />
          <p className="text-white/30">No tables yet.</p>
          <p className="text-white/20 text-xs mt-1">Create your first table above.</p>
        </div>
      ) : (
        <div className="backdrop-blur-md bg-black/20 rounded-2xl border border-zb-cyan/10 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_2fr_auto] border-b border-white/5 px-5 py-3">
            {["Table", "Columns", "Actions"].map((h) => (
              <span key={h} className="text-xs font-medium text-white/40 uppercase tracking-wider font-outfit">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {tables.map((table) => (
              <div
                key={table.table_name}
                className="grid grid-cols-[1fr_2fr_auto] items-center px-5 py-4
                           hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => navigate(`/projects/${projectId}/collections/${table.table_name}`)}
              >
                {/* Name */}
                <div className="flex items-center gap-2">
                  <Table size={16} className="text-zb-cyan/60 shrink-0" weight="fill" />
                  <span className="text-sm font-medium text-white/80 font-mono">{table.table_name}</span>
                  <CaretRight size={14} className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Columns */}
                <div className="flex flex-wrap gap-1">
                  {table.columns.slice(0, 8).map((col) => (
                    <Pill key={col.column_name}
                      className="border-white/10 text-white/50">
                      <span className="text-white/70">{col.column_name}</span>
                      <span className="text-white/25 ml-1">{col.udt_name || col.data_type}</span>
                    </Pill>
                  ))}
                  {table.columns.length > 8 && (
                    <Pill className="border-white/10 text-white/30">+{table.columns.length - 8} more</Pill>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setAddColTable(table.table_name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10
                               text-xs text-white/50 hover:text-white hover:border-white/20
                               font-outfit transition-all"
                  >
                    <Plus size={12} weight="bold" /> Column
                  </button>
                  <button
                    onClick={() => setIndexTable(table)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/10
                               text-xs text-white/50 hover:text-zb-cyan hover:border-zb-cyan/30
                               font-outfit transition-all"
                  >
                    <Lightning size={12} weight="fill" /> Indexes
                  </button>
                  <IconBtn
                    onClick={(e) => handleDeleteTable(table.table_name, e)}
                    icon={<Trash size={15} weight="bold" />}
                    danger
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Create Table dialog ────────────────────────────────────────────── */}
      <CustomDialog
        open={createTableOpen}
        onClose={() => { setCreateTableOpen(false); setNewTableName(""); }}
        title="Create Table"
        onConfirm={handleCreateTable}
        confirmText="Create"
      >
        <div className="space-y-3">
          <CustomInput
            autoFocus
            label="Table Name"
            placeholder="e.g. products"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
          />
          <p className="text-xs text-white/30">
            An <code className="text-zb-cyan/70">id SERIAL PRIMARY KEY</code> column is added automatically.
          </p>
        </div>
      </CustomDialog>

      {/* ── Add Column dialog ──────────────────────────────────────────────── */}
      <CustomDialog
        open={!!addColTable}
        onClose={() => { setAddColTable(null); setNewCol({ name: "", type: "TEXT" }); }}
        title={`Add Column — ${addColTable}`}
        onConfirm={handleAddColumn}
        confirmText="Add Column"
      >
        <div className="space-y-4">
          <CustomInput
            autoFocus
            label="Column Name"
            placeholder="e.g. email"
            value={newCol.name}
            onChange={(e) => setNewCol({ ...newCol, name: e.target.value })}
          />
          <TypeSelect
            value={newCol.type}
            onChange={(type) => setNewCol({ ...newCol, type })}
          />
        </div>
      </CustomDialog>

      {/* ── Index side panel ───────────────────────────────────────────────── */}
      {indexTable && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setIndexTable(null)}
          />
          <IndexPanel
            projectId={projectId}
            tableName={indexTable.table_name}
            columns={indexTable.columns}
            onClose={() => setIndexTable(null)}
          />
        </>
      )}
    </div>
  );
}
