import { Environment } from './environment.js';
import { API_ENVIRONMENT_TO_BASE_URL_MAP } from './constants.js';
import { Logger } from '../base/logger.js';
import { LogLevel } from './log-level.js';
import { RuntimeProvider } from '../providers/runtime-provider.js';
import { SDK_VERSION } from '../../version.js';
import { convertToSnakeCase } from './case-helpers.js';
import { rawResponse as rawResponseSymbol } from '../types/response.js';
export class Client {
    apiKey;
    options;
    baseUrl;
    constructor(apiKey, options) {
        this.apiKey = apiKey;
        this.options = options;
        this.baseUrl = this.getBaseUrl(this.options.environment);
        Logger.logLevel = this.options.logLevel ?? LogLevel.error;
    }
    getBaseUrl(environment) {
        const urlBasedOnEnv = API_ENVIRONMENT_TO_BASE_URL_MAP[environment ?? Environment.production];
        return urlBasedOnEnv || environment;
    }
    getHeaders() {
        let uuid;
        const cryptoProvider = RuntimeProvider.getProvider()?.crypto;
        if (cryptoProvider) {
            uuid = cryptoProvider.randomUUID();
        }
        else {
            Logger.error('Unknown runtime. Cannot generate uuid');
        }
        return {
            Authorization: `bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'user-agent': `PaddleSDK/node ${SDK_VERSION}`,
            'X-Transaction-ID': uuid ?? '',
            ...this.options.customHeaders,
        };
    }
    async get(url, queryParams) {
        let finalUrl = url.includes(this.baseUrl) ? url : `${this.baseUrl}${url}`;
        if (!finalUrl.includes('?') && queryParams) {
            finalUrl += queryParams.toQueryString();
        }
        const logUrl = finalUrl.split('?')[0];
        const headers = this.getHeaders();
        Logger.logRequest('GET', logUrl, headers);
        const rawResponse = await fetch(finalUrl, {
            headers,
        });
        Logger.logResponse('GET', logUrl, headers, rawResponse);
        return { ...(await rawResponse.json()), [rawResponseSymbol]: rawResponse };
    }
    async post(url, requestBody) {
        const logUrl = url.split('?')[0];
        const headers = this.getHeaders();
        Logger.logRequest('POST', logUrl, headers);
        const rawResponse = await fetch(`${this.baseUrl}${url}`, {
            method: 'POST',
            body: JSON.stringify(convertToSnakeCase(requestBody)),
            headers,
        });
        Logger.logResponse('POST', logUrl, headers, rawResponse);
        return { ...(await rawResponse.json()), [rawResponseSymbol]: rawResponse };
    }
    async patch(url, requestBody) {
        const logUrl = url.split('?')[0];
        const headers = this.getHeaders();
        Logger.logRequest('PATCH', logUrl, headers);
        const rawResponse = await fetch(`${this.baseUrl}${url}`, {
            method: 'PATCH',
            body: JSON.stringify(convertToSnakeCase(requestBody)),
            headers,
        });
        Logger.logResponse('PATCH', logUrl, headers, rawResponse);
        return { ...(await rawResponse.json()), [rawResponseSymbol]: rawResponse };
    }
    async delete(url) {
        const logUrl = url.split('?')[0];
        const headers = this.getHeaders();
        Logger.logRequest('DELETE', logUrl, headers);
        const rawResponse = await fetch(`${this.baseUrl}${url}`, {
            method: 'DELETE',
            headers,
        });
        Logger.logResponse('DELETE', logUrl, headers, rawResponse);
        if (rawResponse.ok) {
            return rawResponse;
        }
        else {
            return { ...(await rawResponse.json()), [rawResponseSymbol]: rawResponse };
        }
    }
}
