import { Viewer, DropInViewer, ArrowHelper } from './auria.js';


const urlParams = new URLSearchParams(window.location.search);
const mode = parseInt(urlParams.get('mode')) || 0;

const viewer = new Viewer({
    cameraUp: [0, -1, -0.54],
    initialCameraPosition: [-3.15634, -0.16946, -0.51552],
    initialCameraLookAt: [1.52976, 2.27776, 1.65898],
    sphericalHarmonicsDegree: 2
});


let path = `/assets/data/garden/garden${mode ? '_high' : ''}.ksplat`;

viewer.addSplatScene(path, { progressiveLoad: false })
    .then(() => {
        // console.log('✅ Splat cargado, inicializando render...');
        viewer.start();
    })
    .catch((err) => {
        console.error('❌ Error al cargar el splat:', err);
    });