"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const environment_js_1 = require("./environment.js");
const constants_js_1 = require("./constants.js");
const logger_js_1 = require("../base/logger.js");
const log_level_js_1 = require("./log-level.js");
const runtime_provider_js_1 = require("../providers/runtime-provider.js");
const version_js_1 = require("../../version.js");
const case_helpers_js_1 = require("./case-helpers.js");
const response_js_1 = require("../types/response.js");
class Client {
    apiKey;
    options;
    baseUrl;
    constructor(apiKey, options) {
        this.apiKey = apiKey;
        this.options = options;
        this.baseUrl = this.getBaseUrl(this.options.environment);
        logger_js_1.Logger.logLevel = this.options.logLevel ?? log_level_js_1.LogLevel.error;
    }
    getBaseUrl(environment) {
        const urlBasedOnEnv = constants_js_1.API_ENVIRONMENT_TO_BASE_URL_MAP[environment ?? environment_js_1.Environment.production];
        return urlBasedOnEnv || environment;
    }
    getHeaders() {
        let uuid;
        const cryptoProvider = runtime_provider_js_1.RuntimeProvider.getProvider()?.crypto;
        if (cryptoProvider) {
            uuid = cryptoProvider.randomUUID();
        }
        else {
            logger_js_1.Logger.error('Unknown runtime. Cannot generate uuid');
        }
        return {
            Authorization: `bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'user-agent': `PaddleSDK/node ${version_js_1.SDK_VERSION}`,
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
        logger_js_1.Logger.logRequest('GET', logUrl, headers);
        const rawResponse = await fetch(finalUrl, {
            headers,
        });
        logger_js_1.Logger.logResponse('GET', logUrl, headers, rawResponse);
        return { ...(await rawResponse.json()), [response_js_1.rawResponse]: rawResponse };
    }
    async post(url, requestBody) {
        const logUrl = url.split('?')[0];
        const headers = this.getHeaders();
        logger_js_1.Logger.logRequest('POST', logUrl, headers);
        const rawResponse = await fetch(`${this.baseUrl}${url}`, {
            method: 'POST',
            body: JSON.stringify((0, case_helpers_js_1.convertToSnakeCase)(requestBody)),
            headers,
        });
        logger_js_1.Logger.logResponse('POST', logUrl, headers, rawResponse);
        return { ...(await rawResponse.json()), [response_js_1.rawResponse]: rawResponse };
    }
    async patch(url, requestBody) {
        const logUrl = url.split('?')[0];
        const headers = this.getHeaders();
        logger_js_1.Logger.logRequest('PATCH', logUrl, headers);
        const rawResponse = await fetch(`${this.baseUrl}${url}`, {
            method: 'PATCH',
            body: JSON.stringify((0, case_helpers_js_1.convertToSnakeCase)(requestBody)),
            headers,
        });
        logger_js_1.Logger.logResponse('PATCH', logUrl, headers, rawResponse);
        return { ...(await rawResponse.json()), [response_js_1.rawResponse]: rawResponse };
    }
    async delete(url) {
        const logUrl = url.split('?')[0];
        const headers = this.getHeaders();
        logger_js_1.Logger.logRequest('DELETE', logUrl, headers);
        const rawResponse = await fetch(`${this.baseUrl}${url}`, {
            method: 'DELETE',
            headers,
        });
        logger_js_1.Logger.logResponse('DELETE', logUrl, headers, rawResponse);
        if (rawResponse.ok) {
            return rawResponse;
        }
        else {
            return { ...(await rawResponse.json()), [response_js_1.rawResponse]: rawResponse };
        }
    }
}
exports.Client = Client;
