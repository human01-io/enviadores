import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173, // Ensures the development server runs on a specific port
  },
  resolve: {
    alias: {
      '@': '/src', // Allows using '@' to refer to 'src' for cleaner imports
    },
  },
  define: {
    'process.env': {}, // Ensures compatibility with libraries expecting process.env
  },
});
