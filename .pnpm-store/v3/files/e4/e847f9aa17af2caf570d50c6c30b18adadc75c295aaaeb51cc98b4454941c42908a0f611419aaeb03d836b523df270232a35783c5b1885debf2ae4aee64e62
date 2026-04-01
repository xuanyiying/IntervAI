"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeRuntime = void 0;
const runtime_provider_js_1 = require("../runtime-provider.js");
const edge_crypto_js_1 = require("../crypto/edge-crypto.js");
class EdgeRuntime {
    static initialize() {
        runtime_provider_js_1.RuntimeProvider.setProvider({
            crypto: new edge_crypto_js_1.EdgeCrypto(),
        });
    }
}
exports.EdgeRuntime = EdgeRuntime;
