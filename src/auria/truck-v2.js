import { BaseScene } from './core/BaseScene.js';

/**
 * Escena Truck con sistema FPS limpio
 * Usando la nueva arquitectura modular
 */
class TruckScene extends BaseScene {
    constructor() {
        super('truck', {
            enableInteraction: false, // Sin interacciones
            showHint: false,
            includePlayer: true,
            includeGrid: true,
            includeAxes: true,
            includeGroundPlane: true,
        });
    }

    customizeScene() {
        // Truck scene mantiene la escena limpia sin objetos adicionales
        console.log('🚛 Truck scene - Escena limpia sin objetos interactivos');
    }

    customPostLoadSetup() {
        // Sin cajas físicas ni objetos interactivos
        console.log('🚛 Truck scene configurada - Solo navegación FPS');
    }
}

// Inicializar escena
const truckScene = new TruckScene();
truckScene.init().catch(console.error);