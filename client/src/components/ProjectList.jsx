import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Grid } from "@mui/material";
import { Plus, Database, Users, Code } from "@phosphor-icons/react";
import CustomButton from "./CustomButton";
import CustomDialog from "./CustomDialog";
import CustomInput from "./CustomInput";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const handleCreateProject = async () => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName }),
      });

      if (!response.ok) throw new Error("Failed to create project");

      const newProject = await response.json();
      setProjects([newProject, ...projects]);
      setNewProjectName("");
      setOpenDialog(false);
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                       bg-clip-text text-transparent text-3xl font-outfit tracking-tighter"
          >
            Your Projects
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Manage your backend projects and APIs
          </p>
        </div>
        <CustomButton onClick={() => setOpenDialog(true)}>
          <Plus className="mr-2" weight="bold" />
          New Project
        </CustomButton>
      </div>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} key={project.id}>
            <Link to={`/projects/${project.id}`} className="block group">
              <div
                className="backdrop-blur-xl bg-black/30 rounded-xl border border-zb-cyan/20 overflow-hidden
                          shadow-glow-sm hover:shadow-glow-md transition-all duration-300
                          p-6 h-full hover:bg-zb-cyan/5"
              >
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-outfit font-medium text-white group-hover:text-zb-cyan-light transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-white/60 text-sm mt-1">
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium 
                               bg-zb-cyan/10 text-zb-cyan border border-zb-cyan/20"
                  >
                    {project.status || "Active"}
                  </span>
                </div>

                {/* Project Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-black/20 backdrop-blur-md">
                    <Database
                      size={20}
                      weight="fill"
                      className="text-blue-400 mx-auto mb-1"
                    />
                    <p className="text-white/60 text-xs">Collections</p>
                    <p className="text-white font-medium">
                      {project.collections_count || 0}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-black/20 backdrop-blur-md">
                    <Users
                      size={20}
                      weight="fill"
                      className="text-purple-400 mx-auto mb-1"
                    />
                    <p className="text-white/60 text-xs">Users</p>
                    <p className="text-white font-medium">
                      {project.users_count || 0}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-black/20 backdrop-blur-md">
                    <Code
                      size={20}
                      weight="fill"
                      className="text-emerald-400 mx-auto mb-1"
                    />
                    <p className="text-white/60 text-xs">API Calls</p>
                    <p className="text-white font-medium">
                      {project.api_calls_count || 0}
                    </p>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-white/40 w-16">ID:</span>
                    <span className="text-zb-cyan-light font-mono">
                      {project.id}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-white/40 w-16">API Key:</span>
                    <span className="text-zb-cyan/70 font-mono">
                      {project.apiKey}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </Grid>
        ))}
      </Grid>

      {/* Create Project Dialog */}
      <CustomDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        title="Create New Project"
        onConfirm={handleCreateProject}
        confirmText="Create"
      >
        <CustomInput
          autoFocus
          label="Project Name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="My Awesome Project"
        />
      </CustomDialog>
    </div>
  );
}
