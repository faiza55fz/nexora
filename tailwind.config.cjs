// Tailwind CSS configuration – centralized semantic colour palette
// Uses CSS custom properties defined in src/app/globals.css.
// Dark mode is class‑based to allow explicit control via the ThemeProvider.

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // enables .dark class toggling
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette – map to CSS variables for easy runtime switching
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        brand: "var(--brand)",
        "brand-2": "var(--brand-2)",
        "brand-soft": "var(--brand-soft)",
        cta: "var(--cta)",
        "cta-hover": "var(--cta-hover)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
        warning: "var(--warning)",
        "warning-soft": "var(--warning-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        info: "var(--info)",
        "info-soft": "var(--info-soft)",
        ai: "var(--ai)",
        "ai-soft": "var(--ai-soft)",
      },
      // Enable utilities to pull from the same palette
      backgroundColor: (theme) => theme("colors"),
      textColor: (theme) => theme("colors"),
      borderColor: (theme) => theme("colors"),
    },
  },
  plugins: [],
};