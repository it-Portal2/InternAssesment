import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Determine the target URL based on VITE_NODE_ENV
  const getProxyTarget = () => {
    const target = env.VITE_NODE_ENV === 'development' 
      ? env.VITE_API_DEV_URL
      : env.VITE_API_PROD_URL;
    
   // console.log(`🚀 Proxy target for VITE_NODE_ENV=${env.VITE_NODE_ENV || 'production (default)'}:`, target);
    return target;
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: getProxyTarget(),
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});