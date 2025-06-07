/**
 * Configuraciones por defecto para escenas Gaussian Splat
 * Cada escena tiene sus propios valores de transformación optimizados
 */

export const SCENE_CONFIGS = {
    // Configuración para la escena auria (office)
    auria: {
        name: 'Office Scene',
        splatPath: '/assets/data/office/demo_office_gs.ksplat',
        defaultTransform: {
            rotation: [-0.8639, 0.0758, -0.4788, 0.1368], // Quaternion optimizado para orientación correcta
            position: [-1.7, 2.8, 0.0], // Posición ajustada para vista correcta
            scale: [1.0, 1.0, 1.0]
        },
        splatOptions: {
            progressiveLoad: false
        }
    },

    // Configuración para la escena dropin (garden)
    dropin: {
        name: 'Garden Scene',
        splatPath: '/assets/data/garden/garden.ksplat',
        defaultTransform: {
            // Rotación optimizada para orientación correcta
            rotation: [0.9681, 0.0000, 0.0000, 0.2504], // Quaternion [x, y, z, w]
            // Posición ajustada para altura correcta
            position: [0.0, 3.2, 0.0], // Vector3 [x, y, z]
            // Escala estándar
            scale: [1.0, 1.0, 1.0] // Vector3 [x, y, z]
        },
        // Configuraciones específicas del splat
        splatOptions: {
            splatAlphaRemovalThreshold: 20,
            progressiveLoad: false
        }
    },

    // Configuración para futuras escenas (ejemplos)
    bonsai: {
        name: 'Bonsai Scene',
        splatPath: '/assets/data/bonsai/bonsai_trimmed.ksplat',
        defaultTransform: {
            rotation: [0, 0, 0, 1], // Sin rotación inicial
            position: [0.0, 0.0, 0.0], // Posición central
            scale: [1.0, 1.0, 1.0]
        },
        splatOptions: {
            splatAlphaRemovalThreshold: 15,
            progressiveLoad: true
        }
    },

    stump: {
        name: 'Stump Scene', 
        splatPath: '/assets/data/stump/stump.ksplat',
        defaultTransform: {
            // Valores optimizados para la escena stump
            rotation: [0.9239, 0.0000, 0.0000, 0.3827], // Quaternion optimizado para orientación correcta
            position: [0.0, 3.2, 0.0], // Posición ajustada para vista correcta
            scale: [1.0, 1.0, 1.0]
        },
        splatOptions: {
            splatAlphaRemovalThreshold: 20,
            progressiveLoad: false
        }
    },

    truck: {
        name: 'Truck Scene',
        splatPath: '/assets/data/truck/truck.ksplat', 
        defaultTransform: {
            rotation: [0.9976, 0.0000, 0.0000, 0.0698], // Quaternion optimizado para orientación correcta
            position: [0.0, 1.6, 0.0], // Posición ajustada para altura correcta
            scale: [1.0, 1.0, 1.0]
        },
        splatOptions: {
            splatAlphaRemovalThreshold: 25,
            progressiveLoad: false
        }
    }
};

/**
 * Función helper para obtener configuración de una escena
 * @param {string} sceneName - Nombre de la escena
 * @returns {Object} Configuración de la escena o null si no existe
 */
export function getSceneConfig(sceneName) {
    const config = SCENE_CONFIGS[sceneName];
    if (!config) {
        console.warn(`Configuración no encontrada para la escena: ${sceneName}`);
        return null;
    }
    return config;
}

/**
 * Función helper para aplicar transformación por defecto a una escena splat
 * @param {Object} splatScene - Referencia a la escena splat
 * @param {string} sceneName - Nombre de la escena
 */
export function applyDefaultTransform(splatScene, sceneName) {
    const config = getSceneConfig(sceneName);
    if (!config || !splatScene) return;

    const { rotation, position, scale } = config.defaultTransform;
    
    // Aplicar rotación (quaternion)
    splatScene.quaternion.set(rotation[0], rotation[1], rotation[2], rotation[3]);
    
    // Aplicar posición
    splatScene.position.set(position[0], position[1], position[2]);
    
    // Aplicar escala
    splatScene.scale.set(scale[0], scale[1], scale[2]);
    
    // Actualizar matrices
    splatScene.updateMatrix();
    splatScene.updateMatrixWorld(true);
    
    console.log(`✅ Transformación por defecto aplicada para escena: ${config.name}`);
}

/**
 * Función helper para obtener opciones de carga del splat
 * @param {string} sceneName - Nombre de la escena
 * @returns {Object} Opciones para addSplatScene
 */
export function getSplatLoadOptions(sceneName) {
    const config = getSceneConfig(sceneName);
    if (!config) return {};

    const { rotation, position, scale } = config.defaultTransform;
    
    return {
        // Transformación inicial
        rotation: rotation,
        position: position, 
        scale: scale,
        // Opciones específicas del splat
        ...config.splatOptions
    };
}

/**
 * Lista de todas las escenas disponibles
 */
export const AVAILABLE_SCENES = Object.keys(SCENE_CONFIGS);

console.log('📋 Scene Configs cargado - Escenas disponibles:', AVAILABLE_SCENES);