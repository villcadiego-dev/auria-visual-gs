import { BaseScene } from './core/BaseScene.js';
import { SceneFactory } from './core/SceneFactory.js';
import { InteractionSystem } from './core/InteractionSystem.js';

/**
 * Escena Dropin con sistema FPS, interacción y cajas
 * Usando la nueva arquitectura modular
 */
class DropinScene extends BaseScene {
    constructor() {
        super('dropin', {
            enableInteraction: true,
            showHint: true,
            includePlayer: true,
            includeGrid: true,
            includeAxes: true,
            includeGroundPlane: true,
        });
    }

    customizeScene() {
        // Crear cajas interactivas específicas de dropin
        this.createInteractiveBoxes();
    }

    createInteractiveBoxes() {
        // Caja roja interactiva
        this.redBox = SceneFactory.createInteractiveBox(this.threeScene, {
            position: [2, 1.75, 0],
            color: 0xFF0000,
            userData: {
                action: 'showAuriaInfo',
                description: 'Información sobre Auria Visual'
            }
        });

        // Caja verde en el suelo
        this.greenBox = SceneFactory.createInteractiveBox(this.threeScene, {
            position: [-1, 0.5, -2],
            color: 0x00FF00
        });
    }

    customPostLoadSetup() {
        // Agregar física a las cajas
        this.addPhysicsBox(
            { x: 2, y: 1.75, z: 0 }, 
            { x: 0.5, y: 0.5, z: 0.5 },
            { friction: 0.8 }
        );
        
        this.addPhysicsBox(
            { x: -1, y: 0.5, z: -2 }, 
            { x: 0.5, y: 0.5, z: 0.5 },
            { friction: 0.8 }
        );
    }

    setupInteractions() {
        // Registrar acción para mostrar modal de Auria
        this.interactionSystem.addInteractiveObject(
            this.redBox,
            'showAuriaInfo',
            InteractionSystem.createAuriaInfoAction()
        );

        console.log('🔴 Interacciones configuradas - Click en cubo rojo para información');
    }
}

// Inicializar escena
const dropinScene = new DropinScene();
dropinScene.init().catch(console.error);