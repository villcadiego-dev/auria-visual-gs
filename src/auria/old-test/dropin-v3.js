import { Viewer, DropInViewer, ArrowHelper } from '../auria-base.js';
import * as THREE from 'three';
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import * as CANNON from 'cannon-es';

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

        // Configuración de la cámara FPS
        this.cameraHeight = 0.4; // Altura de los ojos sobre el cuerpo del jugador
        this.yaw = 0; // Rotación horizontal (izquierda/derecha)
        this.pitch = 0; // Rotación vertical (arriba/abajo)
        this.maxPitch = Math.PI / 2 - 0.1; // Límite para evitar voltearse

        // Posición inicial FPS (donde están los ojos del jugador)
        this.camera.position.set(1, 1.5 + this.cameraHeight, 0);
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

// Caja 1 - Roja
const box1Material = new THREE.MeshLambertMaterial({'color': 0xFF0000}); // Rojo brillante
const box1 = new THREE.Mesh(boxGeometry, box1Material);
box1.position.set(2, 1.75, 0); // Manteniendo posición flotante que funcionaba
threeScene.add(box1);

// Caja 2 - Verde (en el suelo)
const box2Material = new THREE.MeshLambertMaterial({'color': 0x00FF00}); // Verde brillante
const box2 = new THREE.Mesh(boxGeometry, box2Material);
box2.position.set(-1, 0.5, -2); // Bajada al nivel del suelo
threeScene.add(box2);

// Crear representación del jugador (escala garden)
const playerGroup = new THREE.Group();

// Cuerpo del jugador (cilindro) - escala garden
const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x0066FF }); // Azul brillante
const playerBodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
playerBodyMesh.position.y = 0.3;
playerGroup.add(playerBodyMesh);

// Cabeza del jugador (esfera) - escala garden
const headGeometry = new THREE.SphereGeometry(0.12, 8, 8);
const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFCC88 }); // Color carne más brillante
const playerHead = new THREE.Mesh(headGeometry, headMaterial);
playerHead.position.y = 0.72;
playerGroup.add(playerHead);

// Marcador de dirección (flecha) - escala garden
const arrowGeometry = new THREE.ConeGeometry(0.05, 0.2, 8);
const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 }); // Rojo brillante
const directionArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
directionArrow.position.set(0, 0.9, 0.15);
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
customCamera.position.set(1, 1.9, 0); // Posición FPS (ojos del jugador)
customCamera.rotation.order = 'YXZ';

const viewer = new Viewer({
    'threeScene': threeScene,
    'useBuiltInControls': false,  // Desactivar OrbitControls del viewer
    'camera': customCamera,  // Usar nuestra cámara personalizada
    sphericalHarmonicsDegree: 2
});

console.log('Viewer creado con cámara personalizada');

let controller;
let clock = new THREE.Clock();

viewer.addSplatScene('/assets/data/garden/garden_high.ksplat')
    .then(() => {
        viewer.start();

        // IMPORTANTE: Forzar la configuración FPS después de que el viewer la haya configurado
        setTimeout(() => {
            viewer.camera.position.set(1, 1.9, 0);
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
    })
    .catch((error) => {
        console.error('Error cargando splat scene:', error);
    });