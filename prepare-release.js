#!/usr/bin/env node

/**
 * Script para preparar archivos de la carpeta data para GitHub Releases
 * Uso: node prepare-release.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'public/assets/data');
const OUTPUT_DIR = path.join(__dirname, 'release-files');

// Configuración de archivos por escena
const SCENE_FILES = {
    auria: [
        'office/demo_office_gs.ksplat'
    ],
    dropin: [
        'garden/garden_high.ksplat'
    ],
    truck: [
        'truck/truck_high.ksplat'
    ],
    stump: [
        'stump/stump_high.ksplat'
    ],
    bonsai: [
        'bonsai/bonsai_trimmed.ksplat'
    ]
};

// URLs base para GitHub Releases
const GITHUB_RELEASES_BASE = 'https://github.com/villcadiego-dev/auria-visual-gs/releases/download/v1.0';

function createOutputDir() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`✅ Creado directorio: ${OUTPUT_DIR}`);
    }
}

function copyFiles() {
    console.log('📁 Preparando archivos para release...\n');
    
    const allFiles = [];
    
    Object.entries(SCENE_FILES).forEach(([scene, files]) => {
        console.log(`🎬 Escena: ${scene}`);
        
        files.forEach(file => {
            const sourcePath = path.join(DATA_DIR, file);
            const fileName = path.basename(file);
            const destPath = path.join(OUTPUT_DIR, fileName);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                const stats = fs.statSync(sourcePath);
                const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
                
                console.log(`  ✅ ${fileName} (${sizeInMB} MB)`);
                allFiles.push({
                    scene,
                    fileName,
                    originalPath: file,
                    size: sizeInMB
                });
            } else {
                console.log(`  ❌ No encontrado: ${file}`);
            }
        });
        console.log('');
    });
    
    return allFiles;
}

function generateURLConfig(files) {
    console.log('🔗 Generando configuración de URLs...\n');
    
    const urlConfig = {};
    
    files.forEach(({ scene, fileName, originalPath }) => {
        if (!urlConfig[scene]) urlConfig[scene] = {};
        urlConfig[scene][originalPath] = `${GITHUB_RELEASES_BASE}/${fileName}`;
    });
    
    // Generar el código actualizado para scene-configs.js
    const configCode = `// URLs actualizadas para GitHub Releases
export const RELEASE_URLS = {
${Object.entries(urlConfig).map(([scene, urls]) => {
    return `    ${scene}: {
${Object.entries(urls).map(([path, url]) => `        '${path}': '${url}'`).join(',\n')}
    }`;
}).join(',\n')}
};`;
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'release-urls.js'), configCode);
    console.log('✅ Archivo generado: release-urls.js');
    
    return urlConfig;
}

function generateInstructions(files) {
    const instructions = `
# 🚀 Instrucciones para GitHub Releases

## Paso 1: Crear Release en GitHub

1. Ve a tu repositorio en GitHub
2. Click en "Releases" → "Create a new release"
3. Tag version: \`v1.0\`
4. Release title: \`Assets v1.0 - 3D Scene Files\`
5. Descripción:
\`\`\`
Archivos 3D para las escenas de Auria Visual GS:
${files.map(f => `- ${f.fileName} (${f.size} MB) - ${f.scene} scene`).join('\n')}

Total: ${files.reduce((sum, f) => sum + parseFloat(f.size), 0).toFixed(2)} MB
\`\`\`

## Paso 2: Subir archivos

Arrastra estos archivos a la sección "Attach binaries":
${files.map(f => `- ${f.fileName}`).join('\n')}

## Paso 3: Actualizar scene-configs.js

Reemplaza las rutas locales con las URLs de GitHub Releases.

## Comando para subir usando GitHub CLI (opcional):

\`\`\`bash
gh release create v1.0 \\
    --title "Assets v1.0 - 3D Scene Files" \\
    --notes "Archivos 3D para las escenas de Auria Visual GS" \\
    ${files.map(f => `release-files/${f.fileName}`).join(' \\\n    ')}
\`\`\`
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'INSTRUCTIONS.md'), instructions);
    console.log('✅ Archivo generado: INSTRUCTIONS.md\n');
}

function main() {
    console.log('🎯 Preparando archivos para GitHub Releases\n');
    
    createOutputDir();
    const files = copyFiles();
    generateURLConfig(files);
    generateInstructions(files);
    
    console.log('🎉 ¡Preparación completa!');
    console.log(`📁 Revisa la carpeta: ${OUTPUT_DIR}`);
    console.log('📖 Lee las instrucciones en: INSTRUCTIONS.md');
}

main();