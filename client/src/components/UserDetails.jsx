import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from "@mui/material";

export default function UserDetails() {
  const { projectId, userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [projectId, userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(
        `/api/db/tables/auth_users/documents?projectId=${projectId}`
      );
      const data = await response.json();
      const foundUser = data.documents.find((u) => u.id === parseInt(userId));
      setUser(foundUser || null);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await fetch(`/api/db/tables/auth_users/documents/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          document: user,
        }),
      });
      alert("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/db/tables/auth_users/documents/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      navigate(`/projects/${projectId}/auth`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user");
    }
    setOpenDialog(false);
  };

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          User Details
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Email"
            value={user.email || ""}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            fullWidth
          />

          <TextField
            label="Name"
            value={user.name || ""}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={user.email_verified || false}
                onChange={(e) =>
                  setUser({ ...user, email_verified: e.target.checked })
                }
              />
            }
            label="Email Verified"
          />

          <FormControlLabel
            control={
              <Switch
                checked={user.status === "active"}
                onChange={(e) =>
                  setUser({
                    ...user,
                    status: e.target.checked ? "active" : "inactive",
                  })
                }
              />
            }
            label="Active Status"
          />

          <TextField
            label="Phone"
            value={user.phone || ""}
            onChange={(e) => setUser({ ...user, phone: e.target.value })}
            fullWidth
          />

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleUpdate}>
              Save Changes
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={() => setOpenDialog(true)}
            >
              Delete User
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this user? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
