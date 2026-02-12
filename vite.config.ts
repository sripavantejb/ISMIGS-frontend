import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY;

  if (mode === "development") {
    const redact = (k: string) =>
      k ? `${k.slice(0, 7)}...${k.slice(-4)} (length: ${k.length})` : "(empty)";
    console.log("[vite] API keys (local dev):", {
      OPENAI_API_KEY: env.OPENAI_API_KEY ? redact(env.OPENAI_API_KEY) : "(not set)",
      VITE_OPENAI_API_KEY: env.VITE_OPENAI_API_KEY ? redact(env.VITE_OPENAI_API_KEY) : "(not set)",
      usedForOpenAIProxy: openaiKey ? redact(openaiKey) : "(none – set OPENAI_API_KEY or VITE_OPENAI_API_KEY in .env)",
    });
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/mospi": {
          target: "https://api.mospi.gov.in",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/mospi/, ""),
        },
        "/api/openai": {
          target: "https://api.openai.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (openaiKey) {
                proxyReq.setHeader("Authorization", `Bearer ${openaiKey}`);
              }
            });
          },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
