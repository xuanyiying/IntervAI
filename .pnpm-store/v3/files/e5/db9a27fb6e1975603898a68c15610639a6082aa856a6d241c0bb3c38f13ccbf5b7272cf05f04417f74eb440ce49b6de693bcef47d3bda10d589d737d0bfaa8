export { Environment, LogLevel, ApiError } from './internal/index.js';
export { SDK_VERSION } from './version.js';
export * from './entities/index.js';
export * from './enums/index.js';
export * from './notifications/index.js';
export * from './resources/index.js';
export * from './types/index.js';
import { Paddle as PaddleBase } from './paddle.js';
import { EdgeRuntime } from './internal/providers/runtime/edge-runtime.js';
export { EdgeRuntime };
export class Paddle extends PaddleBase {
    constructor(apiKey, options) {
        EdgeRuntime.initialize();
        super(apiKey, options);
    }
}
