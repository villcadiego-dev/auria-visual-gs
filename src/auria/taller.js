import { BaseScene } from './core/BaseScene.js';

/**
 * Escena Taller con sistema FPS completo
 * Usando la nueva arquitectura modular
 */
class TallerScene extends BaseScene {
    constructor() {
        super('taller', {
            enableInteraction: false, // Sin interacciones por defecto
            showHint: false,
            includePlayer: true,
            includeGrid: true,
            includeAxes: true,
            includeGroundPlane: true,
            includeFBX: true // Modelo de persona opcional
        });
    }

    customizeScene() {
        // Configuración específica para la escena del taller
        console.log('🔧 Taller scene - Navegación FPS en entorno de taller');
        
        // Aquí puedes agregar elementos específicos del taller si es necesario
        // Por ejemplo: herramientas, maquinaria, etc.
    }

    customPostLoadSetup() {
        // Configuración post-carga para optimizar el entorno del taller
        console.log('🔧 Taller scene configurada - Sistema FPS activo');
        
        // Opcional: Agregar física específica o interacciones del taller
        // this.addWorkshopInteractions();
    }

    // Método opcional para agregar interacciones específicas del taller
    addWorkshopInteractions() {
        // Aquí podrías agregar interacciones específicas como:
        // - Maquinarias clickeables
        // - Información de herramientas
        // - Puntos de interés del taller
        console.log('🔧 Workshop interactions ready');
    }
}

// Inicializar escena taller
const tallerScene = new TallerScene();
tallerScene.init().catch(console.error);