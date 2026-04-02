"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeRuntime = void 0;
const runtime_provider_js_1 = require("../runtime-provider.js");
const node_crypto_js_1 = require("../crypto/node-crypto.js");
class NodeRuntime {
    static initialize() {
        runtime_provider_js_1.RuntimeProvider.setProvider({
            crypto: new node_crypto_js_1.NodeCrypto(),
        });
    }
}
exports.NodeRuntime = NodeRuntime;
