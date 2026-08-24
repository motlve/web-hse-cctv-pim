import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/cctv/',

  plugins: [react(), tailwindcss()],

  server: {
    host: '0.0.0.0',

    port: 5173,

    strictPort: true,

    proxy: {
      '/api': {
        target: 'http://backend-cctv:8081',

        changeOrigin: true,

        secure: false,
      },
    },
  },
});
