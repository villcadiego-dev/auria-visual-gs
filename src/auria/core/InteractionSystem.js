import * as THREE from 'three';

/**
 * Sistema de interacción reutilizable para objetos en escenas FPS
 */
export class InteractionSystem {
    constructor(camera, options = {}) {
        this.camera = camera;
        this.options = {
            showHint: true,
            hintDuration: 5000,
            hintDelay: 3000,
            ...options
        };

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.interactiveObjects = [];
        this.isModalOpen = false;
        
        this.elements = {};
        this.actions = new Map();
    }

    init() {
        this.findDOMElements();
        this.setupEventListeners();
        this.showHintDelayed();
        
        console.log('🎯 InteractionSystem inicializado');
    }

    findDOMElements() {
        this.elements.modal = document.getElementById('info-modal');
        this.elements.closeBtn = document.querySelector('.close');
        this.elements.hint = document.getElementById('interaction-hint');
    }

    setupEventListeners() {
        // Click para interacción
        document.addEventListener('click', (event) => this.onMouseClick(event));
        
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (event) => {
                if (event.target === this.elements.modal) {
                    this.closeModal();
                }
            });
        }
        
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
    }

    showHintDelayed() {
        if (!this.options.showHint || !this.elements.hint) return;
        
        setTimeout(() => {
            this.elements.hint.style.display = 'block';
            setTimeout(() => {
                this.elements.hint.style.display = 'none';
            }, this.options.hintDuration);
        }, this.options.hintDelay);
    }

    addInteractiveObject(object, actionName, actionHandler) {
        // Agregar a lista de objetos interactivos
        this.interactiveObjects.push(object);
        
        // Registrar handler de acción
        this.actions.set(actionName, actionHandler);
        
        // Asegurar que el objeto tiene userData apropiado
        if (!object.userData) object.userData = {};
        object.userData.action = actionName;
        
        console.log(`📦 Objeto interactivo agregado con acción: ${actionName}`);
    }

    removeInteractiveObject(object) {
        const index = this.interactiveObjects.indexOf(object);
        if (index > -1) {
            this.interactiveObjects.splice(index, 1);
        }
    }

    onMouseClick(event) {
        // Solo funcionar si tenemos pointer lock y no hay modal abierto
        if (this.isModalOpen || !document.pointerLockElement) return;
        
        // Raycast desde el centro de la pantalla (crosshair)
        this.mouse.x = 0;
        this.mouse.y = 0;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Verificar intersecciones
        const intersects = this.raycaster.intersectObjects(this.interactiveObjects);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const userData = clickedObject.userData;
            
            if (userData.action) {
                this.executeAction(userData.action, clickedObject, intersects[0]);
            }
        }
    }

    executeAction(actionName, object, intersectionData) {
        const actionHandler = this.actions.get(actionName);
        
        if (actionHandler) {
            console.log(`🎯 Ejecutando acción: ${actionName}`);
            actionHandler(object, intersectionData);
        } else {
            console.warn(`Acción no registrada: ${actionName}`);
        }
    }

    showModal() {
        if (this.elements.modal) {
            this.elements.modal.style.display = 'block';
            this.isModalOpen = true;
            
            // Liberar pointer lock para permitir interacción con modal
            if (document.pointerLockElement) {
                document.exitPointerLock();
            }
        }
    }

    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.style.display = 'none';
            this.isModalOpen = false;
        }
    }

    // Acciones predefinidas comunes
    static createAuriaInfoAction() {
        return (object, intersectionData) => {
            const system = intersectionData.system || window.interactionSystem;
            if (system) {
                system.showModal();
                console.log('🔴 Mostrando información de Auria Visual');
            }
        };
    }

    static createCustomAction(callback) {
        return (object, intersectionData) => {
            callback(object, intersectionData);
        };
    }

    // Métodos de utilidad
    getInteractiveObjectsCount() {
        return this.interactiveObjects.length;
    }

    clearAllInteractiveObjects() {
        this.interactiveObjects = [];
        this.actions.clear();
    }

    // Cleanup
    destroy() {
        document.removeEventListener('click', this.onMouseClick);
        this.clearAllInteractiveObjects();
    }
}