import {TSPArtGenerator} from 'tsp-art';

const generator = new TSPArtGenerator();

self.onmessage = async (event) => {
    const {imageData, config} = event.data;

    try {
        // 直接使用传入的 imageData，不再从文件创建
        const {points, solverResult} = await generator.generateFromImage(
            imageData,
            config,
            (stage, progress, message) => {
                self.postMessage({type: 'progress', stage, progress, message});
            }
        );

        // 只返回计算结果，不进行渲染
        self.postMessage({type: 'result', points, solverResult, renderConfig: config.render.config});
    } catch (error: any) {
        console.error('Worker 生成错误:', error);
        self.postMessage({type: 'error', message: error.message || '未知错误', stack: error.stack});
    }
};