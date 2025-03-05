import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const CustomSelect = ({
  label,
  value,
  onChange,
  options,
  fullWidth = true,
  ...props
}) => {
  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel
        sx={{
          color: "rgba(255,255,255,0.7)",
          "&.Mui-focused": {
            color: "rgba(20,252,241,0.8)",
          },
        }}
      >
        {label}
      </InputLabel>
      <Select
        value={value}
        label={label}
        onChange={onChange}
        className="bg-black/20 rounded-lg backdrop-blur-sm"
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(20,252,241,0.2)",
              borderRadius: "0.5rem",
              boxShadow: "0 0 20px rgba(20,252,241,0.1)",
              "& .MuiMenuItem-root": {
                color: "white",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "rgba(20,252,241,0.1)",
                },
                "&.Mui-selected": {
                  bgcolor: "rgba(20,252,241,0.2)",
                  "&:hover": {
                    bgcolor: "rgba(20,252,241,0.25)",
                  },
                },
              },
            },
          },
        }}
        sx={{
          color: "white",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(20,252,241,0.2)",
            transition: "all 0.2s",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(20,252,241,0.4)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(20,252,241,0.6)",
            borderWidth: "1px",
            boxShadow: "0 0 10px rgba(20,252,241,0.1)",
          },
          "& .MuiSelect-icon": {
            color: "rgba(20,252,241,0.5)",
          },
        }}
        {...props}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CustomSelect;
