import React from "react";
import { Dialog, DialogContent } from "@mui/material";
import CustomButton from "./CustomButton";

const CustomDialog = ({
  open,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirm",
  maxWidth = "sm",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "transparent",
          boxShadow: "none",
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
        },
      }}
      PaperProps={{
        className: `
          relative
          backdrop-blur-2xl
          bg-[#00000099]
          shadow-[0_0_50px_rgba(20,252,241,0.08)]
          border
          border-zb-cyan/20
          rounded-2xl
          overflow-hidden
          animate-dialog-enter
        `,
        style: {
          background: `
            radial-gradient(circle at center, rgba(20,252,241,0.05) 0%, transparent 70%),
            linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.98))
          `,
        },
      }}
    >
      {/* Header with enhanced gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zb-cyan/10 to-transparent opacity-50" />
        <div className="relative p-6">
          <h2 className="font-outfit text-xl">
            <span className="bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zb-cyan/30 to-transparent" />
      </div>

      {/* Content with enhanced background */}
      <DialogContent className="relative p-6 !text-white/90">
        <div className="absolute inset-0 bg-gradient-to-b from-zb-cyan/[0.02] to-transparent pointer-events-none" />
        <div className="relative space-y-4">{children}</div>
      </DialogContent>

      {/* Footer with enhanced gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-zb-cyan/10 to-transparent opacity-50" />
        <div className="relative p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/70 hover:text-white rounded-lg 
                     transition-all duration-200 hover:bg-white/5 hover:shadow-[0_0_10px_rgba(20,252,241,0.05)]"
          >
            Cancel
          </button>
          <CustomButton onClick={onConfirm}>{confirmText}</CustomButton>
        </div>
      </div>
    </Dialog>
  );
};

export default CustomDialog;
