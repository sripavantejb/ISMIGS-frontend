import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY;
  const openaiAdminKey = env.OPENAI_API_KEY_admin || env.VITE_OPENAI_API_KEY_admin;

  if (mode === "development") {
    const redact = (k: string) =>
      k ? `${k.slice(0, 7)}...${k.slice(-4)} (length: ${k.length})` : "(empty)";
    console.log("[vite] API keys (local dev):", {
      OPENAI_API_KEY: env.OPENAI_API_KEY ? redact(env.OPENAI_API_KEY) : "(not set)",
      VITE_OPENAI_API_KEY: env.VITE_OPENAI_API_KEY ? redact(env.VITE_OPENAI_API_KEY) : "(not set)",
      OPENAI_API_KEY_admin: env.OPENAI_API_KEY_admin ? redact(env.OPENAI_API_KEY_admin) : "(not set)",
      VITE_OPENAI_API_KEY_admin: env.VITE_OPENAI_API_KEY_admin ? redact(env.VITE_OPENAI_API_KEY_admin) : "(not set)",
      usedForOpenAIProxy: openaiKey ? redact(openaiKey) : "(none – set OPENAI_API_KEY or VITE_OPENAI_API_KEY in .env)",
      usedForPredictions: openaiAdminKey ? redact(openaiAdminKey) : "(none – set OPENAI_API_KEY_admin or VITE_OPENAI_API_KEY_admin in .env)",
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
        // More specific path first so /api/openai goes to OpenAI, not localhost:3001
        "/api/openai": {
          target: "https://api.openai.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              // Check if request has X-Use-Admin-Key header (for predictions)
              const useAdminKey = req.headers["x-use-admin-key"] === "true";
              const keyToUse = useAdminKey ? (openaiAdminKey || openaiKey) : openaiKey;
              
              if (keyToUse) {
                proxyReq.setHeader("Authorization", `Bearer ${keyToUse}`);
              }
              // Remove the custom header before forwarding to OpenAI
              proxyReq.removeHeader("x-use-admin-key");
            });
          },
        },
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
        "/mospi": {
          target: "https://api.mospi.gov.in",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/mospi/, ""),
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
