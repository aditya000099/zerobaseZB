import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import CustomButton from "./CustomButton";

export default function CreateUser() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
  });

  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...newUser,
        }),
      });

      if (!response.ok) throw new Error("Failed to create user");
      navigate(`/projects/${projectId}/auth`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = () => {
    navigate(`/projects/${projectId}/auth`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2
            className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                         bg-clip-text text-transparent text-2xl font-outfit tracking-tighter"
          >
            Create New User
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Add a new user to your authentication system
          </p>
        </div>
      </div>

      <div
        className="backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 p-6
                    shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
      >
        <div className="space-y-4">
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="bg-black/20 rounded-lg"
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "rgba(20,252,241,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(20,252,241,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(20,252,241,0.6)",
                },
              },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
            }}
          />

          <TextField
            label="Name"
            fullWidth
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "rgba(20,252,241,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(20,252,241,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(20,252,241,0.6)",
                },
              },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
            }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": { borderColor: "rgba(20,252,241,0.2)" },
                "&:hover fieldset": { borderColor: "rgba(20,252,241,0.4)" },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(20,252,241,0.6)",
                },
              },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.7)" },
            }}
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleCancel}
            className="text-white/70 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <CustomButton onClick={handleCreateUser}>Create User</CustomButton>
        </div>
      </div>
    </div>
  );
}
