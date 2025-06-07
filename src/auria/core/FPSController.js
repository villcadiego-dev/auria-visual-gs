import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Controlador FPS reutilizable para navegación en escenas Gaussian Splat
 */
export class FPSController {
    constructor(viewer, positionMarker, options = {}) {
        this.viewer = viewer;
        this.camera = viewer.camera;
        this.positionMarker = positionMarker;
        
        // Opciones configurables
        this.options = {
            cameraHeight: 1.2,
            playerMass: 75,
            playerRadius: 0.25,
            playerHeight: 0.6,
            moveSpeed: 2,
            jumpForce: 8,
            mouseSensitivity: 0.002,
            gridSize: 10, // Radio para paredes invisibles (20x20 total)
            ...options
        };

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
        this.yaw = 0; // Rotación horizontal
        this.pitch = 0; // Rotación vertical
        this.maxPitch = Math.PI / 2 - 0.1;

        this.init();
    }

    init() {
        // Configurar cámara inicial
        this.camera.position.set(1, 1.5 + this.options.cameraHeight, 0);
        this.camera.rotation.order = 'YXZ';

        // Configurar mundo de física
        this.setupPhysicsWorld();
        this.setupPlayerBody();
        this.setupEventListeners();

        console.log('FPSController inicializado');
    }

    setupPhysicsWorld() {
        // Crear el suelo
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);

        // Crear paredes invisibles
        this.createInvisibleWalls();
    }

    createInvisibleWalls() {
        const wallHeight = 5;
        const wallThickness = 0.5;
        const gridSize = this.options.gridSize;

        const walls = [
            { pos: [0, wallHeight, -gridSize], size: [gridSize, wallHeight, wallThickness] }, // Norte
            { pos: [0, wallHeight, gridSize], size: [gridSize, wallHeight, wallThickness] },  // Sur
            { pos: [-gridSize, wallHeight, 0], size: [wallThickness, wallHeight, gridSize] }, // Oeste
            { pos: [gridSize, wallHeight, 0], size: [wallThickness, wallHeight, gridSize] }   // Este
        ];

        walls.forEach(wall => {
            const shape = new CANNON.Box(new CANNON.Vec3(...wall.size));
            const body = new CANNON.Body({ mass: 0 });
            body.addShape(shape);
            body.position.set(...wall.pos);
            this.world.addBody(body);
        });

        console.log(`Paredes invisibles creadas en los límites de la grilla ${gridSize * 2}x${gridSize * 2}`);
    }

    setupPlayerBody() {
        this.playerBody = new CANNON.Body({ mass: this.options.playerMass });
        this.playerBody.addShape(new CANNON.Cylinder(
            this.options.playerRadius, 
            this.options.playerRadius, 
            this.options.playerHeight, 
            8
        ));
        this.playerBody.position.set(1, 1.5, 0);
        this.playerBody.material = new CANNON.Material();
        this.playerBody.material.friction = 0.1;
        this.world.addBody(this.playerBody);
    }

    setupEventListeners() {
        // Control de teclado
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));

        // Control de mouse
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
        });

        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        document.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space':
                event.preventDefault();
                if (this.canJump) {
                    this.playerBody.velocity.y = this.options.jumpForce;
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyD': this.moveRight = false; break;
        }
    }

    onMouseMove(event) {
        if (this.isPointerLocked) {
            this.yaw -= event.movementX * this.options.mouseSensitivity;
            this.pitch -= event.movementY * this.options.mouseSensitivity;
            
            this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
            
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
        }
    }

    addPhysicsBox(position, size, options = {}) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
        const body = new CANNON.Body({ mass: options.mass || 0 });
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
        
        if (options.friction) {
            body.material = new CANNON.Material();
            body.material.friction = options.friction;
        }
        
        this.world.addBody(body);
        return body;
    }

    update(deltaTime) {
        // Actualizar mundo de física
        this.world.step(deltaTime);

        // Verificar si puede saltar
        this.canJump = this.playerBody.position.y < 2;

        // Calcular dirección de movimiento
        this.direction.set(0, 0, 0);

        if (this.moveForward) this.direction.z -= 1;
        if (this.moveBackward) this.direction.z += 1;
        if (this.moveLeft) this.direction.x -= 1;
        if (this.moveRight) this.direction.x += 1;

        if (this.direction.length() > 0) {
            this.direction.normalize();

            // Rotar según la dirección de la cámara
            const cos = Math.cos(this.yaw);
            const sin = Math.sin(this.yaw);
            
            const rotatedX = this.direction.x * cos + this.direction.z * sin;
            const rotatedZ = -this.direction.x * sin + this.direction.z * cos;

            this.playerBody.velocity.x = rotatedX * this.options.moveSpeed;
            this.playerBody.velocity.z = rotatedZ * this.options.moveSpeed;
        } else {
            this.playerBody.velocity.x = 0;
            this.playerBody.velocity.z = 0;
        }

        // Actualizar marcador de posición
        if (this.positionMarker) {
            this.positionMarker.position.copy(this.playerBody.position);
        }

        // Actualizar posición de cámara
        const playerPos = this.playerBody.position;
        this.camera.position.set(
            playerPos.x,
            playerPos.y + this.options.cameraHeight,
            playerPos.z
        );

        // Mantener rotaciones FPS
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.z = 0;
    }

    // Método para configurar la cámara después de cargar el viewer
    resetCameraPosition() {
        this.camera.position.set(1, 1.5 + this.options.cameraHeight, 0);
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.order = 'YXZ';
    }

    // Cleanup
    destroy() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('contextmenu', this.onContextMenu);
    }
}