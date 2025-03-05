import React from "react";
import { Link } from "react-router-dom";
import {
  ChartPie,
  Database,
  Users,
  HardDrives,
  Code,
} from "@phosphor-icons/react";

const sections = [
  {
    title: "Getting Started",
    icon: <Code weight="fill" className="text-emerald-400" />,
    description: "Quick setup guide and installation",
    path: "/docs/getting-started",
    items: [
      { title: "Installation", path: "/docs/getting-started#installation" },
      { title: "Project Setup", path: "/docs/getting-started#project-setup" },
      { title: "Authentication", path: "/docs/getting-started#authentication" },
    ],
  },
  {
    title: "Database",
    icon: <Database weight="fill" className="text-blue-400" />,
    description: "Database operations and management",
    path: "/docs/database",
    items: [
      { title: "Collections", path: "/docs/database#collections" },
      { title: "Documents", path: "/docs/database#documents" },
      { title: "Queries", path: "/docs/database#queries" },
    ],
  },
  {
    title: "Authentication",
    icon: <Users weight="fill" className="text-purple-400" />,
    description: "User management and auth flows",
    path: "/docs/auth",
    items: [
      { title: "User Management", path: "/docs/auth#users" },
      { title: "OAuth Integration", path: "/docs/auth#oauth" },
      { title: "Sessions", path: "/docs/auth#sessions" },
    ],
  },
  {
    title: "Storage",
    icon: <HardDrives weight="fill" className="text-amber-400" />,
    description: "File storage and management",
    path: "/docs/storage",
    items: [
      { title: "File Upload", path: "/docs/storage#upload" },
      { title: "File Management", path: "/docs/storage#management" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-outfit font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Documentation
        </h1>
        <p className="text-white/60 mt-2">
          Comprehensive guides and API references for ZeroBase SDK
        </p>
      </div>

      {/* Code Example */}
      <div className="mb-12 backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code weight="fill" className="text-zb-cyan" size={24} />
          <h2 className="text-xl font-outfit text-white">Quick Start</h2>
        </div>
        <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
          <code className="text-white/90 font-mono text-sm">
            {`import { ZeroBaseClient, DatabaseClient, AuthClient } from '@zerobase/sdk';

const client = new ZeroBaseClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key'
});

// Initialize services
const db = new DatabaseClient(client);
const auth = new AuthClient(client);

// Use the SDK
await db.createCollection('users');
await auth.createUser({
  email: 'user@example.com',
  password: 'password123'
});`}
          </code>
        </pre>
      </div>

      {/* Documentation Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <Link
            key={section.title}
            to={section.path}
            className="group backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 p-6
                     hover:shadow-glow-md transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              {section.icon}
              <h3 className="text-xl font-outfit text-white group-hover:text-zb-cyan-light transition-colors">
                {section.title}
              </h3>
            </div>
            <p className="text-white/60 mb-4">{section.description}</p>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.title} className="text-sm">
                  <Link
                    to={item.path}
                    className="text-zb-cyan/80 hover:text-zb-cyan hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}
