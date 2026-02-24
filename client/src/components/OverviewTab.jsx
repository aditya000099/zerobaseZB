import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Grid, Typography } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Database,
  Users,
  Table,
  ChartPie,
  Gear,
  Lightning,
  Clock,
  Target,
} from "@phosphor-icons/react";

export default function OverviewTab() {
  const { projectId } = useOutletContext();
  const [stats, setStats] = useState({
    collections: 0,
    totalDocuments: 0,
    authUsers: 0,
    logs: { successful: 0, unsuccessful: 0 },
    avgResponseTime: 0,
    lastActivity: null,
    mostUsedEndpoint: { endpoint: "", count: 0 },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch collections and documents count
        const [tablesResponse, usersResponse] = await Promise.all([
          fetch(`/api/db/tables?projectId=${projectId}`),
          fetch(`/api/db/tables/auth_users/documents?projectId=${projectId}`),
        ]);

        const tablesData = await tablesResponse.json();
        const usersData = await usersResponse.json();

        const collections = tablesData.tables.filter(
          (t) => !["auth_users", "logs"].includes(t.table_name)
        );

        // Fetch all documents count
        let documentCount = 0;
        for (const collection of collections) {
          const docsResponse = await fetch(
            `/api/db/tables/${collection.table_name}/documents?projectId=${projectId}`
          );
          const docsData = await docsResponse.json();
          documentCount += docsData.documents?.length || 0;
        }

        // Fetch all logs with pagination
        let allLogs = [];
        let offset = 0;
        const limit = 100; // Fetch in larger chunks

        while (true) {
          const logsResponse = await fetch(
            `/api/logs?projectId=${projectId}&limit=${limit}&offset=${offset}`
          );
          const logsData = await logsResponse.json();

          if (!Array.isArray(logsData) || logsData.length === 0) break;

          allLogs = [...allLogs, ...logsData];
          if (logsData.length < limit) break;
          offset += limit;
        }

        // Calculate logs statistics
        const successful = allLogs.filter((log) => log.status < 400).length;
        const unsuccessful = allLogs.filter((log) => log.status >= 400).length;

        // Calculate additional metrics
        const avgResponseTime =
          allLogs.reduce((acc, log) => acc + (log.response_time || 0), 0) /
          (allLogs.length || 1);

        // Find most used endpoint
        const endpointCounts = allLogs.reduce((acc, log) => {
          acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
          return acc;
        }, {});

        const mostUsedEndpoint =
          Object.entries(endpointCounts).sort(([, a], [, b]) => b - a)[0] || [];

        setStats({
          collections: collections.length,
          totalDocuments: documentCount,
          authUsers: usersData.documents?.length || 0,
          logs: { successful, unsuccessful },
          avgResponseTime: Math.round(avgResponseTime),
          lastActivity: allLogs[0]?.created_at,
          mostUsedEndpoint: {
            endpoint: mostUsedEndpoint[0] || "",
            count: mostUsedEndpoint[1] || 0,
          },
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, [projectId]);

  const statCards = [
    {
      title: "Collections",
      value: stats.collections,
      icon: <Table size={28} weight="fill" className="text-blue-400" />,
      gradient: "from-blue-400/10 to-transparent",
    },
    {
      title: "Documents",
      value: stats.totalDocuments,
      icon: <Database size={28} weight="fill" className="text-emerald-400" />,
      gradient: "from-emerald-400/10 to-transparent",
    },
    {
      title: "Users",
      value: stats.authUsers,
      icon: <Users size={28} weight="fill" className="text-purple-400" />,
      gradient: "from-purple-400/10 to-transparent",
    },
    {
      title: "API Success",
      value: `${Math.round(
        (stats.logs.successful /
          (stats.logs.successful + stats.logs.unsuccessful || 1)) *
          100
      )}%`,
      icon: <Target size={28} weight="fill" className="text-amber-400" />,
      gradient: "from-amber-400/10 to-transparent",
    },
  ];

  const insights = [
    {
      icon: <Lightning size={24} weight="fill" className="text-amber-400" />,
      title: "Quick Insight",
      text: `Your API has a ${
        stats.logs.successful > stats.logs.unsuccessful
          ? "healthy"
          : "concerning"
      } success rate.`,
    },
    {
      icon: <Clock size={24} weight="fill" className="text-emerald-400" />,
      title: "Response Time",
      text: `Average response time: ${stats.avgResponseTime || 0}ms`,
    },
    {
      icon: <Gear size={24} weight="fill" className="text-blue-400" />,
      title: "Most Used Endpoint",
      text: stats.mostUsedEndpoint?.endpoint
        ? `Most accessed: ${stats.mostUsedEndpoint.endpoint}`
        : "No endpoint data yet",
    },
  ];

  const logData = [
    { name: "Successful", value: stats.logs.successful, color: "#34D399" },
    { name: "Unsuccessful", value: stats.logs.unsuccessful, color: "#FB7185" },
  ];

  return (
    <div className="px-6 py-3">
      <h1
        className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                         bg-clip-text text-transparent text-2xl font-outfit tracking-tighter mb-6"
      >
        Project Overview
      </h1>

      <div className="flex gap-6">
        {/* Left Column - Stats and Insights */}
        <div className="flex-1 space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((card, index) => (
              <div
                key={index}
                className={`backdrop-blur-md bg-black/20 rounded-2xl border border-zb-cyan/10 p-4
                         transition-all duration-300 hover:border-zb-cyan/20
                         bg-gradient-to-r ${card.gradient}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-black/20">{card.icon}</div>
                  <div>
                    <p className="text-white/50 text-sm font-outfit">
                      {card.title}
                    </p>
                    <p className="text-white text-xl font-semibold font-outfit">
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Insights Section */}
          <div className="space-y-4">
            <h3 className="text-white/70 text-sm font-medium uppercase tracking-wider">
              Insights
            </h3>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="backdrop-blur-md bg-black/20 rounded-xl border border-zb-cyan/10 p-4
                              transition-all duration-300 hover:border-zb-cyan/20"
                >
                  <div className="flex items-center gap-3">
                    {insight.icon}
                    <div>
                      <p className="text-white/90 font-medium">
                        {insight.title}
                      </p>
                      <p className="text-white/60 text-sm">{insight.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Analytics Chart */}
        <div className="w-[400px]">
          <div
            className="backdrop-blur-md bg-black/20 rounded-2xl border border-zb-cyan/10 p-6
                       transition-all duration-300 hover:border-zb-cyan/20 h-full"
          >
            <h3 className="text-white/90 text-lg font-outfit mb-4">
              API Performance
            </h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={logData}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    strokeWidth={1}
                    stroke="rgba(20,252,241,0.1)"
                  >
                    {logData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      borderColor: "rgba(20,252,241,0.1)",
                      borderRadius: "0.5rem",
                      backdropFilter: "blur(8px)",
                    }}
                    itemStyle={{ color: "white" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
