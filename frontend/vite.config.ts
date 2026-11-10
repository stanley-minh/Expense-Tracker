import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  // tailwindcss(): Tailwind v4 plugin (replaces the old PostCSS + tailwind.config.js setup)
  plugins: [react(), tailwindcss()],
  server: {
    // Dev proxy: the browser calls http://localhost:5173/api/..., and Vite forwards
    // the request to the PHP API (nginx on port 8080). For the browser everything comes
    // from the same origin, so there is no CORS issue — exactly like in production,
    // where nginx will serve both the React build and /api on a single domain.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
