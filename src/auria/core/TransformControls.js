import * as THREE from 'three';

/**
 * Controles reutilizables para transformar Gaussian Splats en tiempo real
 */
export class TransformControls {
    constructor(splatScene, sceneConfig) {
        this.splatScene = splatScene;
        this.sceneConfig = sceneConfig;
        this.isInitialized = false;
        
        // Elementos DOM
        this.elements = {};
        
        // Estado actual
        this.currentRotX = 0;
        this.currentRotY = 0;
        this.currentRotZ = 0;
        this.currentPosX = 0;
        this.currentPosY = 0;
        this.currentPosZ = 0;
    }

    init() {
        if (this.isInitialized) return;
        
        this.findDOMElements();
        this.initializeFromConfig();
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('🔄 TransformControls inicializados');
    }

    findDOMElements() {
        // Elementos de rotación
        this.elements.rotXSlider = document.getElementById('rotX');
        this.elements.rotYSlider = document.getElementById('rotY');
        this.elements.rotZSlider = document.getElementById('rotZ');
        this.elements.rotXValue = document.getElementById('rotX-value');
        this.elements.rotYValue = document.getElementById('rotY-value');
        this.elements.rotZValue = document.getElementById('rotZ-value');
        
        // Elementos de posición
        this.elements.posXSlider = document.getElementById('posX');
        this.elements.posYSlider = document.getElementById('posY');
        this.elements.posZSlider = document.getElementById('posZ');
        this.elements.posXValue = document.getElementById('posX-value');
        this.elements.posYValue = document.getElementById('posY-value');
        this.elements.posZValue = document.getElementById('posZ-value');
        
        // Displays
        this.elements.quatValues = document.getElementById('quat-values');
        this.elements.posValues = document.getElementById('pos-values');
        this.elements.resetButton = document.getElementById('reset-button');

        // Verificar que todos los elementos existen
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
            
        if (missingElements.length > 0) {
            console.warn('TransformControls: Elementos faltantes:', missingElements);
        }
    }

    initializeFromConfig() {
        if (!this.sceneConfig) return;

        const defaultTransform = this.sceneConfig.defaultTransform;
        
        // Convertir quaternion a ángulos de Euler
        const defaultQuaternion = new THREE.Quaternion(
            defaultTransform.rotation[0], 
            defaultTransform.rotation[1], 
            defaultTransform.rotation[2], 
            defaultTransform.rotation[3]
        );
        const defaultEuler = new THREE.Euler().setFromQuaternion(defaultQuaternion, 'XYZ');
        
        // Establecer valores iniciales
        this.currentRotX = THREE.MathUtils.radToDeg(defaultEuler.x);
        this.currentRotY = THREE.MathUtils.radToDeg(defaultEuler.y);
        this.currentRotZ = THREE.MathUtils.radToDeg(defaultEuler.z);
        this.currentPosX = defaultTransform.position[0];
        this.currentPosY = defaultTransform.position[1];
        this.currentPosZ = defaultTransform.position[2];

        this.updateSlidersAndDisplays();
        this.updateTransform();
    }

    updateSlidersAndDisplays() {
        // Actualizar sliders
        if (this.elements.rotXSlider) this.elements.rotXSlider.value = this.currentRotX;
        if (this.elements.rotYSlider) this.elements.rotYSlider.value = this.currentRotY;
        if (this.elements.rotZSlider) this.elements.rotZSlider.value = this.currentRotZ;
        if (this.elements.posXSlider) this.elements.posXSlider.value = this.currentPosX;
        if (this.elements.posYSlider) this.elements.posYSlider.value = this.currentPosY;
        if (this.elements.posZSlider) this.elements.posZSlider.value = this.currentPosZ;
        
        // Actualizar displays de valores
        if (this.elements.rotXValue) this.elements.rotXValue.textContent = this.currentRotX.toFixed(0) + '°';
        if (this.elements.rotYValue) this.elements.rotYValue.textContent = this.currentRotY.toFixed(0) + '°';
        if (this.elements.rotZValue) this.elements.rotZValue.textContent = this.currentRotZ.toFixed(0) + '°';
        if (this.elements.posXValue) this.elements.posXValue.textContent = this.currentPosX.toFixed(1);
        if (this.elements.posYValue) this.elements.posYValue.textContent = this.currentPosY.toFixed(1);
        if (this.elements.posZValue) this.elements.posZValue.textContent = this.currentPosZ.toFixed(1);
    }

    updateTransform() {
        if (!this.splatScene) {
            console.warn('splatScene no está disponible');
            return;
        }
        
        // Aplicar posición
        this.splatScene.position.set(this.currentPosX, this.currentPosY, this.currentPosZ);
        
        // Convertir ángulos de grados a radianes
        const radX = THREE.MathUtils.degToRad(this.currentRotX);
        const radY = THREE.MathUtils.degToRad(this.currentRotY);
        const radZ = THREE.MathUtils.degToRad(this.currentRotZ);
        
        // Crear quaternion desde ángulos de Euler
        const euler = new THREE.Euler(radX, radY, radZ, 'XYZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        // Aplicar rotación
        this.splatScene.quaternion.copy(quaternion);
        
        // Forzar actualización de matrices
        this.splatScene.updateMatrix();
        this.splatScene.updateMatrixWorld(true);
        
        // Llamar updateTransform si existe
        if (this.splatScene.updateTransform) {
            this.splatScene.updateTransform(true);
        }
        
        // Actualizar displays de valores calculados
        if (this.elements.quatValues) {
            this.elements.quatValues.textContent = 
                `[${quaternion.x.toFixed(4)}, ${quaternion.y.toFixed(4)}, ${quaternion.z.toFixed(4)}, ${quaternion.w.toFixed(4)}]`;
        }
        if (this.elements.posValues) {
            this.elements.posValues.textContent = 
                `[${this.currentPosX.toFixed(1)}, ${this.currentPosY.toFixed(1)}, ${this.currentPosZ.toFixed(1)}]`;
        }
    }

    setupEventListeners() {
        // Event listeners para rotación
        if (this.elements.rotXSlider) {
            this.elements.rotXSlider.addEventListener('input', (e) => {
                this.currentRotX = parseInt(e.target.value);
                if (this.elements.rotXValue) this.elements.rotXValue.textContent = this.currentRotX + '°';
                this.updateTransform();
            });
        }
        
        if (this.elements.rotYSlider) {
            this.elements.rotYSlider.addEventListener('input', (e) => {
                this.currentRotY = parseInt(e.target.value);
                if (this.elements.rotYValue) this.elements.rotYValue.textContent = this.currentRotY + '°';
                this.updateTransform();
            });
        }
        
        if (this.elements.rotZSlider) {
            this.elements.rotZSlider.addEventListener('input', (e) => {
                this.currentRotZ = parseInt(e.target.value);
                if (this.elements.rotZValue) this.elements.rotZValue.textContent = this.currentRotZ + '°';
                this.updateTransform();
            });
        }

        // Event listeners para posición
        if (this.elements.posXSlider) {
            this.elements.posXSlider.addEventListener('input', (e) => {
                this.currentPosX = parseFloat(e.target.value);
                if (this.elements.posXValue) this.elements.posXValue.textContent = this.currentPosX.toFixed(1);
                this.updateTransform();
            });
        }
        
        if (this.elements.posYSlider) {
            this.elements.posYSlider.addEventListener('input', (e) => {
                this.currentPosY = parseFloat(e.target.value);
                if (this.elements.posYValue) this.elements.posYValue.textContent = this.currentPosY.toFixed(1);
                this.updateTransform();
            });
        }
        
        if (this.elements.posZSlider) {
            this.elements.posZSlider.addEventListener('input', (e) => {
                this.currentPosZ = parseFloat(e.target.value);
                if (this.elements.posZValue) this.elements.posZValue.textContent = this.currentPosZ.toFixed(1);
                this.updateTransform();
            });
        }

        // Botón de reset
        if (this.elements.resetButton) {
            this.elements.resetButton.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }
    }

    resetToDefaults() {
        this.initializeFromConfig();
        console.log('🔄 Valores reseteados a configuración por defecto');
    }

    // Método para actualizar la referencia del splatScene si cambia
    setSplatScene(splatScene) {
        this.splatScene = splatScene;
        if (this.isInitialized) {
            this.updateTransform();
        }
    }
}