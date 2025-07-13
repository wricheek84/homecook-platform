import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // ⬅️ Make sure this is your backend's actual dev URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
