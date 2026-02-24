import React from "react";
import { TextField } from "@mui/material";

const CustomInput = ({
  label,
  value,
  onChange,
  type = "text",
  fullWidth = true,
  select = false,
  SelectProps,
  children,
  ...props
}) => {
  return (
    <TextField
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      fullWidth={fullWidth}
      select={select}
      SelectProps={{
        ...SelectProps,
        className: "text-white",
      }}
      className="bg-black/20 rounded-lg backdrop-blur-sm"
      sx={{
        "& .MuiOutlinedInput-root": {
          color: "white",
          background:
            "linear-gradient(180deg, rgba(20,252,241,0.02) 0%, transparent 100%)",
          backdropFilter: "blur(10px)",
          "& fieldset": {
            borderColor: "rgba(20,252,241,0.2)",
            transition: "all 0.2s",
          },
          "&:hover fieldset": {
            borderColor: "rgba(20,252,241,0.4)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(20,252,241,0.6)",
            borderWidth: "1px",
            boxShadow: "0 0 10px rgba(20,252,241,0.1)",
          },
        },
        "& .MuiInputLabel-root": {
          color: "rgba(255,255,255,0.7)",
          "&.Mui-focused": {
            color: "rgba(20,252,241,0.8)",
          },
        },
        "& .MuiSelect-icon": {
          color: "rgba(20,252,241,0.5)",
        },
        "& option": {
          backgroundColor: "#000",
          color: "white",
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </TextField>
  );
};

export default CustomInput;
