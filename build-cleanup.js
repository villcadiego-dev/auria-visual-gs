#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile, writeFile, rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function cleanupBuild() {
    const distDir = join(__dirname, 'dist');
    const publicViewsDir = join(distDir, 'public', 'views');
    const viewsDir = join(distDir, 'views');
    
    console.log('🧹 Cleaning up build structure...');
    
    try {
        // Check if public/views exists (processed by Vite)
        if (existsSync(publicViewsDir)) {
            console.log('📁 Moving processed HTML files from public/views/ to views/');
            
            // Remove old views directory (static copies)
            if (existsSync(viewsDir)) {
                await rm(viewsDir, { recursive: true });
                console.log('🗑️  Removed old views/ directory');
            }
            
            // Create new views directory
            await mkdir(viewsDir, { recursive: true });
            
            // Read all files from public/views
            const files = await readdir(publicViewsDir);
            
            for (const file of files) {
                if (file.endsWith('.html')) {
                    const sourceFile = join(publicViewsDir, file);
                    const targetFile = join(viewsDir, file);
                    
                    // Copy processed HTML file
                    const content = await readFile(sourceFile, 'utf8');
                    await writeFile(targetFile, content);
                    console.log(`✅ Moved ${file}`);
                }
            }
            
            // Remove public directory (no longer needed)
            await rm(join(distDir, 'public'), { recursive: true });
            console.log('🗑️  Removed public/ directory');
            
            console.log('✨ Build cleanup completed successfully!');
        } else {
            console.log('ℹ️  No public/views directory found, skipping cleanup');
        }
    } catch (error) {
        console.error('❌ Error during build cleanup:', error);
        process.exit(1);
    }
}

cleanupBuild();