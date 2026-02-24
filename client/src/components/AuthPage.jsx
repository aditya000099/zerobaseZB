import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from "@mui/material";
import { useNavigate, useOutletContext } from "react-router-dom";
import CustomButton from "./CustomButton";

export default function AuthTab() {
  const { projectId } = useOutletContext();
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `/api/db/tables/auth_users/documents?projectId=${projectId}`
      );
      const data = await response.json();
      setUsers(data.documents || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchUsers();
    }
  }, [projectId]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Fixed Header */}
      <Box className="flex justify-between items-center mb-6">
        <h2
          className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                      bg-clip-text text-transparent text-2xl font-outfit tracking-tighter"
        >
          Authentication Users
        </h2>
        <CustomButton
          onClick={() => navigate(`/projects/${projectId}/auth/new`)}
        >
          Create User
        </CustomButton>
      </Box>

      {/* Scrollable Table Container with custom scrollbar */}
      <div
        className="flex-1 min-h-0 backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 overflow-hidden
                    shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
      >
        <div className="h-full overflow-auto custom-scrollbar">
          <Table
            sx={{
              "& .MuiTableCell-root": {
                color: "rgb(255, 255, 255)",
                borderColor: "rgba(20,252,241,0.1)",
              },
            }}
          >
            <TableHead>
              <TableRow className="border-b border-zb-cyan/20">
                {[
                  "ID",
                  "Name",
                  "Email",
                  "Status",
                  "Verification",
                  "Last Login",
                  "Login Count",
                  "Created At",
                ].map((header) => (
                  <TableCell key={header} className="!text-white">
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
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() =>
                    navigate(`/projects/${projectId}/auth/${user.id}`)
                  }
                  className="border-b border-zb-cyan/10 hover:bg-zb-cyan/5 transition-colors duration-200 cursor-pointer"
                >
                  <TableCell className="!text-white/80 font-outfit">
                    {user.id}
                  </TableCell>
                  <TableCell className="!text-white/80 font-outfit">
                    {user.name || "N/A"}
                  </TableCell>
                  <TableCell className="!text-white/80 font-outfit">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block 
                    ${
                      user.status === "active"
                        ? "bg-zb-cyan/10 text-zb-cyan border border-zb-cyan/20"
                        : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    }`}
                    >
                      {user.status || "active"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium inline-block 
                    ${
                      user.email_verified
                        ? "bg-zb-cyan/10 text-zb-cyan border border-zb-cyan/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                    >
                      {user.email_verified ? "Verified" : "Unverified"}
                    </span>
                  </TableCell>
                  <TableCell className="!text-white/60 font-outfit">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="!text-white/60 font-outfit">
                    {user.login_count || 0}
                  </TableCell>
                  <TableCell className="!text-white/60 font-outfit">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleString()
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
