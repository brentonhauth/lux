import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lux': path.resolve(__dirname, './src'),
    }
  }
});
