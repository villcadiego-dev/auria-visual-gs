# Auria Visual GS - Gaussian Splatting 3D con Three.js

Este proyecto es una implementación basada en Three.js de un visualizador para la técnica [3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/). Esta técnica permite generar escenas 3D a partir de imágenes 2D, y aunque su implementación original está basada en CUDA y requiere ejecutarse de forma nativa, este proyecto busca ofrecer una alternativa accesible vía web.

## 🎯 Objetivo

El objetivo principal es crear un visualizador web que permita:

- Cargar y visualizar escenas 3D generadas mediante Gaussian Splatting.
- Integrar controles de navegación e interacción.
- Incorporar objetos y componentes adicionales, como los creados en Unreal Engine.
- Facilitar el desarrollo y pruebas mediante herramientas modernas como Vite.

## 📁 Formatos de Escena Soportados

El visualizador es compatible con los siguientes formatos de escena:

- `.ply`: Archivos generados por el proyecto original de INRIA.
- `.splat`: Formato estándar de splats.
- `.ksplat`: Formato personalizado, optimizado y comprimido derivado de `.ply`.

## ⚙️ Integración con Vite y WebAssembly

Para mejorar la experiencia de desarrollo, se ha integrado Vite como herramienta de construcción y desarrollo. Sin embargo, al trabajar con archivos WebAssembly (`.wasm`), es necesario realizar algunas configuraciones adicionales.

### 🛠️ Configuración de Vite para WebAssembly

Vite permite importar archivos `.wasm` utilizando el sufijo `?url`, lo que devuelve la URL pública del recurso. Esto es útil cuando se necesita cargar el archivo `.wasm` de forma dinámica.

**Ejemplo:**

```javascript
import sorterWasmUrl from './sorter.wasm?url';

const response = await fetch(sorterWasmUrl);
const sorterWasmBytes = new Uint8Array(await response.arrayBuffer());
```

Esta configuración asegura que el archivo `.wasm` se cargue correctamente tanto en desarrollo como en producción.

### ⚠️ Consideraciones Importantes

- **Importación Incorrecta:** Evitar el uso de `atob(sourceWasm)` cuando `sourceWasm` es una URL, ya que `atob` espera una cadena en base64, no una URL.
- **Carga Asíncrona:** Asegurarse de que la carga del archivo `.wasm` sea asíncrona y se maneje adecuadamente con `async/await` para evitar bloqueos o errores silenciosos.

## 🚀 Inicio Rápido

1. **Instalación de Dependencias:**

   ```bash
   npm install
   ```

2. **Inicio del Servidor de Desarrollo:**

   ```bash
   npm run dev
   ```

3. **Construcción para Producción:**

   ```bash
   npm run build
   ```

4. **Vista Previa de Producción:**

   ```bash
   npm run preview
   ```

## 🧩 Estructura del Proyecto

- `src/`: Contiene el código fuente principal.
- `public/`: Archivos estáticos accesibles públicamente.
- `sorter.wasm`: Archivo WebAssembly utilizado para el ordenamiento de splats.
- `vite.config.js`: Configuración de Vite.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar el proyecto, por favor, realiza un fork y envía un pull request.

## 🔧 Mantenimiento y mejoras

Este fork/modificación está siendo desarrollado y mantenido por Diego Villca, con ajustes para facilitar el desarrollo local con Vite, soporte de hot reload y mejoras en los controles y visualización de escenas personalizadas con Gaussian Splatting.

El proyecto original fue creado por Mark Kellogg y se encuentra licenciado bajo MIT.
