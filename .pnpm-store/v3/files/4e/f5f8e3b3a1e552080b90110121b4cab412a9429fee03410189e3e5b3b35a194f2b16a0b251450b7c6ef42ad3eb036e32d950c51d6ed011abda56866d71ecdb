"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCrypto = void 0;
const node_crypto_1 = require("node:crypto");
class NodeCrypto {
    randomUUID() {
        return (0, node_crypto_1.randomUUID)();
    }
    async computeHmac(payload, secret) {
        const hmac = (0, node_crypto_1.createHmac)('sha256', secret);
        hmac.update(payload);
        return await new Promise((resolve) => {
            resolve(hmac.digest('hex'));
        });
    }
}
exports.NodeCrypto = NodeCrypto;
