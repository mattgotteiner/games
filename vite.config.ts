import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const allowedHosts = loadEnv(mode, process.cwd(), 'GAMES_DEV_')
    .GAMES_DEV_ALLOWED_HOSTS?.split(',')
    .map((host) => host.trim())
    .filter(Boolean) ?? []

  return {
    base: '/games/',
    server: {
      allowedHosts,
    },
    plugins: [
      preact(),
      VitePWA({
        includeAssets: ['icons/*.png'],
        manifest: {
          name: 'Games',
          short_name: 'Games',
          description:
            'A growing collection of games made for quick breaks and small screens.',
          start_url: '/games/',
          scope: '/games/',
          display: 'standalone',
          background_color: '#f7f1e8',
          theme_color: '#162033',
          icons: [
            {
              src: 'icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        registerType: 'prompt',
        workbox: {
          clientsClaim: true,
        },
      }),
    ],
  }
})
