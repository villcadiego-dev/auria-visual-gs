import { Viewer, DropInViewer, ArrowHelper } from '../auria-base.js';
import * as THREE from 'three';
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import * as CANNON from 'cannon-es';
import { getSceneConfig, getSplatLoadOptions, applyDefaultTransform } from '../scene-configs.js';

// Variables globales para interacción - DECLARADAS AL INICIO
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let interactiveObjects = []; // Array de objetos interactivos
let isModalOpen = false;

class FirstPersonController {
    constructor(viewer, positionMarker) {
        this.viewer = viewer;
        this.camera = viewer.camera;
        this.positionMarker = positionMarker;

        // Configuración del mundo de física
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();

        // Variables de control
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.isPointerLocked = false;

        // Configuración de la cámara FPS - TRIPLICADA la altura
        this.cameraHeight = 1.2; // Altura de los ojos sobre el cuerpo del jugador (triplicada: 0.4 * 3)
        this.yaw = 0; // Rotación horizontal (izquierda/derecha)
        this.pitch = 0; // Rotación vertical (arriba/abajo)
        this.maxPitch = Math.PI / 2 - 0.1; // Límite para evitar voltearse

        // Posición inicial FPS (donde están los ojos del jugador) - MÁS ALTA
        this.camera.position.set(1, 1.5 + this.cameraHeight, 0); // Ahora será Y = 2.7 en lugar de 1.9
        this.camera.rotation.order = 'YXZ'; // Orden importante para FPS

        // Marcar que estamos controlando la cámara
        this.controllingCamera = true;
        console.log('Controlador toma control de la cámara');

        // Configurar mundo de física primero
        this.setupPhysicsWorld();

        // Configuración del cuerpo físico del jugador (escala garden) - radio aumentado para mejor colisión
        this.playerBody = new CANNON.Body({ mass: 75 });
        this.playerBody.addShape(new CANNON.Cylinder(0.25, 0.25, 0.6, 8)); // Radio aumentado de 0.15 a 0.25
        this.playerBody.position.set(1, 1.5, 0); // Posición en escala garden
        this.playerBody.material = new CANNON.Material();
        this.playerBody.material.friction = 0.1;
        this.world.addBody(this.playerBody);

        // PointerLock para el mouse
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.PI_2 = Math.PI / 2;

        this.setupEventListeners();


        console.log('FirstPersonController inicializado');
    }

    setupEventListeners() {
        // Control de teclado
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));

        // Control de mouse para rotar cámara
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
            console.log('Pointer lock:', this.isPointerLocked);
        });

        document.addEventListener('mousemove', (event) => this.onMouseMove(event));

        // Prevenir el comportamiento por defecto que pueda interferir
        document.addEventListener('contextmenu', (event) => event.preventDefault());

        console.log('Controles FPS configurados: WASD para mover, Mouse para mirar, Space para saltar');
    }

    setupPhysicsWorld() {
        // Crear el suelo
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);

        // Crear paredes invisibles en los límites de la grilla (20x20)
        const wallHeight = 5;
        const wallThickness = 0.5;
        const gridSize = 10; // Radio desde el centro (grilla 20x20 va de -10 a +10)

        // Pared Norte (Z = -10)
        const northWall = new CANNON.Box(new CANNON.Vec3(gridSize, wallHeight, wallThickness));
        const northWallBody = new CANNON.Body({ mass: 0 });
        northWallBody.addShape(northWall);
        northWallBody.position.set(0, wallHeight, -gridSize);
        this.world.addBody(northWallBody);

        // Pared Sur (Z = +10)
        const southWall = new CANNON.Box(new CANNON.Vec3(gridSize, wallHeight, wallThickness));
        const southWallBody = new CANNON.Body({ mass: 0 });
        southWallBody.addShape(southWall);
        southWallBody.position.set(0, wallHeight, gridSize);
        this.world.addBody(southWallBody);

        // Pared Oeste (X = -10)
        const westWall = new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, gridSize));
        const westWallBody = new CANNON.Body({ mass: 0 });
        westWallBody.addShape(westWall);
        westWallBody.position.set(-gridSize, wallHeight, 0);
        this.world.addBody(westWallBody);

        // Pared Este (X = +10)
        const eastWall = new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight, gridSize));
        const eastWallBody = new CANNON.Body({ mass: 0 });
        eastWallBody.addShape(eastWall);
        eastWallBody.position.set(gridSize, wallHeight, 0);
        this.world.addBody(eastWallBody);

        console.log('Paredes invisibles creadas en los límites de la grilla 20x20');
    }

    addPhysicsBox(position, size) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
        const body = new CANNON.Body({ mass: 0 }); // Masa 0 = estático, no se mueve
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
        // Agregar fricción para mejor interacción
        body.material = new CANNON.Material();
        body.material.friction = 0.8;
        this.world.addBody(body);
        return body;
    }

    onKeyDown(event) {
        console.log('Key down:', event.code);
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                event.preventDefault();
                if (this.canJump) {
                    this.playerBody.velocity.y = 8;
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    onMouseMove(event) {
        if (this.isPointerLocked) {
            // Control de cámara FPS - el mouse controla hacia dónde miras
            this.yaw -= event.movementX * 0.002; // Rotación horizontal (mouse izq/der)
            this.pitch -= event.movementY * 0.002; // Rotación vertical (mouse arriba/abajo)
            
            // Limitar pitch para evitar que la cámara se voltee
            this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
            
            // Aplicar rotaciones directamente a la cámara
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
        }
    }

    update(deltaTime) {
        // Actualizar mundo de física
        this.world.step(deltaTime);

        // Verificar si puede saltar
        this.canJump = this.playerBody.position.y < 2;

        // Calcular dirección de movimiento (relativo a donde mira la cámara)
        this.direction.set(0, 0, 0);

        if (this.moveForward) this.direction.z -= 1;   // W - adelante
        if (this.moveBackward) this.direction.z += 1;  // S - atrás
        if (this.moveLeft) this.direction.x -= 1;      // A - izquierda
        if (this.moveRight) this.direction.x += 1;     // D - derecha

        if (this.direction.length() > 0) {
            this.direction.normalize();

            // Rotar la dirección según el yaw de la cámara (dirección horizontal)
            const cos = Math.cos(this.yaw);
            const sin = Math.sin(this.yaw);
            
            // Matriz de rotación correcta para FPS (invertir sin para que W vaya hacia donde miras)
            const rotatedX = this.direction.x * cos + this.direction.z * sin;
            const rotatedZ = -this.direction.x * sin + this.direction.z * cos;

            // Aplicar velocidad rotada según la dirección de la cámara
            const speed = 2;
            this.playerBody.velocity.x = rotatedX * speed;
            this.playerBody.velocity.z = rotatedZ * speed;
        } else {
            // Detener movimiento horizontal cuando no hay input
            this.playerBody.velocity.x = 0;
            this.playerBody.velocity.z = 0;
        }

        // Actualizar marcador de posición
        if (this.positionMarker) {
            this.positionMarker.position.copy(this.playerBody.position);
        }

        // Cámara FPS: posicionar en los ojos del jugador
        const playerPos = this.playerBody.position;
        this.camera.position.set(
            playerPos.x,
            playerPos.y + this.cameraHeight,
            playerPos.z
        );

        // Mantener rotaciones FPS
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.z = 0; // Sin roll
    }
}

const threeScene = new THREE.Scene();

// Agregar luces para mejor visibilidad
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
threeScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
threeScene.add(directionalLight);

// Crear grid de referencia para visualizar posición (escala garden - doble tamaño)
const gridHelper = new THREE.GridHelper(20, 100, 0x00ff00, 0x888888); // Duplicado: 20x20 con 100 divisiones
gridHelper.position.y = 0;
threeScene.add(gridHelper);

// Crear ejes de coordenadas para orientación (escala garden)
const axesHelper = new THREE.AxesHelper(2);
axesHelper.position.set(0, 0.05, 0);
threeScene.add(axesHelper);

// Crear un plano semi-transparente como referencia del suelo (doble tamaño)
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.01;
threeScene.add(plane);

// Crear 2 cajas para colisiones (manteniendo posición flotante que funcionaba)
const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

// Caja 1 - Roja (INTERACTIVA)
const box1Material = new THREE.MeshLambertMaterial({'color': 0xFF0000}); // Rojo brillante
const box1 = new THREE.Mesh(boxGeometry, box1Material);
box1.position.set(2, 1.75, 0); // Manteniendo posición flotante que funcionaba
box1.userData = { 
    type: 'interactive', 
    action: 'showAuriaInfo',
    description: 'Información sobre Auria Visual' 
};
threeScene.add(box1);
interactiveObjects.push(box1); // Agregar a objetos interactivos

// Caja 2 - Verde (en el suelo)
const box2Material = new THREE.MeshLambertMaterial({'color': 0x00FF00}); // Verde brillante
const box2 = new THREE.Mesh(boxGeometry, box2Material);
box2.position.set(-1, 0.5, -2); // Bajada al nivel del suelo
threeScene.add(box2);

// Crear representación del jugador (escala garden)
const playerGroup = new THREE.Group();

// Cuerpo del jugador (cilindro) - MÁS ALTO (triplicado)
const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.8, 8); // Altura triplicada: 0.6 * 3 = 1.8
const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x0066FF }); // Azul brillante
const playerBodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
playerBodyMesh.position.y = 0.9; // Centrado: 1.8 / 2 = 0.9
playerGroup.add(playerBodyMesh);

// Cabeza del jugador (esfera) - MÁS ALTA
const headGeometry = new THREE.SphereGeometry(0.12, 8, 8);
const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFCC88 }); // Color carne más brillante
const playerHead = new THREE.Mesh(headGeometry, headMaterial);
playerHead.position.y = 1.92; // En la parte superior del cuerpo más alto: 1.8 + 0.12 = 1.92
playerGroup.add(playerHead);

// Marcador de dirección (flecha) - MÁS ALTA
const arrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 }); // Rojo brillante
const directionArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
directionArrow.position.set(0, 2.15, 0.15); // Encima de la cabeza más alta
directionArrow.rotation.x = Math.PI / 2;
playerGroup.add(directionArrow);

playerGroup.position.set(1, 0, 0); // Posición inicial en escala garden
const positionMarker = playerGroup; // Usar el grupo como marcador
threeScene.add(positionMarker);

// Cargar modelo FBX (opcional, ya no necesario para primera persona)
const loader = new FBXLoader();
loader.setPath('/assets/models/');
loader.load('person.fbx', (fbx) => {
    fbx.scale.setScalar(0.015);
    fbx.position.set(5, 0, 15);
    fbx.traverse(c => {
        c.castShadow = true;
    });
    threeScene.add(fbx);
});

// Crear cámara personalizada FPS antes del viewer (escala garden)
const customCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
customCamera.position.set(1, 2.7, 0); // Posición FPS (ojos del jugador) - MÁS ALTA
customCamera.rotation.order = 'YXZ';

const viewer = new Viewer({
    'threeScene': threeScene,
    'useBuiltInControls': false,  // Desactivar OrbitControls del viewer
    'camera': customCamera,  // Usar nuestra cámara personalizada
    'dynamicScene': true,  // IMPORTANTE: Habilitar modo dinámico para transformaciones en tiempo real
    sphericalHarmonicsDegree: 2
});

console.log('Viewer creado con cámara personalizada');

let controller;
let clock = new THREE.Clock();
let splatScene; // Referencia a la escena splat para rotación en tiempo real

// Configuración de la escena dropin desde scene-configs.js
const sceneName = 'dropin';
const sceneConfig = getSceneConfig(sceneName);
const loadOptions = getSplatLoadOptions(sceneName);

console.log(`🎬 Cargando escena: ${sceneConfig.name}`);
console.log('📐 Configuración aplicada:', sceneConfig.defaultTransform);

viewer.addSplatScene(sceneConfig.splatPath, loadOptions)
    .then(() => {
        viewer.start();
        
        // Obtener referencia a la escena splat para control en tiempo real
        splatScene = viewer.getSplatScene(0);
        console.log('Escena splat obtenida para control de rotación:', splatScene);
        console.log('Modo dinámico habilitado:', viewer.dynamicScene);
        console.log('SplatMesh disponible:', !!viewer.splatMesh);

        // IMPORTANTE: Forzar la configuración FPS después de que el viewer la haya configurado
        setTimeout(() => {
            viewer.camera.position.set(1, 2.7, 0); // Altura actualizada: 1.5 + 1.2 = 2.7
            viewer.camera.rotation.set(0, 0, 0);
            viewer.camera.rotation.order = 'YXZ';
            console.log('Cámara FPS reposicionada después de cargar PLY:', viewer.camera.position);

            // Verificar que los objetos sean visibles
            console.log('Verificando objetos en la escena:');
            console.log('Grid visible:', gridHelper.visible);
            console.log('Jugador visible:', positionMarker.visible);
            console.log('Número de objetos en escena:', threeScene.children.length);
        }, 100);

        // Inicializar controlador de primera persona
        controller = new FirstPersonController(viewer, positionMarker);

        // Agregar cajas físicas - caja roja flotante, caja verde en el suelo
        controller.addPhysicsBox(new THREE.Vector3(2, 1.75, 0), new THREE.Vector3(0.5, 0.5, 0.5)); // Caja roja flotante
        controller.addPhysicsBox(new THREE.Vector3(-1, 0.5, -2), new THREE.Vector3(0.5, 0.5, 0.5)); // Caja verde en el suelo

        console.log('Viewer iniciado, controlador creado');
        console.log('Posición inicial de cámara:', viewer.camera.position);

        // Loop de renderizado
        function animate() {
            requestAnimationFrame(animate);
            const deltaTime = Math.min(clock.getDelta(), 0.02); // Limitar deltaTime

            if (controller) {
                controller.update(deltaTime);
            }
        }

        animate();
        
        // Configurar controles de rotación después de que todo esté listo
        setupRotationControls();
        
        // Configurar sistema de interacción
        setupInteractionSystem();
    })
    .catch((error) => {
        console.error('Error cargando splat scene:', error);
    });

// Función para configurar los controles de rotación y posición en tiempo real
function setupRotationControls() {
    const rotXSlider = document.getElementById('rotX');
    const rotYSlider = document.getElementById('rotY');
    const rotZSlider = document.getElementById('rotZ');
    const rotXValue = document.getElementById('rotX-value');
    const rotYValue = document.getElementById('rotY-value');
    const rotZValue = document.getElementById('rotZ-value');
    const quatValues = document.getElementById('quat-values');
    
    // Controles de posición
    const posXSlider = document.getElementById('posX');
    const posYSlider = document.getElementById('posY');
    const posZSlider = document.getElementById('posZ');
    const posXValue = document.getElementById('posX-value');
    const posYValue = document.getElementById('posY-value');
    const posZValue = document.getElementById('posZ-value');
    const posValues = document.getElementById('pos-values');
    
    // Obtener valores por defecto desde la configuración
    const defaultTransform = sceneConfig.defaultTransform;
    
    // Convertir quaternion a ángulos de Euler para los sliders
    const defaultQuaternion = new THREE.Quaternion(
        defaultTransform.rotation[0], 
        defaultTransform.rotation[1], 
        defaultTransform.rotation[2], 
        defaultTransform.rotation[3]
    );
    const defaultEuler = new THREE.Euler().setFromQuaternion(defaultQuaternion, 'XYZ');
    
    // Variables para mantener los valores actuales (inicializados con defaults)
    let currentRotX = THREE.MathUtils.radToDeg(defaultEuler.x);
    let currentRotY = THREE.MathUtils.radToDeg(defaultEuler.y);
    let currentRotZ = THREE.MathUtils.radToDeg(defaultEuler.z);
    let currentPosX = defaultTransform.position[0];
    let currentPosY = defaultTransform.position[1];
    let currentPosZ = defaultTransform.position[2];
    
    // Establecer valores iniciales en los sliders
    rotXSlider.value = currentRotX;
    rotYSlider.value = currentRotY;
    rotZSlider.value = currentRotZ;
    posXSlider.value = currentPosX;
    posYSlider.value = currentPosY;
    posZSlider.value = currentPosZ;
    
    // Actualizar displays iniciales
    rotXValue.textContent = currentRotX.toFixed(0) + '°';
    rotYValue.textContent = currentRotY.toFixed(0) + '°';
    rotZValue.textContent = currentRotZ.toFixed(0) + '°';
    posXValue.textContent = currentPosX.toFixed(1);
    posYValue.textContent = currentPosY.toFixed(1);
    posZValue.textContent = currentPosZ.toFixed(1);
    
    // Actualizar displays con valores por defecto
    updateTransform();
    
    function updateTransform() {
        if (!splatScene) {
            console.warn('splatScene no está disponible');
            return;
        }
        
        // Aplicar posición
        splatScene.position.set(currentPosX, currentPosY, currentPosZ);
        
        // Convertir ángulos de grados a radianes
        const radX = THREE.MathUtils.degToRad(currentRotX);
        const radY = THREE.MathUtils.degToRad(currentRotY);
        const radZ = THREE.MathUtils.degToRad(currentRotZ);
        
        // Crear quaternion desde los ángulos de Euler
        const euler = new THREE.Euler(radX, radY, radZ, 'XYZ');
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        
        // Aplicar rotación a la escena splat
        splatScene.quaternion.copy(quaternion);
        
        // Forzar actualización de la matriz de transformación
        splatScene.updateMatrix();
        splatScene.updateMatrixWorld(true);
        
        // Actualizar displays
        quatValues.textContent = `[${quaternion.x.toFixed(4)}, ${quaternion.y.toFixed(4)}, ${quaternion.z.toFixed(4)}, ${quaternion.w.toFixed(4)}]`;
        posValues.textContent = `[${currentPosX.toFixed(1)}, ${currentPosY.toFixed(1)}, ${currentPosZ.toFixed(1)}]`;
    }
    
    // Event listeners para los sliders de rotación
    rotXSlider.addEventListener('input', (e) => {
        currentRotX = parseInt(e.target.value);
        rotXValue.textContent = currentRotX + '°';
        updateTransform();
    });
    
    rotYSlider.addEventListener('input', (e) => {
        currentRotY = parseInt(e.target.value);
        rotYValue.textContent = currentRotY + '°';
        updateTransform();
    });
    
    rotZSlider.addEventListener('input', (e) => {
        currentRotZ = parseInt(e.target.value);
        rotZValue.textContent = currentRotZ + '°';
        updateTransform();
    });
    
    // Event listeners para los sliders de posición
    posXSlider.addEventListener('input', (e) => {
        currentPosX = parseFloat(e.target.value);
        posXValue.textContent = currentPosX.toFixed(1);
        updateTransform();
    });
    
    posYSlider.addEventListener('input', (e) => {
        currentPosY = parseFloat(e.target.value);
        posYValue.textContent = currentPosY.toFixed(1);
        updateTransform();
    });
    
    posZSlider.addEventListener('input', (e) => {
        currentPosZ = parseFloat(e.target.value);
        posZValue.textContent = currentPosZ.toFixed(1);
        updateTransform();
    });
    
    // Botón de reset
    const resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', () => {
        // Resetear a valores por defecto
        currentRotX = THREE.MathUtils.radToDeg(defaultEuler.x);
        currentRotY = THREE.MathUtils.radToDeg(defaultEuler.y);
        currentRotZ = THREE.MathUtils.radToDeg(defaultEuler.z);
        currentPosX = defaultTransform.position[0];
        currentPosY = defaultTransform.position[1];
        currentPosZ = defaultTransform.position[2];
        
        // Actualizar sliders
        rotXSlider.value = currentRotX;
        rotYSlider.value = currentRotY;
        rotZSlider.value = currentRotZ;
        posXSlider.value = currentPosX;
        posYSlider.value = currentPosY;
        posZSlider.value = currentPosZ;
        
        // Actualizar displays
        rotXValue.textContent = currentRotX.toFixed(0) + '°';
        rotYValue.textContent = currentRotY.toFixed(0) + '°';
        rotZValue.textContent = currentRotZ.toFixed(0) + '°';
        posXValue.textContent = currentPosX.toFixed(1);
        posYValue.textContent = currentPosY.toFixed(1);
        posZValue.textContent = currentPosZ.toFixed(1);
        
        // Aplicar transformación
        updateTransform();
        
        console.log('🔄 Valores reseteados a configuración por defecto');
    });
    
    console.log('🔄 Controles de rotación y posición configurados - usa los sliders para transformar el Gaussian splat');
    console.log('📐 Valores por defecto cargados desde scene-configs.js');
}

// Sistema de interacción con objetos
function setupInteractionSystem() {
    const modal = document.getElementById('info-modal');
    const closeBtn = document.querySelector('.close');
    const hint = document.getElementById('interaction-hint');
    
    // Mostrar hint después de un tiempo
    setTimeout(() => {
        hint.style.display = 'block';
        setTimeout(() => {
            hint.style.display = 'none';
        }, 5000);
    }, 3000);
    
    // Función para manejar clicks
    function onMouseClick(event) {
        if (isModalOpen || !controller.isPointerLocked) return;
        
        // Calcular posición del mouse en coordenadas normalizadas
        mouse.x = 0; // Centro de la pantalla en FPS
        mouse.y = 0; // Centro de la pantalla en FPS
        
        // Configurar raycaster desde el centro de la pantalla (crosshair)
        raycaster.setFromCamera(mouse, viewer.camera);
        
        // Verificar intersecciones con objetos interactivos
        const intersects = raycaster.intersectObjects(interactiveObjects);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const userData = clickedObject.userData;
            
            if (userData.action === 'showAuriaInfo') {
                showAuriaModal();
                console.log('🔴 Cubo rojo clickeado - Mostrando información de Auria Visual');
            }
        }
    }
    
    // Función para mostrar el modal
    function showAuriaModal() {
        modal.style.display = 'block';
        isModalOpen = true;
        // Liberar pointer lock para permitir interacción con el modal
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }
    
    // Función para cerrar el modal
    function closeModal() {
        modal.style.display = 'none';
        isModalOpen = false;
    }
    
    // Event listeners
    document.addEventListener('click', onMouseClick);
    
    closeBtn.addEventListener('click', closeModal);
    
    // Cerrar modal al hacer click fuera del contenido
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Escape' && isModalOpen) {
            closeModal();
        }
    });
    
    console.log('🎯 Sistema de interacción configurado - Click en objetos rojos para información');
}