import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // In development (npm run dev), serve at '/' so http://localhost:5173 works directly.
  // In production builds (npm run build), use '/admin/' for Nginx proxying.
  base: process.env.VITE_BASE_PATH || (mode === 'production' ? '/admin/' : '/'),
  plugins: [react(), tailwindcss()],
}))
