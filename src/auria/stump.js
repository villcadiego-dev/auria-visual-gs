import { BaseScene } from './core/BaseScene.js';

/**
 * Escena Stump con sistema FPS completo
 * Hereda toda la funcionalidad de BaseScene:
 * - Navegación FPS con controles WASD
 * - Física con cannon-js
 * - Controles de transformación en tiempo real
 * - Interfaz de usuario completa
 */
class StumpScene extends BaseScene {
    constructor() {
        console.log('🌳 Inicializando StumpScene...');
        
        // Configurar la escena stump sin objetos interactivos
        super('stump', { 
            enableInteraction: false // Sin cubos interactivos para esta escena
        });
        
        console.log('✅ StumpScene inicializada correctamente');
    }

    /**
     * Personalizar la configuración de la escena stump si es necesario
     * Se puede override este método para agregar elementos específicos
     */
    customizeScene() {
        // Agregar cualquier personalización específica de la escena stump aquí
        console.log('🌳 Escena Stump personalizada con sistema FPS completo');
    }
}

// Inicializar escena directamente (sin esperar DOMContentLoaded)
console.log('🌳 Iniciando StumpScene...');
try {
    const stumpScene = new StumpScene();
    stumpScene.init().catch(error => {
        console.error('❌ Error al inicializar la escena Stump:', error);
        console.error('Stack trace:', error.stack);
    });
    window.stumpScene = stumpScene; // Para acceso global si es necesario
    console.log('✅ StumpScene creada y inicializando...');
} catch (error) {
    console.error('❌ Error al crear la escena Stump:', error);
    console.error('Stack trace:', error.stack);
}