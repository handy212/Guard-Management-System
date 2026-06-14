import path from "node:path";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@guard/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
});
