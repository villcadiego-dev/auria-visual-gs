import { Viewer, DropInViewer, ArrowHelper } from './auria-base.js';


const urlParams = new URLSearchParams(window.location.search);
const mode = parseInt(urlParams.get('mode')) || 0;

const viewer = new Viewer({
    cameraUp: [0, -1, -1.0],
    initialCameraPosition: [-3.3816, 1.96931, -1.71890],
    initialCameraLookAt: [-0.04979, 1.37519, 1.13443],
    sphericalHarmonicsDegree: 2
});
let path = '/assets/data/stump/stump' + (mode ? '_high' : '') + '.ksplat';
viewer.addSplatScene(path, {
    'progressiveLoad': false
})
    .then(() => {
        viewer.start();
    });