import React from "react";

const CustomButton = ({ onClick, children, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-6 py-2.5 rounded-lg font-outfit font-medium
        bg-black/20
        backdrop-blur-md
        border border-zb-cyan/20
        text-white/90
        shadow-[0_0_10px_rgba(20,252,241,0.1)]
        transition-all duration-300
        hover:bg-zb-cyan/5
        hover:border-zb-cyan/30
        hover:text-white
        hover:shadow-[0_0_15px_rgba(20,252,241,0.15)]
        active:scale-[0.98]
        active:bg-zb-cyan/10
        ${className}
      `}
    >
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-zb-cyan/10 via-transparent to-transparent opacity-50" />
      <span className="relative z-10 flex items-center">{children}</span>
    </button>
  );
};

export default CustomButton;
