import { Viewer, DropInViewer, ArrowHelper } from './auria-base.js';

const urlParams = new URLSearchParams(window.location.search);
const mode = parseInt(urlParams.get('mode')) || 0;

const viewer = new Viewer({
    cameraUp: [0, -1, -.17],
    initialCameraPosition: [-5, -1, -1],
    initialCameraLookAt: [-1.72477, 0.05395, -0.00147],
    sphericalHarmonicsDegree: 2
});
let path = '/assets/data/truck/truck' + (mode ? '_high' : '') + '.ksplat';
viewer.addSplatScene(path, {
    'progressiveLoad': false
})
    .then(() => {
        viewer.start();
    });