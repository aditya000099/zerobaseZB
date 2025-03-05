import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import { CloudUpload, Folder, InsertDriveFile } from "@mui/icons-material";

export default function StorageTab() {
  return (
    <div className="p-6">
      <h2
        className="bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] 
                    bg-clip-text text-transparent text-2xl font-outfit tracking-tighter"
      >
        Storage
      </h2>
      <p className="text-white/60 mt-2">Storage functionality coming soon...</p>
    </div>
  );
}
