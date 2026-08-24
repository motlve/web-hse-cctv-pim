import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/login/paramedis/',

  plugins: [react(), tailwindcss()],

  server: {
    port: 5176,

    strictPort: true,

    proxy: {
      '/api': {
        target: 'http://localhost:8081',

        changeOrigin: true,

        secure: false,
      },
    },
  },
});
