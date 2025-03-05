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

function App() {
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
              <nav className="space-x-8 font-outfit">
                <Link
                  to="/"
                  className="text-white/80 hover:text-zb-cyan transition duration-200"
                >
                  Projects
                </Link>
                {/* <Link
                  to="/about"
                  className="text-white/80 hover:text-zb-cyan transition duration-200"
                >
                  About
                </Link> */}
                <Link
                  to="/docs"
                  className="text-white/80 hover:text-zb-cyan transition duration-200"
                >
                  Docs
                </Link>
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
