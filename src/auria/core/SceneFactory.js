import * as THREE from 'three';

/**
 * Factory para crear elementos comunes de escenas (luces, grid, jugador, etc.)
 */
export class SceneFactory {
    
    /**
     * Crear escena Three.js básica con luces
     */
    static createBaseScene() {
        const threeScene = new THREE.Scene();
        
        // Luces básicas
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        threeScene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        threeScene.add(directionalLight);
        
        return threeScene;
    }

    /**
     * Agregar grid de referencia
     */
    static addGrid(scene, options = {}) {
        const {
            size = 20,
            divisions = 100,
            colorCenterLine = 0x00ff00,
            colorGrid = 0x888888,
            position = [0, 0, 0]
        } = options;

        const gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
        gridHelper.position.set(...position);
        scene.add(gridHelper);
        
        return gridHelper;
    }

    /**
     * Agregar ejes de coordenadas
     */
    static addAxes(scene, options = {}) {
        const {
            size = 2,
            position = [0, 0.05, 0]
        } = options;

        const axesHelper = new THREE.AxesHelper(size);
        axesHelper.position.set(...position);
        scene.add(axesHelper);
        
        return axesHelper;
    }

    /**
     * Agregar plano de referencia del suelo
     */
    static addGroundPlane(scene, options = {}) {
        const {
            size = [100, 100],
            color = 0x333333,
            opacity = 0.1,
            position = [0, -0.01, 0]
        } = options;

        const planeGeometry = new THREE.PlaneGeometry(...size);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(...position);
        scene.add(plane);
        
        return plane;
    }

    /**
     * Crear representación visual del jugador
     */
    static createPlayer(scene, options = {}) {
        const {
            bodyRadius = 0.15,
            bodyHeight = 1.8,
            headRadius = 0.12,
            bodyColor = 0x0066FF,
            headColor = 0xFFCC88,
            arrowColor = 0xFF0000,
            position = [1, 0, 0]
        } = options;

        const playerGroup = new THREE.Group();

        // Cuerpo del jugador (cilindro)
        const bodyGeometry = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        const playerBodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        playerBodyMesh.position.y = bodyHeight / 2;
        playerGroup.add(playerBodyMesh);

        // Cabeza del jugador (esfera)
        const headGeometry = new THREE.SphereGeometry(headRadius, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: headColor });
        const playerHead = new THREE.Mesh(headGeometry, headMaterial);
        playerHead.position.y = bodyHeight + headRadius;
        playerGroup.add(playerHead);

        // Marcador de dirección (flecha)
        const arrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
        const arrowMaterial = new THREE.MeshLambertMaterial({ color: arrowColor });
        const directionArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        directionArrow.position.set(0, bodyHeight + headRadius + 0.23, 0.15);
        directionArrow.rotation.x = Math.PI / 2;
        playerGroup.add(directionArrow);

        playerGroup.position.set(...position);
        scene.add(playerGroup);
        
        return playerGroup;
    }


    /**
     * Crear cámara personalizada para FPS
     */
    static createFPSCamera(options = {}) {
        const {
            fov = 75,
            aspect = window.innerWidth / window.innerHeight,
            near = 0.01,
            far = 100,
            position = [1, 2.7, 0]
        } = options;

        const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(...position);
        camera.rotation.order = 'YXZ';
        
        return camera;
    }

    /**
     * Crear cajas interactivas/colisionables
     */
    static createInteractiveBox(scene, options = {}) {
        const {
            size = [0.5, 0.5, 0.5],
            color = 0xFF0000,
            position = [0, 1, 0],
            userData = {}
        } = options;

        const boxGeometry = new THREE.BoxGeometry(...size);
        const boxMaterial = new THREE.MeshLambertMaterial({ color: color });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        
        box.position.set(...position);
        box.userData = { type: 'interactive', ...userData };
        
        scene.add(box);
        return box;
    }

    /**
     * Crear una escena completa con elementos estándar
     */
    static createStandardScene(options = {}) {
        const {
            includeGrid = true,
            includeAxes = true,
            includeGroundPlane = true,
            includePlayer = true,
            ...elementOptions
        } = options;

        const scene = this.createBaseScene();
        const elements = { scene };

        if (includeGrid) {
            elements.grid = this.addGrid(scene, elementOptions.grid);
        }

        if (includeAxes) {
            elements.axes = this.addAxes(scene, elementOptions.axes);
        }

        if (includeGroundPlane) {
            elements.groundPlane = this.addGroundPlane(scene, elementOptions.groundPlane);
        }

        if (includePlayer) {
            elements.player = this.createPlayer(scene, elementOptions.player);
        }

        return elements;
    }
}