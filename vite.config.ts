import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' hace que funcione en cualquier repo: https://usuario.github.io/nombre-repo/
export default defineConfig({
  plugins: [react()],
  base: './',
});
