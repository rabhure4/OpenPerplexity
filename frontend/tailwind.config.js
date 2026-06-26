/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        base: "#0f0f0f",
        surface: "#1a1a1a",
        border: "#2a2a2a",
        // Accent — mirrors the CSS variable; update both together when cloning
        accent: "var(--accent)",
      },
      animation: {
        pulse: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
