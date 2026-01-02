import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Kunci di port 5173 agar sesuai dengan izin di Backend
    strictPort: true, // Jika 5173 dipakai aplikasi lain, Vite akan error alih-alih pindah ke 5174
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});