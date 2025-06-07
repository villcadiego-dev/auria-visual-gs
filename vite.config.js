// vite.config.js
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import { resolve } from 'path';

export default defineConfig({
    plugins: [wasm()],
    server: {
        port: 5173,
        strictPort: false,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                tools: resolve(__dirname, 'tools.html'),
                auria: resolve(__dirname, 'public/views/auria.html'),
                dropin: resolve(__dirname, 'public/views/dropin.html'),
                truck: resolve(__dirname, 'public/views/truck.html'),
                stump: resolve(__dirname, 'public/views/stump.html'),
                garden: resolve(__dirname, 'public/views/garden.html'),
                bonsai: resolve(__dirname, 'public/views/bonsai.html'),
                dynamic_scenes: resolve(__dirname, 'public/views/dynamic_scenes.html'),
                dynamic_dropin: resolve(__dirname, 'public/views/dynamic_dropin.html')
                // Temporarily excluded due to active @mkkellogg/gaussian-splats-3d imports:
                // vr: resolve(__dirname, 'public/views/vr.html')
            }
        },
        outDir: 'dist',
        emptyOutDir: true,
        copyPublicDir: true,
        assetsDir: 'assets'
    },
    publicDir: 'public'
});