import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The dev server proxies the API and the media files to a locally running back-end
// (`cd backend && ./mvnw spring-boot:test-run`). In the full stack nginx does this instead.
const apiTarget = process.env.DIVENET_API_URL ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  build: {
    // Never inline fonts as data: URIs: the CSP allows fonts from 'self' only (frontend/nginx.conf),
    // so an inlined subset would be blocked (review finding F-02). Other assets keep the default.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
  server: {
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/media": { target: apiTarget, changeOrigin: true },
    },
  },
});
