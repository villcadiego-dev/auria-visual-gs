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
        
        // Configuración de la cámara en tercera persona (escala garden)
        this.cameraDistance = 3; // Distancia de la cámara al jugador
        this.cameraHeight = 1.5; // Altura de la cámara sobre el jugador  
        this.cameraAngleX = 0; // Rotación horizontal (yaw)
        this.cameraAngleY = -0.3; // Rotación vertical (pitch) - ligeramente hacia abajo
        
        // Posición inicial en escala del garden (más cercana)
        this.camera.position.set(1, 2, 4);
        this.camera.lookAt(1, 1.5, 0);
        
        // Marcar que estamos controlando la cámara
        this.controllingCamera = true;
        console.log('Controlador toma control de la cámara');
        
        // Configurar mundo de física primero
        this.setupPhysicsWorld();
        
        // Configuración del cuerpo físico del jugador (escala garden)
        this.playerBody = new CANNON.Body({ mass: 75 });
        this.playerBody.addShape(new CANNON.Cylinder(0.15, 0.15, 0.6, 8)); // Más pequeño para escala garden
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
        
        console.log('Controles de tercera persona configurados: WASD para mover, Mouse para rotar cámara, Space para saltar');
    }
    
    setupPhysicsWorld() {
        // Crear el suelo
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
    }
    
    addPhysicsBox(position, size) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
        const body = new CANNON.Body({ mass: 10 });
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
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
            // Rotar cámara alrededor del jugador
            this.cameraAngleX -= event.movementX * 0.003; // Rotación horizontal
            this.cameraAngleY -= event.movementY * 0.003; // Rotación vertical
            
            // Limitar rotación vertical para evitar que la cámara se voltee
            this.cameraAngleY = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraAngleY));
        }
    }
    
    update(deltaTime) {
        // Actualizar mundo de física
        this.world.step(deltaTime);
        
        // Verificar si puede saltar
        this.canJump = this.playerBody.position.y < 2;
        
        // Calcular dirección de movimiento (relativa a la rotación de la cámara)
        this.direction.set(0, 0, 0);
        
        if (this.moveForward) this.direction.z -= 1;
        if (this.moveBackward) this.direction.z += 1;
        if (this.moveLeft) this.direction.x -= 1;
        if (this.moveRight) this.direction.x += 1;
        
        if (this.direction.length() > 0) {
            this.direction.normalize();
            
            // Aplicar rotación horizontal de la cámara al movimiento
            const rotatedDirection = new THREE.Vector3();
            rotatedDirection.x = this.direction.x * Math.cos(this.cameraAngleX) - this.direction.z * Math.sin(this.cameraAngleX);
            rotatedDirection.z = this.direction.x * Math.sin(this.cameraAngleX) + this.direction.z * Math.cos(this.cameraAngleX);
            
            // Aplicar velocidad al cuerpo físico
            const speed = 8;
            this.playerBody.velocity.x = rotatedDirection.x * speed;
            this.playerBody.velocity.z = rotatedDirection.z * speed;
        } else {
            // Detener movimiento horizontal cuando no hay input
            this.playerBody.velocity.x = 0;
            this.playerBody.velocity.z = 0;
        }
        
        // Actualizar marcador de posición
        if (this.positionMarker) {
            this.positionMarker.position.copy(this.playerBody.position);
        }
        
        // Cámara en tercera persona: calcular posición basada en ángulos
        const playerPos = this.playerBody.position;
        
        // Calcular posición de cámara usando coordenadas esféricas
        const camX = playerPos.x + this.cameraDistance * Math.cos(this.cameraAngleY) * Math.sin(this.cameraAngleX);
        const camY = playerPos.y + this.cameraHeight + this.cameraDistance * Math.sin(this.cameraAngleY);
        const camZ = playerPos.z + this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX);
        
        // Suavizar movimiento de cámara
        const targetCameraPos = new THREE.Vector3(camX, camY, camZ);
        this.camera.position.lerp(targetCameraPos, 0.1);
        
        // Siempre mirar al jugador
        this.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
        
        // Asegurar que mantenemos control de la cámara
        if (this.controllingCamera) {
            this.camera.updateProjectionMatrix();
        }
    }
}

const threeScene = new THREE.Scene();

// Agregar luces para mejor visibilidad
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
threeScene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
threeScene.add(directionalLight);

// Crear grid de referencia para visualizar posición (escala garden)
const gridHelper = new THREE.GridHelper(10, 50, 0x00ff00, 0x888888); // Más pequeño para escala garden
gridHelper.position.y = 0;
threeScene.add(gridHelper);

// Crear ejes de coordenadas para orientación (escala garden)
const axesHelper = new THREE.AxesHelper(2);
axesHelper.position.set(0, 0.05, 0);
threeScene.add(axesHelper);

// Crear un plano semi-transparente como referencia del suelo
const planeGeometry = new THREE.PlaneGeometry(50, 50);
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

// Crear cajas para colisiones (escala garden)
const boxColor = 0xFFFFFF; // Blanco más visible
const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Escala garden
const boxMaterial = new THREE.MeshLambertMaterial({'color': boxColor});
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
boxMesh.position.set(2, 1.75, 0); // Cerca del jugador
threeScene.add(boxMesh);

// Crear más cajas para testing
const box2Material = new THREE.MeshLambertMaterial({'color': 0xFF0000}); // Rojo brillante
const box2 = new THREE.Mesh(boxGeometry, box2Material);
box2.position.set(0, 1.75, 0); // Al lado del jugador
threeScene.add(box2);

const box3Material = new THREE.MeshLambertMaterial({'color': 0x00FF00}); // Verde brillante  
const box3 = new THREE.Mesh(boxGeometry, box3Material);
box3.position.set(1, 1.75, -1); // Al frente del jugador
threeScene.add(box3);

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

// Crear cámara personalizada antes del viewer (escala garden)
const customCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
customCamera.position.set(1, 2, 4);
customCamera.lookAt(1, 1.5, 0);

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
        
        // IMPORTANTE: Forzar la posición de la cámara después de que el viewer la haya configurado
        setTimeout(() => {
            viewer.camera.position.set(1, 2, 4);
            viewer.camera.lookAt(1, 1.5, 0);
            console.log('Cámara reposicionada después de cargar PLY:', viewer.camera.position);
            
            // Verificar que los objetos sean visibles
            console.log('Verificando objetos en la escena:');
            console.log('Grid visible:', gridHelper.visible);
            console.log('Jugador visible:', positionMarker.visible);
            console.log('Número de objetos en escena:', threeScene.children.length);
        }, 100);
        
        // Inicializar controlador de primera persona
        controller = new FirstPersonController(viewer, positionMarker);
        
        // Agregar cajas físicas (escala garden)
        controller.addPhysicsBox(new THREE.Vector3(2, 1.75, 0), new THREE.Vector3(0.5, 0.5, 0.5));
        controller.addPhysicsBox(new THREE.Vector3(0, 1.75, 0), new THREE.Vector3(0.5, 0.5, 0.5));
        controller.addPhysicsBox(new THREE.Vector3(1, 1.75, -1), new THREE.Vector3(0.5, 0.5, 0.5));
        
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