"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeCrypto = void 0;
const byteHexMapping = new Array(256);
for (let i = 0; i < byteHexMapping.length; i++) {
    byteHexMapping[i] = i.toString(16).padStart(2, '0');
}
class EdgeCrypto {
    randomUUID() {
        return crypto.randomUUID();
    }
    async computeHmac(payload, secret) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {
            name: 'HMAC',
            hash: { name: 'SHA-256' },
        }, false, ['sign']);
        const signatureBuffer = await crypto.subtle.sign('hmac', key, encoder.encode(payload));
        const signatureBytes = new Uint8Array(signatureBuffer);
        const signatureHexCodes = new Array(signatureBytes.length);
        for (let i = 0; i < signatureBytes.length; i++) {
            if (signatureBytes[i] !== undefined && signatureBytes[i] !== null) {
                signatureHexCodes[i] = byteHexMapping[signatureBytes[i]];
            }
        }
        return signatureHexCodes.join('');
    }
}
exports.EdgeCrypto = EdgeCrypto;
