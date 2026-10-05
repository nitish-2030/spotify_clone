import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Spotify "localhost" redirect allow nahi karta, isliye dev server 127.0.0.1 par chalta hai
  server: { host: '127.0.0.1', port: 5173 },
})
