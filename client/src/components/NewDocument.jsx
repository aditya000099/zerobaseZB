import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextField } from "@mui/material";
import CustomButton from "./CustomButton";

export default function NewDocument() {
  const { projectId, collectionName } = useParams();
  const [schema, setSchema] = useState(null);
  const [newDocument, setNewDocument] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch(`/api/db/tables?projectId=${projectId}`);
        const data = await response.json();
        const table = data.tables.find((t) => t.table_name === collectionName);
        setSchema(table);
      } catch (err) {
        console.error("Error fetching schema:", err);
      }
    };
    fetchSchema();
  }, [projectId, collectionName]);

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `/api/db/tables/${collectionName}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            document: newDocument,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create document");
      navigate(`/projects/${projectId}/collections/${collectionName}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2
            className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                         bg-clip-text text-transparent text-2xl font-outfit tracking-tighter"
          >
            New Document
          </h2>
          <p className="text-white/60 text-sm mt-1">Add to {collectionName}</p>
        </div>
      </div>

      <div
        className="backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 p-6
                      shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
      >
        <div className="grid gap-4">
          {schema?.columns.map((col) => (
            <TextField
              key={col.column_name}
              label={`${col.column_name} (${col.data_type})`}
              value={newDocument[col.column_name] || ""}
              onChange={(e) =>
                setNewDocument({
                  ...newDocument,
                  [col.column_name]: e.target.value,
                })
              }
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
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() =>
              navigate(`/projects/${projectId}/collections/${collectionName}`)
            }
            className="text-white/70 hover:text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <CustomButton onClick={handleSubmit}>Create Document</CustomButton>
        </div>
      </div>
    </div>
  );
}
