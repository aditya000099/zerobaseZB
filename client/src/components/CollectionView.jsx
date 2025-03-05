import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import CustomButton from "./CustomButton";

export default function CollectionView() {
  const { projectId, collectionName } = useParams();
  const [documents, setDocuments] = useState([]);
  const [tableSchema, setTableSchema] = useState(null);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `/api/db/tables/${collectionName}/documents?projectId=${projectId}`
      );
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const fetchTableSchema = async () => {
    try {
      const response = await fetch(`/api/db/tables?projectId=${projectId}`);
      const data = await response.json();
      const table = data.tables.find((t) => t.table_name === collectionName);
      setTableSchema(table);
    } catch (err) {
      console.error("Error fetching table schema:", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchTableSchema();
  }, [projectId, collectionName]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2
            className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                         bg-clip-text text-transparent text-2xl font-outfit tracking-tighter"
          >
            {collectionName}
          </h2>
          <p className="text-white/60 text-sm mt-1">Collection Documents</p>
        </div>
        <CustomButton
          onClick={() =>
            navigate(`/projects/${projectId}/collections/${collectionName}/new`)
          }
        >
          Add Document
        </CustomButton>
      </div>

      <div
        className="backdrop-blur-xl bg-black/30 rounded-2xl border border-zb-cyan/20 overflow-hidden
                      shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
      >
        <div className="overflow-x-auto custom-scrollbar">
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
                {tableSchema?.columns.map((col) => (
                  <TableCell key={col.column_name}>
                    <span
                      className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                                   bg-clip-text text-transparent font-outfit font-medium"
                    >
                      {col.column_name} ({col.data_type})
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc, index) => (
                <TableRow
                  key={index}
                  className="border-b border-zb-cyan/10 hover:bg-zb-cyan/5"
                >
                  {Object.entries(doc).map(([key, value]) => (
                    <TableCell key={key} className="text-white/80">
                      {JSON.stringify(value)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
