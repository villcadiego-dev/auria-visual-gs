import SorterWasm from './sorter.wasm?url';
import SorterWasmNoSIMD from './sorter_no_simd.wasm?url';
import SorterWasmNonShared from './sorter_non_shared.wasm?url';
import SorterWasmNoSIMDNonShared from './sorter_no_simd_non_shared.wasm?url';
import { isIOS, getIOSSemever } from '../Util.js';
import { Constants } from '../Constants.js';

function sortWorker(self) {
    let wasmInstance;
    let wasmMemory;
    let useSharedMemory;
    let integerBasedSort;
    let dynamicMode;
    let splatCount;
    let indexesToSortOffset;
    let sortedIndexesOffset;
    let sceneIndexesOffset;
    let transformsOffset;
    let precomputedDistancesOffset;
    let mappedDistancesOffset;
    let frequenciesOffset;
    let centersOffset;
    let modelViewProjOffset;
    let countsZero;
    let sortedIndexesOut;
    let distanceMapRange;
    let uploadedSplatCount;
    let Constants;

    function sort(splatSortCount, splatRenderCount, modelViewProj,
                  usePrecomputedDistances, copyIndexesToSort, copyPrecomputedDistances, copyTransforms) {
        const sortStartTime = performance.now();
        // console.log('[🧩 WORKER] Ejecutando sort()...');

        if (!useSharedMemory) {
            const indexesToSort = new Uint32Array(wasmMemory, indexesToSortOffset, copyIndexesToSort.byteLength / Constants.BytesPerInt);
            indexesToSort.set(copyIndexesToSort);
            const transforms = new Float32Array(wasmMemory, transformsOffset, copyTransforms.byteLength / Constants.BytesPerFloat);
            transforms.set(copyTransforms);
            if (usePrecomputedDistances) {
                let precomputedDistances;
                if (integerBasedSort) {
                    precomputedDistances = new Int32Array(wasmMemory, precomputedDistancesOffset,
                        copyPrecomputedDistances.byteLength / Constants.BytesPerInt);
                } else {
                    precomputedDistances = new Float32Array(wasmMemory, precomputedDistancesOffset,
                        copyPrecomputedDistances.byteLength / Constants.BytesPerFloat);
                }
                precomputedDistances.set(copyPrecomputedDistances);
            }
        }

        if (!countsZero) countsZero = new Uint32Array(distanceMapRange);
        new Float32Array(wasmMemory, modelViewProjOffset, 16).set(modelViewProj);
        new Uint32Array(wasmMemory, frequenciesOffset, distanceMapRange).set(countsZero);
        wasmInstance.exports.sortIndexes(indexesToSortOffset, centersOffset, precomputedDistancesOffset,
            mappedDistancesOffset, frequenciesOffset, modelViewProjOffset,
            sortedIndexesOffset, sceneIndexesOffset, transformsOffset, distanceMapRange,
            splatSortCount, splatRenderCount, splatCount, usePrecomputedDistances, integerBasedSort,
            dynamicMode);

        const sortMessage = {
            'sortDone': true,
            'splatSortCount': splatSortCount,
            'splatRenderCount': splatRenderCount,
            'sortTime': 0
        };
        if (!useSharedMemory) {
            const sortedIndexes = new Uint32Array(wasmMemory, sortedIndexesOffset, splatRenderCount);
            if (!sortedIndexesOut || sortedIndexesOut.length < splatRenderCount) {
                sortedIndexesOut = new Uint32Array(splatRenderCount);
            }
            sortedIndexesOut.set(sortedIndexes);
            sortMessage.sortedIndexes = sortedIndexesOut;
        }
        const sortEndTime = performance.now();

        sortMessage.sortTime = sortEndTime - sortStartTime;
        // console.log('[🧩 WORKER] Finalizó sort() en', sortMessage.sortTime.toFixed(2), 'ms');
        self.postMessage(sortMessage);
    }

    self.onmessage = (e) => {
        // console.log('[🧩 WORKER] Recibido mensaje en SortWorker:', e.data);
        if (e.data.centers) {
            let centers = e.data.centers;
            let sceneIndexes = e.data.sceneIndexes;
            // console.log('[🧩 WORKER] Cargando centers/sceneIndexes. Cantidad:', e.data.range.count);

            if (integerBasedSort) {
                new Int32Array(wasmMemory, centersOffset + e.data.range.from * Constants.BytesPerInt * 4,
                    e.data.range.count * 4).set(new Int32Array(centers));
            } else {
                new Float32Array(wasmMemory, centersOffset + e.data.range.from * Constants.BytesPerFloat * 4,
                    e.data.range.count * 4).set(new Float32Array(centers));
            }
            if (dynamicMode) {
                new Uint32Array(wasmMemory, sceneIndexesOffset + e.data.range.from * 4,
                    e.data.range.count).set(new Uint32Array(sceneIndexes));
            }
            uploadedSplatCount = e.data.range.from + e.data.range.count;
        } else if (e.data.sort) {
            // console.log('[🧩 WORKER] Recibido pedido de sort');
            const renderCount = Math.min(e.data.sort.splatRenderCount || 0, uploadedSplatCount);
            const sortCount = Math.min(e.data.sort.splatSortCount || 0, uploadedSplatCount);
            const usePrecomputedDistances = e.data.sort.usePrecomputedDistances;

            let copyIndexesToSort;
            let copyPrecomputedDistances;
            let copyTransforms;
            if (!useSharedMemory) {
                copyIndexesToSort = e.data.sort.indexesToSort;
                copyTransforms = e.data.sort.transforms;
                if (usePrecomputedDistances) copyPrecomputedDistances = e.data.sort.precomputedDistances;
            }
            sort(sortCount, renderCount, e.data.sort.modelViewProj, usePrecomputedDistances,
                copyIndexesToSort, copyPrecomputedDistances, copyTransforms);
        } else if (e.data.init) {
            // console.log('[🧩 WORKER] Inicializando sortWorker con init:', e.data.init);
            Constants = e.data.init.Constants;
            splatCount = e.data.init.splatCount;
            useSharedMemory = e.data.init.useSharedMemory;
            integerBasedSort = e.data.init.integerBasedSort;
            dynamicMode = e.data.init.dynamicMode;
            distanceMapRange = e.data.init.distanceMapRange;
            uploadedSplatCount = 0;

            const CENTERS_BYTES_PER_ENTRY = integerBasedSort ? (Constants.BytesPerInt * 4) : (Constants.BytesPerFloat * 4);

            const sorterWasmBytes = new Uint8Array(e.data.init.sorterWasmBytes);
            // console.log('[🧩 WORKER] Compilando WASM con', sorterWasmBytes.length, 'bytes');

            const matrixSize = 16 * Constants.BytesPerFloat;
            const memoryRequiredForIndexesToSort = splatCount * Constants.BytesPerInt;
            const memoryRequiredForCenters = splatCount * CENTERS_BYTES_PER_ENTRY;
            const memoryRequiredForModelViewProjectionMatrix = matrixSize;
            const memoryRequiredForPrecomputedDistances = integerBasedSort ?
                (splatCount * Constants.BytesPerInt) : (splatCount * Constants.BytesPerFloat);
            const memoryRequiredForMappedDistances = splatCount * Constants.BytesPerInt;
            const memoryRequiredForSortedIndexes = splatCount * Constants.BytesPerInt;
            const memoryRequiredForIntermediateSortBuffers = integerBasedSort ? (distanceMapRange * Constants.BytesPerInt * 2) :
                (distanceMapRange * Constants.BytesPerFloat * 2);
            const memoryRequiredforTransformIndexes = dynamicMode ? (splatCount * Constants.BytesPerInt) : 0;
            const memoryRequiredforTransforms = dynamicMode ? (Constants.MaxScenes * matrixSize) : 0;
            const extraMemory = Constants.MemoryPageSize * 32;

            const totalRequiredMemory = memoryRequiredForIndexesToSort +
                memoryRequiredForCenters +
                memoryRequiredForModelViewProjectionMatrix +
                memoryRequiredForPrecomputedDistances +
                memoryRequiredForMappedDistances +
                memoryRequiredForIntermediateSortBuffers +
                memoryRequiredForSortedIndexes +
                memoryRequiredforTransformIndexes +
                memoryRequiredforTransforms +
                extraMemory;
            const totalPagesRequired = Math.floor(totalRequiredMemory / Constants.MemoryPageSize ) + 1;
            const sorterWasmImport = {
                module: {},
                env: {
                    memory: new WebAssembly.Memory({
                        initial: totalPagesRequired,
                        maximum: totalPagesRequired,
                        shared: true,
                    }),
                }
            };

            WebAssembly.compile(sorterWasmBytes)
                .then((wasmModule) => {
                    // console.log('[🧩 WORKER] WASM compilado correctamente');
                    return WebAssembly.instantiate(wasmModule, sorterWasmImport);
                })
                .then((instance) => {
                    // console.log('[🧩 WORKER] WASM instanciado');
                    wasmInstance = instance;
                    indexesToSortOffset = 0;
                    centersOffset = indexesToSortOffset + memoryRequiredForIndexesToSort;
                    modelViewProjOffset = centersOffset + memoryRequiredForCenters;
                    precomputedDistancesOffset = modelViewProjOffset + memoryRequiredForModelViewProjectionMatrix;
                    mappedDistancesOffset = precomputedDistancesOffset + memoryRequiredForPrecomputedDistances;
                    frequenciesOffset = mappedDistancesOffset + memoryRequiredForMappedDistances;
                    sortedIndexesOffset = frequenciesOffset + memoryRequiredForIntermediateSortBuffers;
                    sceneIndexesOffset = sortedIndexesOffset + memoryRequiredForSortedIndexes;
                    transformsOffset = sceneIndexesOffset + memoryRequiredforTransformIndexes;
                    wasmMemory = sorterWasmImport.env.memory.buffer;

                    if (useSharedMemory) {
                        self.postMessage({
                            'sortSetupPhase1Complete': true,
                            'indexesToSortBuffer': wasmMemory,
                            'indexesToSortOffset': indexesToSortOffset,
                            'sortedIndexesBuffer': wasmMemory,
                            'sortedIndexesOffset': sortedIndexesOffset,
                            'precomputedDistancesBuffer': wasmMemory,
                            'precomputedDistancesOffset': precomputedDistancesOffset,
                            'transformsBuffer': wasmMemory,
                            'transformsOffset': transformsOffset
                        });
                    } else {
                        self.postMessage({
                            'sortSetupPhase1Complete': true
                        });
                    }
                    // console.log('[🧩 WORKER] sortSetupPhase1Complete enviado');
                });
        }
    };
}

export async function createSortWorker(splatCount, useSharedMemory, enableSIMDInSort, integerBasedSort, dynamicMode,
                                       splatSortDistanceMapPrecision = Constants.DefaultSplatSortDistanceMapPrecision) {
    const worker = new Worker(
        URL.createObjectURL(
            new Blob(['(', sortWorker.toString(), ')(self)'], {
                type: 'application/javascript',
            }),
        ),
    );

    let sourceWasm = SorterWasm;
    const iOSSemVer = isIOS() ? getIOSSemever() : null;
    if (!enableSIMDInSort && !useSharedMemory) {
        sourceWasm = SorterWasmNoSIMD;
        if (iOSSemVer && iOSSemVer.major <= 16 && iOSSemVer.minor < 4) {
            sourceWasm = SorterWasmNoSIMDNonShared;
        }
    } else if (!enableSIMDInSort) {
        sourceWasm = SorterWasmNoSIMD;
    } else if (!useSharedMemory) {
        if (iOSSemVer && iOSSemVer.major <= 16 && iOSSemVer.minor < 4) {
            sourceWasm = SorterWasmNonShared;
        }
    }

    const response = await fetch(sourceWasm);
    const sorterWasmBytes = new Uint8Array(await response.arrayBuffer());

    worker.postMessage({
        'init': {
            'sorterWasmBytes': sorterWasmBytes.buffer,
            'splatCount': splatCount,
            'useSharedMemory': useSharedMemory,
            'integerBasedSort': integerBasedSort,
            'dynamicMode': dynamicMode,
            'distanceMapRange': 1 << splatSortDistanceMapPrecision,
            'Constants': {
                'BytesPerFloat': Constants.BytesPerFloat,
                'BytesPerInt': Constants.BytesPerInt,
                'MemoryPageSize': Constants.MemoryPageSize,
                'MaxScenes': Constants.MaxScenes
            }
        }
    });
    return worker;
}