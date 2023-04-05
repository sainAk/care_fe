import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import * as esbuild from "esbuild";

export default defineConfig({
  envPrefix: "REACT_",
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectRegister: null,
      injectManifest: {
        maximumFileSizeToCacheInBytes: 7000000,
      },
      manifest: {
        name: "Care",
        short_name: "Care",
        theme_color: "#33bb17",
        background_color: "#2196f3",
        icons: [
          {
            src: "https://cdn.coronasafe.network/care-manifest/images/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "https://cdn.coronasafe.network/care-manifest/images/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "https://cdn.coronasafe.network/care-manifest/images/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: "https://careapi.coronasafe.in",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        // replace global with the standard way in dependencies
        global: "globalThis",
      },
      loader: {
        ".js": "jsx",
      },
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
      plugins: [
        {
          // workaround to accept jsx syntax in js files
          name: "load-js-files-as-jsx",
          async load(id) {
            if (id.match(/node_modules.*src.*\.js$/)) {
              console.warn("Loading", id);
              return esbuild.transformSync(fs.readFileSync(id, "utf8"), {
                loader: "jsx",
              });
            }
          },
        },
      ],
    },
    commonjsOptions: {
      // workaround for packages that have mixed ES modules and CommonJS
      defaultIsModuleExports(id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const module = require(id);
          if (module?.default) {
            return false;
          }
          return "auto";
        } catch (error) {
          return "auto";
        }
      },
      transformMixedEsModules: true,
    },
  },
});
