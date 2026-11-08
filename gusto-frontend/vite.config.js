import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "مطعم جوستو - Gusto Restaurant",
        short_name: "Gusto",
        description: "Restaurant Management System - نظام إدارة المطعم",
        theme_color: "#046375",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any", // tablets are used in landscape and portrait
        id: "/",
        start_url: "/", // opens on each role's own page (waiters: the table menu)
        scope: "/",
        lang: "ar",
        dir: "rtl",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // The app shell may answer page loads offline, never API calls, photos or live updates
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//, /^\/socket\.io\//],
        runtimeCaching: [
          {
            urlPattern: /\/uploads\/.*\.(?:png|jpg|jpeg|webp|gif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "menu-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\/api\/(categories|menu)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-master-data",
              expiration: { maxEntries: 10, maxAgeSeconds: 5 * 60 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vuetify: ["vuetify"],
          charts: ["chart.js", "vue-chartjs"],
          pdf: ["jspdf", "html2canvas"],
          xlsx: ["xlsx"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3128",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3128",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3128",
        ws: true,
      },
    },
  },
});
