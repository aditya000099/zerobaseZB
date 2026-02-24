import React from "react";
import {
  ChartPie,
  Database,
  Cube,
  Users,
  HardDrives,
  TextAlignLeft,
  GearSix,
} from "@phosphor-icons/react";

const NavItem = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200
      font-outfit text-base
      ${isActive
        ? "bg-gradient-to-r from-zb-cyan/20 to-zinc-800/50 border border-zb-cyan/20 text-white shadow-[0_4px_10px_rgba(20,252,241,0.1)]"
        : "text-white/70 hover:bg-zinc-800/30 hover:text-white"
      }
    `}
  >
    <span className={isActive ? "text-zb-cyan" : "text-white/70"}>{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const SidebarNav = ({ activeView, onViewChange, projectName }) => {
  const navItems = [
    {
      icon: <ChartPie size={24} weight="fill" />,
      label: "Overview",
      view: "overview",
    },
    {
      icon: <Database size={24} weight="fill" />,
      label: "Database",
      view: "database",
    },
    {
      icon: <Cube size={24} weight="fill" />,
      label: "Extensions",
      view: "extensions",
    },
    {
      icon: <Users size={24} weight="fill" />,
      label: "Authentication",
      view: "auth",
    },
    {
      icon: <HardDrives size={24} weight="fill" />,
      label: "Storage",
      view: "storage",
    },
    {
      icon: <TextAlignLeft size={24} weight="fill" />,
      label: "Logs",
      view: "logs",
    },
    {
      icon: <GearSix size={24} weight="fill" />,
      label: "Settings",
      view: "settings",
    },
  ];

  return (
    <div className="fixed top-16 left-0 w-60 h-[calc(100vh-64px)] bg-black/30 backdrop-blur-xl border-r border-zb-cyan/10">
      <div className="p-6 space-y-6">
        <h2
          className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                      bg-clip-text text-transparent font-outfit text-2xl font-black
                      after:content-[''] after:block after:mt-2 after:h-px 
                      after:bg-gradient-to-r after:from-transparent after:via-zb-cyan/30 after:to-transparent"
        >
          {projectName?.toUpperCase()}
        </h2>

        <nav className="space-y-3">
          {navItems.map((item) => (
            <NavItem
              key={item.view}
              {...item}
              isActive={activeView === item.view}
              onClick={() => onViewChange(item.view)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SidebarNav;
