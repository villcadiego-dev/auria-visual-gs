import { BaseScene } from './core/BaseScene.js';

/**
 * Escena Auria (Office) con sistema FPS
 * Usando la nueva arquitectura modular
 */
class AuriaScene extends BaseScene {
    constructor() {
        super('auria', {
            enableInteraction: false, // Sin interacciones por defecto
            showHint: false,
            includePlayer: true,
            includeGrid: true,
            includeAxes: true,
            includeGroundPlane: true,
            includeFBX: false, // Sin modelo FBX para scene office
            
            // Opciones específicas para office scene
            cameraHeight: 1.2,
            moveSpeed: 2
        });
    }

    customizeScene() {
        // Office scene mantiene la escena limpia inicialmente
        // Se pueden agregar elementos específicos aquí
        console.log('🏢 Office scene configurada');
    }

    customPostLoadSetup() {
        // Configuración específica post-carga para office
        console.log('🏢 Office scene lista para navegación FPS');
        
        // Aquí se pueden agregar elementos interactivos específicos de la oficina
        // como escritorios, computadoras, etc.
    }

    // Método para agregar elementos de oficina si se necesitan
    addOfficeElements() {
        // Ejemplo: agregar escritorios, sillas, etc.
        // this.addInteractiveBox([2, 1, 0], { color: 0x8B4513 }); // Escritorio
    }
}

// Inicializar escena
const auriaScene = new AuriaScene();
auriaScene.init().catch(console.error);