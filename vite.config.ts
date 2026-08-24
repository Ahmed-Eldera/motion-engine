import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/motion-engine/" : "/",
  server: {
    host: true,
  },
}));