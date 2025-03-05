/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          darker: "rgba(255, 255, 255, 0.05)",
        },
        zb: {
          blue: {
            light: "#60A5FA",
            DEFAULT: "#3B82F6",
            dark: "#2563EB",
            deep: "#1E40AF",
          },
          aqua: {
            DEFAULT: "#30FFAC",
            faded: "rgba(48, 255, 172, 0.15)",
          },
          black: "#0F0703",
          gray: {
            light: "#383838",
            DEFAULT: "#232323",
            dark: "#171717",
          },
          white: "#FFFFFF",
          cyan: {
            light: "#7CFFF9",
            DEFAULT: "#14FCF1",
            dark: "#0AC5BC",
            glow: "#14FCF1",
          },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "split-diagonal":
          "linear-gradient(135deg, var(--tw-gradient-from) 50%, var(--tw-gradient-to) 50%)",
        "blend-diagonal": `
          linear-gradient(135deg, 
            #14FCF1 0%, 
            #14FCF1 45%, 
            rgba(20,252,241,0.5) 48%,
            rgba(0,0,0,0.5) 52%,
            #000000 55%, 
            #000000 100%
          )`,
      },
      boxShadow: {
        "glow-sm": "0 2px 15px -3px rgba(20, 252, 241, 0.2)",
        "glow-md": "0 4px 25px -3px rgba(20, 252, 241, 0.25)",
        "glow-lg": "0 8px 35px -3px rgba(20, 252, 241, 0.3)",
      },
      keyframes: {
        shimmer: {
          "0%": { borderColor: "rgba(20, 252, 241, 0.2)" },
          "50%": { borderColor: "rgba(20, 252, 241, 0.8)" },
          "100%": { borderColor: "rgba(20, 252, 241, 0.2)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
