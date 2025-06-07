import { Viewer, DropInViewer, ArrowHelper } from '../auria-base.js';
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";

import { OrbitControls } from '../../OrbitControls.js';

//import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

function setupRenderer() {
    const renderWidth = window.innerWidth;
    const renderHeight = window.innerHeight;

    const rootElement = document.createElement('div');
    rootElement.style.width = renderWidth + 'px';
    rootElement.style.height = renderHeight + 'px';
    rootElement.style.position = 'relative';
    rootElement.style.left = '50%';
    rootElement.style.top = '50%';
    rootElement.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(rootElement);

    const renderer = new THREE.WebGLRenderer({
        antialias: false
    });
    renderer.setSize(renderWidth, renderHeight);
    rootElement.appendChild(renderer.domElement);

    return {
        'renderer': renderer,
        'renderWidth': renderWidth,
        'renderHeight': renderHeight
    }
}

function setupCamera(renderWidth, renderHeight) {
    const camera = new THREE.PerspectiveCamera(65, renderWidth / renderHeight, 0.1, 500);
    camera.position.copy(new THREE.Vector3().fromArray([-1, 0, 6]));
    camera.lookAt(new THREE.Vector3().fromArray([0, 0, -0]));
    camera.up = new THREE.Vector3().fromArray([0, 0, -0.6]).normalize();
    return camera;
}

function setupThreeScene() {
    const threeScene = new THREE.Scene();
    const boxColor = 0xBBBBBB;
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMesh = new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial({'color': boxColor}));
    threeScene.add(boxMesh);
    boxMesh.position.set(3, 2, 2);


    const loader = new FBXLoader();
    loader.setPath('/assets/models/');
    loader.load('person.fbx', (fbx) => {
        fbx.scale.setScalar(0.015);
        fbx.rotation.x = 0;
        fbx.position.y = 0;
        fbx.position.x = 0;
        fbx.traverse(c => {
            c.castShadow = true;
        });
        threeScene.add(fbx);
    });

    const grid = new THREE.GridHelper(100,100,0x808080);
    grid.rotation.x = 0;
    grid.position.y = 0;
    threeScene.add(grid);


    return threeScene;
}

function setupControls(camera, renderer) {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.5;
    controls.maxPolarAngle = Math.PI * .75;
    controls.minPolarAngle = 0.1;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    return controls;
}

const {renderer, renderWidth, renderHeight} = setupRenderer();
const camera = setupCamera(renderWidth, renderHeight);
const threeScene = setupThreeScene();
const controls = setupControls(camera, renderer);

const viewer = new DropInViewer();
viewer.addSplatScenes([
    {
        'path': '/assets/data/garden/garden_high.ksplat',
        'splatAlphaRemovalThreshold': 20,
    }
], true);
threeScene.add(viewer);



requestAnimationFrame(update);
function update() {
    requestAnimationFrame(update);
    controls.update();
    renderer.render(threeScene, camera);
}