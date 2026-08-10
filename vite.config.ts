import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appVersion = process.env.npm_package_version || "0.1.0";
const buildId = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || "dev";

export default defineConfig({
  plugins: [react()],
  define: {
    __SUPPORTABLE_VERSION__: JSON.stringify(appVersion),
    __SUPPORTABLE_BUILD__: JSON.stringify(buildId.slice(0, 7)),
  },
});
