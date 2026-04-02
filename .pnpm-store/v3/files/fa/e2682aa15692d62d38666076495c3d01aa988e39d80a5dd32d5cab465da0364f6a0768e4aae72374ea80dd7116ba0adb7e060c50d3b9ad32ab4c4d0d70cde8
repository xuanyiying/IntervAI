"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksValidator = void 0;
const runtime_provider_js_1 = require("../../internal/providers/runtime-provider.js");
const logger_js_1 = require("../../internal/base/logger.js");
class WebhooksValidator {
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
        const cryptoProvider = runtime_provider_js_1.RuntimeProvider.getProvider()?.crypto;
        if (!cryptoProvider) {
            logger_js_1.Logger.error('Unknown runtime. Cannot validate webhook signature');
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
exports.WebhooksValidator = WebhooksValidator;
