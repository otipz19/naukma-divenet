import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The dev server proxies the API to a locally running back-end
// (`cd backend && ./mvnw spring-boot:test-run`). In the full stack nginx does this instead.
const apiTarget = process.env.DIVENET_API_URL ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
});
