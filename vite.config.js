import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Specific endpoint for submit
      '/api/v1/submit': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => {
          // Remove the /api prefix
          let newPath = path.replace(/^\/api/, '');
          // Ensure it ends with a trailing slash
          if (!newPath.endsWith('/')) {
            newPath += '/';
          }
          return newPath;
        }
      },
      // Specific endpoint for whois remains similar
      '/api/whois': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/whois(\/?)$/, '/v1/whois')
      },
      // Generic API proxy rule for any other endpoints
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
