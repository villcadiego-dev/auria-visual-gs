import { Viewer, DropInViewer, ArrowHelper } from './auria-base.js';

//import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

const urlParams = new URLSearchParams(window.location.search);
const mode = parseInt(urlParams.get('mode')) || 0;

const viewer = new Viewer({
    'cameraUp': [0.01933, -0.75830, -0.65161],
    'initialCameraPosition': [1.54163, 2.68515, -6.37228],
    'initialCameraLookAt': [0.45622, 1.95338, 1.51278],
    'sphericalHarmonicsDegree': 2
});
let path = '/assets/data/bonsai/bonsai' + (mode ? '_high' : '') + '.ksplat';
viewer.addSplatScene(path, {
    'progressiveLoad': false
})
    .then(() => {
        viewer.start();
    });