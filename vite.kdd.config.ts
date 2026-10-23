import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: "kdd-public",
  envDir: path.resolve(import.meta.dirname, "kdd-config"),
  envPrefix: "VITE_KDD_",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "client/src") } },
  server: { host: "0.0.0.0", port: 5173, strictPort: true },
  build: { outDir: "../dist", emptyOutDir: true },
});
