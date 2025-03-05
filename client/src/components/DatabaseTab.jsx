import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import CustomButton from "./CustomButton";
import CustomDialog from "./CustomDialog";
import CustomInput from "./CustomInput";
import CustomSelect from "./CustomSelect";

export default function DatabaseTab() {
  const { projectId } = useOutletContext();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [openTableDialog, setOpenTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [newColumn, setNewColumn] = useState({ name: "", type: "text" });

  const fetchTables = async () => {
    try {
      const response = await fetch(`/api/db/tables?projectId=${projectId}`);
      const data = await response.json();
      setTables(
        data.tables.filter(
          (t) => !["auth_users", "logs"].includes(t.table_name)
        )
      );
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [projectId]);

  const handleTableClick = (tableName) => {
    navigate(`/projects/${projectId}/collections/${tableName}`);
  };

  const handleCreateTable = async () => {
    try {
      const response = await fetch(`/api/db/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, tableName: newTableName }),
      });
      if (!response.ok) throw new Error("Failed to create table");
      setNewTableName("");
      setOpenTableDialog(false);
      await fetchTables();
    } catch (err) {
      console.error("Error creating table:", err);
    }
  };

  const handleDeleteTable = async (tableName) => {
    try {
      const response = await fetch(
        `/api/db/tables/${tableName}?projectId=${projectId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete table");
      await fetchTables();
    } catch (err) {
      console.error("Error deleting table:", err);
    }
  };

  const handleAddColumn = async () => {
    try {
      const response = await fetch(`/api/db/tables/${selectedTable}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: newColumn.name,
          type: newColumn.type.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add column");
      }

      await fetchTables();
      setSelectedTable(null);
      setNewColumn({ name: "", type: "text" });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const dataTypeOptions = [
    { value: "text", label: "Text" },
    { value: "integer", label: "Integer" },
    { value: "boolean", label: "Boolean" },
    { value: "timestamp", label: "Timestamp" },
    { value: "float", label: "Float" },
    { value: "json", label: "JSON" },
  ];

  return (
    <Container maxWidth="lg">
      <Box className="flex justify-between items-center mb-6">
        <h1 className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-clip-text text-transparent text-2xl font-outfit tracking-tighter">
          Database Management
        </h1>
        <CustomButton onClick={() => setOpenTableDialog(true)}>
          <Add className="mr-2 text-white" />
          Create Table
        </CustomButton>
      </Box>

      {/* Tables List */}
      <div
        className="backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 overflow-hidden
                    shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
      >
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
              {["Table Name", "Columns", "Actions"].map((header) => (
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
            {tables.map((table) => (
              <TableRow
                key={table.table_name}
                className="border-b border-zb-cyan/10 hover:bg-zb-cyan/5 transition-colors duration-200"
                onClick={() => handleTableClick(table.table_name)}
                sx={{ "&:hover": { backgroundColor: "rgba(20,252,241,0.05)" } }}
              >
                <TableCell className="text-white font-outfit !border-zb-cyan/10">
                  {table.table_name}
                </TableCell>
                <TableCell className="text-white/70 !border-zb-cyan/10">
                  {table.columns.map((col) => (
                    <span
                      key={col.column_name}
                      className="inline-block px-2 py-1 m-1 rounded-md bg-zb-cyan/10 text-zb-cyan-light font-medium text-sm border border-zb-cyan/20"
                    >
                      {col.column_name}
                    </span>
                  ))}
                </TableCell>
                <TableCell className="!border-zb-cyan/10">
                  <div className="flex gap-2">
                    <CustomButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTable(table.table_name);
                      }}
                      className="!px-3 !py-1 text-sm"
                    >
                      Add Column
                    </CustomButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.table_name);
                      }}
                      className="text-zb-cyan hover:text-zb-cyan-light"
                      sx={{
                        color: "rgb(20,252,241)",
                        "&:hover": { color: "rgb(124,255,249)" },
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Table Dialog */}
      <CustomDialog
        open={openTableDialog}
        onClose={() => setOpenTableDialog(false)}
        title="Create New Table"
        onConfirm={handleCreateTable}
        confirmText="Create"
      >
        <CustomInput
          autoFocus
          label="Table Name"
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
        />
      </CustomDialog>

      {/* Add Column Dialog */}
      <CustomDialog
        open={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        title={`Add Column to ${selectedTable}`}
        onConfirm={handleAddColumn}
        confirmText="Add Column"
      >
        <div className="space-y-4">
          <CustomInput
            label="Column Name"
            value={newColumn.name}
            onChange={(e) =>
              setNewColumn({ ...newColumn, name: e.target.value })
            }
          />
          <CustomSelect
            label="Data Type"
            value={newColumn.type}
            onChange={(e) =>
              setNewColumn({ ...newColumn, type: e.target.value })
            }
            options={dataTypeOptions}
          />
        </div>
      </CustomDialog>
    </Container>
  );
}
