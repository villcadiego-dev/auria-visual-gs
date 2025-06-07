import { Viewer } from '../auria-base.js';
import { getSceneConfig, getSplatLoadOptions } from '../scene-configs.js';
import { FPSController } from './FPSController.js';
import { TransformControls } from './TransformControls.js';
import { SceneFactory } from './SceneFactory.js';
import { InteractionSystem } from './InteractionSystem.js';

/**
 * Clase base para crear escenas FPS con Gaussian Splats
 * Encapsula toda la funcionalidad común entre escenas
 */
export class BaseScene {
    constructor(sceneName, options = {}) {
        this.sceneName = sceneName;
        this.options = {
            // Opciones de escena
            includePlayer: true,
            includeGrid: true,
            includeAxes: true,
            includeGroundPlane: true,
            
            // Opciones de interacción
            enableInteraction: false,
            showHint: true,
            
            // Opciones de FPS
            cameraHeight: 1.2,
            moveSpeed: 2,
            
            // Opciones del viewer
            useBuiltInControls: false,
            dynamicScene: true,
            sphericalHarmonicsDegree: 2,
            
            ...options
        };

        // Referencias principales
        this.sceneConfig = null;
        this.loadOptions = null;
        this.threeScene = null;
        this.camera = null;
        this.viewer = null;
        this.clock = null;
        
        // Sistemas
        this.fpsController = null;
        this.transformControls = null;
        this.interactionSystem = null;
        
        // Elementos de escena
        this.sceneElements = {};
        this.splatScene = null;
    }

    async init() {
        try {
            console.log(`🎬 Inicializando escena: ${this.sceneName}`);
            
            // 1. Cargar configuración
            this.loadConfiguration();
            
            // 2. Crear escena Three.js
            this.createThreeScene();
            
            // 3. Crear cámara
            this.createCamera();
            
            // 4. Crear viewer
            this.createViewer();
            
            // 5. Cargar Gaussian Splat
            await this.loadSplatScene();
            
            // 6. Inicializar sistemas
            this.initializeSystems();
            
            // 7. Configuración post-carga
            this.postLoadSetup();
            
            // 8. Iniciar loop de renderizado
            this.startRenderLoop();
            
            console.log(`✅ Escena ${this.sceneName} inicializada correctamente`);
            
        } catch (error) {
            console.error(`❌ Error inicializando escena ${this.sceneName}:`, error);
            throw error;
        }
    }

    loadConfiguration() {
        this.sceneConfig = getSceneConfig(this.sceneName);
        this.loadOptions = getSplatLoadOptions(this.sceneName);
        
        if (!this.sceneConfig) {
            throw new Error(`Configuración no encontrada para escena: ${this.sceneName}`);
        }
        
        console.log(`📐 Configuración cargada:`, this.sceneConfig.defaultTransform);
    }

    createThreeScene() {
        const sceneElements = SceneFactory.createStandardScene({
            includeGrid: this.options.includeGrid,
            includeAxes: this.options.includeAxes,
            includeGroundPlane: this.options.includeGroundPlane,
            includePlayer: this.options.includePlayer,
        });
        
        this.threeScene = sceneElements.scene;
        this.sceneElements = sceneElements;
        
        // Permitir personalización de la escena
        this.customizeScene();
    }

    createCamera() {
        this.camera = SceneFactory.createFPSCamera({
            position: [1, 1.5 + this.options.cameraHeight, 0]
        });
    }

    createViewer() {
        this.viewer = new Viewer({
            'threeScene': this.threeScene,
            'useBuiltInControls': this.options.useBuiltInControls,
            'camera': this.camera,
            'dynamicScene': this.options.dynamicScene,
            sphericalHarmonicsDegree: this.options.sphericalHarmonicsDegree
        });
        
        console.log('Viewer creado con cámara personalizada');
    }

    async loadSplatScene() {
        try {
            await this.viewer.addSplatScene(this.sceneConfig.splatPath, this.loadOptions);
            this.viewer.start();
            
            // Obtener referencia a la escena splat
            this.splatScene = this.viewer.getSplatScene(0);
            
            console.log('✅ Gaussian Splat cargado correctamente');
            
        } catch (error) {
            console.error('❌ Error cargando Gaussian Splat:', error);
            throw error;
        }
    }

    initializeSystems() {
        // Inicializar clock
        import('three').then(({ Clock }) => {
            this.clock = new Clock();
        });

        // Inicializar FPS Controller
        if (this.options.includePlayer) {
            this.fpsController = new FPSController(
                this.viewer, 
                this.sceneElements.player,
                {
                    cameraHeight: this.options.cameraHeight,
                    moveSpeed: this.options.moveSpeed
                }
            );
        }

        // Inicializar Transform Controls
        this.transformControls = new TransformControls(this.splatScene, this.sceneConfig);
        
        // Inicializar Interaction System si está habilitado
        if (this.options.enableInteraction) {
            this.interactionSystem = new InteractionSystem(this.camera, {
                showHint: this.options.showHint
            });
        }
    }

    postLoadSetup() {
        // Configuración de cámara después de cargar
        setTimeout(() => {
            this.camera.position.set(1, 1.5 + this.options.cameraHeight, 0);
            this.camera.rotation.set(0, 0, 0);
            this.camera.rotation.order = 'YXZ';
        }, 100);

        // Inicializar controles de transformación
        setTimeout(() => {
            this.transformControls.init();
            
            if (this.interactionSystem) {
                this.interactionSystem.init();
                this.setupInteractions();
            }
            
            // Permitir configuración personalizada post-carga
            this.customPostLoadSetup();
            
        }, 200);
    }

    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (this.clock && this.fpsController) {
                const deltaTime = Math.min(this.clock.getDelta(), 0.02);
                this.fpsController.update(deltaTime);
            }
            
            // Permitir lógica de renderizado personalizada
            this.customRenderLogic();
        };
        
        animate();
    }

    // Métodos para personalización en clases heredadas
    customizeScene() {
        // Override en clases heredadas para personalizar la escena
    }

    customPostLoadSetup() {
        // Override en clases heredadas para configuración post-carga
    }

    setupInteractions() {
        // Override en clases heredadas para configurar interacciones
    }

    customRenderLogic() {
        // Override en clases heredadas para lógica de renderizado personalizada
    }

    // Métodos de utilidad
    addInteractiveBox(position, options = {}) {
        if (!this.interactionSystem) {
            console.warn('InteractionSystem no está habilitado');
            return null;
        }

        const box = SceneFactory.createInteractiveBox(this.threeScene, {
            position,
            ...options
        });

        return box;
    }

    addPhysicsBox(position, size, options = {}) {
        if (!this.fpsController) {
            console.warn('FPSController no está disponible');
            return null;
        }

        return this.fpsController.addPhysicsBox(position, size, options);
    }

    // Cleanup
    destroy() {
        if (this.fpsController) {
            this.fpsController.destroy();
        }
        
        if (this.interactionSystem) {
            this.interactionSystem.destroy();
        }
    }
}