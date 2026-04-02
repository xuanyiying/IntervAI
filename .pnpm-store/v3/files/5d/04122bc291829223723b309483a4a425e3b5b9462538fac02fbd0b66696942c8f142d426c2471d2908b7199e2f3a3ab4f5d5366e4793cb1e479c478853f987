import { createHmac, randomUUID } from 'node:crypto';
export class NodeCrypto {
    randomUUID() {
        return randomUUID();
    }
    async computeHmac(payload, secret) {
        const hmac = createHmac('sha256', secret);
        hmac.update(payload);
        return await new Promise((resolve) => {
            resolve(hmac.digest('hex'));
        });
    }
}
