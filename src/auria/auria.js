import { Viewer, DropInViewer, ArrowHelper } from './auria-base.js';


const urlParams = new URLSearchParams(window.location.search);

const viewerfun = new Viewer({
    cameraUp: [-0.00000, -0.87991, -0.47515],
    initialCameraPosition: [1.02540, -0.36834, -5.69726],
    initialCameraLookAt: [-0.97004, 1.68791, 4.69032],
    sphericalHarmonicsDegree: 2
});


let path = `/assets/data/office/demo_office_gs.ksplat`;

viewer.addSplatScene(path, { progressiveLoad: false })
    .then(() => {
        // console.log('✅ Splat cargado, inicializando render...');
        viewer.start();
    })
    .catch((err) => {
        console.error('❌ Error al cargar el splat:', err);
    });