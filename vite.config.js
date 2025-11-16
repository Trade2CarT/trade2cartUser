// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa' // <-- Import the plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Add the VitePWA plugin
    VitePWA({
      registerType: 'autoUpdate',
      // Add this to include a web app manifest
      manifest: {
        name: 'Trade2Cart',
        short_name: 'Trade2Cart',
        description: 'Sell Scrap Online & Schedule Pickups - Trade2Cart',
        theme_color: '#ffffff',
        // Use your logo from the /public folder
        icons: [
          {
            src: 'logo.png', // Assuming logo.png is in your /public folder
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})