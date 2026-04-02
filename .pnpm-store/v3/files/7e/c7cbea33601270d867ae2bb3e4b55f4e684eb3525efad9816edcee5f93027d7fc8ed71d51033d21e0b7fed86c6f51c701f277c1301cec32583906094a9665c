"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paddle = exports.EdgeRuntime = exports.SDK_VERSION = exports.ApiError = exports.LogLevel = exports.Environment = void 0;
const edge_runtime_js_1 = require("./internal/providers/runtime/edge-runtime.js");
Object.defineProperty(exports, "EdgeRuntime", { enumerable: true, get: function () { return edge_runtime_js_1.EdgeRuntime; } });
const paddle_js_1 = require("./paddle.js");
var index_js_1 = require("./internal/index.js");
Object.defineProperty(exports, "Environment", { enumerable: true, get: function () { return index_js_1.Environment; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return index_js_1.LogLevel; } });
Object.defineProperty(exports, "ApiError", { enumerable: true, get: function () { return index_js_1.ApiError; } });
var version_js_1 = require("./version.js");
Object.defineProperty(exports, "SDK_VERSION", { enumerable: true, get: function () { return version_js_1.SDK_VERSION; } });
__exportStar(require("./entities/index.js"), exports);
__exportStar(require("./enums/index.js"), exports);
__exportStar(require("./notifications/index.js"), exports);
__exportStar(require("./resources/index.js"), exports);
__exportStar(require("./types/index.js"), exports);
class Paddle extends paddle_js_1.Paddle {
    constructor(apiKey, options) {
        edge_runtime_js_1.EdgeRuntime.initialize();
        super(apiKey, options);
    }
}
exports.Paddle = Paddle;
