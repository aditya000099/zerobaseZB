import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import CustomButton from "./CustomButton";

const statusColors = {
  200: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  201: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  400: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  401: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  403: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  404: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  500: "bg-red-500/10 text-red-400 border-red-500/20",
};

const methodColors = {
  GET: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  POST: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
};

const LogsTab = () => {
  const { projectId } = useOutletContext();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    status: "all",
    endpoint: "",
    method: "all",
  });
  const limit = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const response = await fetch(
        `/api/logs?projectId=${projectId}&limit=100&offset=${offset}`
      );
      const data = await response.json();
      // Ensure data is an array
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever logs or filter changes
  useEffect(() => {
    let filtered = [...logs];

    // Filter by status
    if (filter.status !== "all") {
      filtered = filtered.filter((log) => {
        switch (filter.status) {
          case "success":
            return log.status < 400;
          case "error":
            return log.status >= 500;
          case "warning":
            return log.status >= 400 && log.status < 500;
          default:
            return true;
        }
      });
    }

    // Filter by method
    if (filter.method !== "all") {
      filtered = filtered.filter((log) => log.method === filter.method);
    }

    // Filter by endpoint
    if (filter.endpoint) {
      const searchTerm = filter.endpoint.toLowerCase();
      filtered = filtered.filter((log) =>
        log.endpoint.toLowerCase().includes(searchTerm)
      );
    }

    // Update filtered logs and reset pagination if needed
    setFilteredLogs(filtered);
    if (page > Math.ceil(filtered.length / limit)) {
      setPage(1);
    }
  }, [logs, filter, limit]);

  // Get current page logs
  const getCurrentPageLogs = () => {
    const startIndex = (page - 1) * limit;
    return filteredLogs.slice(startIndex, startIndex + limit);
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Fixed Header */}
      <div className="flex justify-between items-center mb-6">
        <h2
          className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                      bg-clip-text text-transparent text-2xl font-outfit tracking-tighter"
        >
          System Logs
        </h2>
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          className="text-white/70 hover:text-zb-cyan transition-colors"
        >
          <Refresh />
        </IconButton>
      </div>

      {/* Updated Filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <FormControl>
          <InputLabel className="text-white/70">Status</InputLabel>
          <Select
            value={filter.status}
            label="Status"
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="rounded-lg bg-black/20"
            sx={{
              color: "white",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(20,252,241,0.2)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(20,252,241,0.4)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(20,252,241,0.6)",
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="success">Success (2xx)</MenuItem>
            <MenuItem value="warning">Warning (4xx)</MenuItem>
            <MenuItem value="error">Error (5xx)</MenuItem>
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel className="text-white/70">Method</InputLabel>
          <Select
            value={filter.method}
            label="Method"
            onChange={(e) => setFilter({ ...filter, method: e.target.value })}
            className="rounded-lg bg-black/20"
            sx={{
              color: "white",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(20,252,241,0.2)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(20,252,241,0.4)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(20,252,241,0.6)",
              },
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </Select>
        </FormControl>

        <TextField
          size="small"
          label="Endpoint"
          value={filter.endpoint}
          onChange={(e) => setFilter({ ...filter, endpoint: e.target.value })}
          placeholder="Search endpoint..."
          sx={{ minWidth: 200 }}
        />

        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">
            Showing {getCurrentPageLogs().length} of {filteredLogs.length} logs
          </span>
        </div>
      </div>

      {/* Scrollable Table Container with custom scrollbar */}
      <div
        className="flex-1 min-h-0 backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 overflow-hidden
                    shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
      >
        <div className="h-full overflow-auto custom-scrollbar">
          <Table
            sx={{
              "& .MuiTableCell-root": {
                color: "white",
                borderColor: "rgba(20,252,241,0.1)",
              },
            }}
          >
            <TableHead>
              <TableRow className="border-b border-zb-cyan/20">
                {[
                  "Timestamp",
                  "Method",
                  "Endpoint",
                  "Status",
                  "Message",
                  "Metadata",
                ].map((header) => (
                  <TableCell key={header}>
                    <span
                      className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                                 bg-clip-text text-transparent font-outfit font-medium tracking-tighter"
                    >
                      {header}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {getCurrentPageLogs().map((log) => (
                <TableRow
                  key={log.id}
                  className={`border-b border-zb-cyan/10 transition-colors duration-200
                    ${
                      log.status >= 400 ? "bg-red-500/5" : "hover:bg-zb-cyan/5"
                    }`}
                >
                  <TableCell className="text-white/60 font-outfit">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        methodColors[log.method]
                      }`}
                    >
                      {log.method}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/80 font-outfit">
                    {log.endpoint}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        statusColors[log.status]
                      }`}
                    >
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/70 font-outfit">
                    {log.message}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={JSON.stringify(log.metadata, null, 2)}>
                      <IconButton className="text-zb-cyan hover:text-zb-cyan-light">
                        <span className="text-lg">ⓘ</span>
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Updated Pagination */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-2">
          {[...Array(Math.ceil(filteredLogs.length / limit))].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg font-outfit transition-all duration-200
                ${
                  page === i + 1
                    ? "bg-zb-cyan/20 text-zb-cyan border border-zb-cyan/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogsTab;
