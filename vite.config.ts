import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from 'tailwindcss'
import tailwindVite from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindVite(),
    tsconfigPaths(),
  ],
  server: {
    // Allow ngrok / tunnels and any other external host to hit the dev server
    // without Vite rejecting the request.
    allowedHosts: true,
  },
})
