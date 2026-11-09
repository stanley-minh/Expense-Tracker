import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // tailwindcss(): Tailwind v4 plugin (replaces the old PostCSS + tailwind.config.js setup)
  plugins: [react(), tailwindcss()],
});
