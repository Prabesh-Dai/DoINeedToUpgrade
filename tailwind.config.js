/** @type {import('tailwindcss').Config} */

// Shared shape/motion tokens for both themes
const shape = {
  "--rounded-box": "0.375rem",
  "--rounded-btn": "0.25rem",
  "--rounded-badge": "0.25rem",
  "--animation-btn": "0.2s",
  "--animation-input": "0.2s",
  "--btn-focus-scale": "0.97",
  "--border-btn": "1px",
  "--tab-radius": "0.25rem",
};

module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)",
        lift: "0 1px 2px rgb(0 0 0 / 0.06), 0 16px 40px -16px rgb(0 0 0 / 0.25)",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [{
      light: {
        ...shape,
        // Monochrome "ink" primary; status colors are solid, used sparingly
        "primary": "#111113",
        "primary-content": "#FFFFFF",
        "secondary": "#3F3F46",
        "secondary-content": "#FFFFFF",
        "accent": "#3F3F46",
        "accent-content": "#FFFFFF",
        "neutral": "#18181B",
        "neutral-content": "#FAFAFA",
        "base-100": "#FFFFFF",
        "base-200": "#F4F4F5",
        "base-300": "#E4E4E7",
        "base-content": "#18181B",
        "info": "#3358D4",
        "info-content": "#FFFFFF",
        "success": "#18794E",
        "success-content": "#FFFFFF",
        "warning": "#AD5700",
        "warning-content": "#FFFFFF",
        "error": "#CE2C31",
        "error-content": "#FFFFFF",
      }
    }, {
      dark: {
        ...shape,
        "primary": "#F4F4F5",
        "primary-content": "#0E0E10",
        "secondary": "#A1A1AA",
        "secondary-content": "#0E0E10",
        "accent": "#A1A1AA",
        "accent-content": "#0E0E10",
        "neutral": "#1F1F23",
        "neutral-content": "#EDEDEF",
        "base-100": "#161618",
        "base-200": "#0E0E10",
        "base-300": "#28282C",
        "base-content": "#EDEDEF",
        "info": "#3E63DD",
        "info-content": "#FFFFFF",
        "success": "#30A46C",
        "success-content": "#06140D",
        "warning": "#F5A524",
        "warning-content": "#1F1400",
        "error": "#E5484D",
        "error-content": "#FFFFFF",
      }
    }],
  },
};
