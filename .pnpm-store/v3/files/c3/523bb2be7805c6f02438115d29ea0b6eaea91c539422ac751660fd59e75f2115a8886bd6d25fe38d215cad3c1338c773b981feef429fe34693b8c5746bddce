import { RuntimeProvider } from '../../internal/providers/runtime-provider.js';
import { Logger } from '../../internal/base/logger.js';
export class WebhooksValidator {
    static MAX_VALID_TIME_DIFFERENCE = 5;
    extractHeader(header) {
        const parts = header.split(';');
        let ts = '';
        let h1 = '';
        for (const part of parts) {
            const [key, value] = part.split('=');
            if (value) {
                if (key === 'ts') {
                    ts = value;
                }
                else if (key === 'h1') {
                    h1 = value;
                }
            }
        }
        if (ts && h1) {
            return { ts: parseInt(ts), h1 };
        }
        else {
            throw new Error('[Paddle] Invalid webhook signature');
        }
    }
    async isValidSignature(requestBody, secretKey, signature) {
        const cryptoProvider = RuntimeProvider.getProvider()?.crypto;
        if (!cryptoProvider) {
            Logger.error('Unknown runtime. Cannot validate webhook signature');
            return false;
        }
        const headers = this.extractHeader(signature);
        const payloadWithTime = `${headers.ts}:${requestBody}`;
        if (new Date().getTime() > new Date((headers.ts + WebhooksValidator.MAX_VALID_TIME_DIFFERENCE) * 1000).getTime()) {
            return false;
        }
        const computedHash = await cryptoProvider.computeHmac(payloadWithTime, secretKey);
        return computedHash === headers.h1;
    }
}
