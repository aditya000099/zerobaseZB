import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import ProjectList from "./components/ProjectList";
import ProjectPage from "./components/ProjectPage";
import UserDetails from "./components/UserDetails";
import CollectionView from "./components/CollectionView";
import NewDocument from "./components/NewDocument";
import CreateUser from "./components/CreateUser";
import DatabaseTab from "./components/DatabaseTab";
import AuthTab from "./components/AuthPage";
import StorageTab from "./components/StorageTab";
import LogsTab from "./components/LogsTab";
import OverviewTab from "./components/OverviewTab";
import DocsPage from "./components/DocsPage";
import DocContent from "./components/DocContent";
import SettingsTab from "./components/SettingsTab";
import ExtensionsTab from "./components/ExtensionsTab";
import RealtimeTab from "./components/RealtimeTab";

// ── Server health hook ─────────────────────────────────────────────────────
function useServerStatus() {
  const [status, setStatus] = React.useState("checking"); // 'ok' | 'degraded' | 'down' | 'checking'
  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/health", { signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        if (!cancelled) setStatus(data.status === "ok" ? "ok" : "degraded");
      } catch {
        if (!cancelled) setStatus("down");
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return status;
}

function App() {
  const serverStatus = useServerStatus();
  const statusConfig = {
    ok: { dot: "bg-emerald-400", glow: "shadow-[0_0_6px_rgba(52,211,153,0.8)]", label: "Online" },
    degraded: { dot: "bg-amber-400", glow: "shadow-[0_0_6px_rgba(251,191,36,0.8)]", label: "Degraded" },
    down: { dot: "bg-red-500", glow: "shadow-[0_0_6px_rgba(239,68,68,0.8)]", label: "Offline" },
    checking: { dot: "bg-white/30", glow: "", label: "Checking" },
  }[serverStatus];

  return (
    <Router>
      <div className="min-h-screen font-outfit bg-gradient-to-b from-black via-zb-gray-dark to-black">
        {/* Background Effect - Fixed */}
        <div className="fixed inset-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-zb-cyan/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-zb-cyan/5 blur-[120px]" />
          <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] rounded-full bg-zb-cyan/10 blur-[100px]" />
        </div>

        {/* App Layout */}
        <div className="relative flex flex-col min-h-screen">
          {/* Fixed Header */}
          <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/20 border-b border-zb-cyan/20">
            <div className="container mx-auto flex items-center justify-between px-6 h-16">
              <Link
                to="/"
                className="text-xl font-outfit font-semibold flex items-center"
              >
                <span className="text-zb-cyan-light">Zero</span>
                <span className="text-white/90">Base</span>
              </Link>
              <nav className="flex items-center space-x-8 font-outfit">
                <Link
                  to="/"
                  className="text-white/80 hover:text-zb-cyan transition duration-200"
                >
                  Projects
                </Link>
                <Link
                  to="/docs"
                  className="text-white/80 hover:text-zb-cyan transition duration-200"
                >
                  Docs
                </Link>
                {/* Server status pill */}
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot} ${statusConfig.glow}`} />
                  <span className="text-xs text-white/60 font-outfit">{statusConfig.label}</span>
                </div>
              </nav>
            </div>
          </header>

          {/* Main Content - Add top padding to account for fixed header */}
          <main className="flex-grow pt-16 relative z-10">
            <div className="container mx-auto px-6 py-8">
              <Routes>
                <Route path="/" element={<ProjectList />} />
                <Route path="/projects/:projectId" element={<ProjectPage />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<OverviewTab />} />
                  <Route path="database" element={<DatabaseTab />} />
                  <Route path="auth" element={<AuthTab />} />
                  <Route path="storage" element={<StorageTab />} />
                  <Route path="logs" element={<LogsTab />} />
                  <Route path="extensions" element={<ExtensionsTab />} />
                  <Route path="realtime" element={<RealtimeTab />} />
                  <Route path="settings" element={<SettingsTab />} />
                </Route>
                <Route
                  path="/projects/:projectId/auth/new"
                  element={<CreateUser />}
                />
                <Route
                  path="/projects/:projectId/auth/:userId"
                  element={<UserDetails />}
                />
                <Route
                  path="/projects/:projectId/collections/:collectionName"
                  element={<CollectionView />}
                />
                <Route
                  path="/projects/:projectId/collections/:collectionName/new"
                  element={<NewDocument />}
                />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/docs/:section" element={<DocContent />} />
              </Routes>
            </div>
          </main>

          {/* Footer */}
          {/* <footer className="relative z-10 text-zb-white/40 py-4 text-center text-sm font-outfit border-t border-zb-cyan/10 bg-black/20 backdrop-blur-md">
            <p>© {new Date().getFullYear()} ZeroBase. All rights reserved.</p>
          </footer> */}
        </div>
      </div>
    </Router>
  );
}

export default App;
