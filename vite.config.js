// vite.config.js
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
    plugins: [wasm()],
    server: {
        port: 5173,
        strictPort: false,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    }
});