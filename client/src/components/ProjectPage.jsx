import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ListItemIcon,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Add,
  Delete,
  Storage,
  Person,
  Folder,
  Assessment,
} from "@mui/icons-material";
import AuthTab from "./AuthPage";
import LogsTab from "./LogsTab"; // Add this import
import CustomButton from "./CustomButton";
import SidebarNav from "./SidebarNav";

export default function ProjectPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  // Move these states to DatabaseTab
  // const [tables, setTables] = useState([]);
  // const [openTableDialog, setOpenTableDialog] = useState(false);
  // const [newTableName, setNewTableName] = useState("");
  // const [selectedTable, setSelectedTable] = useState(null);
  // const [newColumn, setNewColumn] = useState({ name: "", type: "text" });

  // Get active view from current path
  const activeView = location.pathname.split("/").pop();

  // Update navigation handler
  const handleViewChange = (view) => {
    navigate(`/projects/${projectId}/${view}`);
  };

  const handleTableClick = (tableName) => {
    navigate(`/projects/${projectId}/collections/${tableName}`);
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProject();
  }, [projectId]);

  // Add this useEffect hook in your ProjectPage component
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await fetch("/api/auth/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
      } catch (err) {
        console.error("Error initializing auth:", err);
      }
    };

    if (projectId) {
      initializeAuth();
    }
  }, [projectId]);

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          Error loading project: {error}
        </Alert>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <SidebarNav
        activeView={activeView}
        onViewChange={handleViewChange}
        projectName={project?.name}
      />

      <Box component="main" className="flex-grow pl-60 bg-transparent">
        <Outlet context={{ projectId }} />{" "}
        {/* Pass projectId to child routes */}
      </Box>
    </Box>
  );
}
