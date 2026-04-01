"use strict";
/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultUrl = exports.DEFAULT_COLLECTOR_URL = void 0;
const core_1 = require("@opentelemetry/core");
const otlp_exporter_base_1 = require("@opentelemetry/otlp-exporter-base");
const DEFAULT_COLLECTOR_RESOURCE_PATH = 'v1/logs';
exports.DEFAULT_COLLECTOR_URL = `http://localhost:4318/${DEFAULT_COLLECTOR_RESOURCE_PATH}`;
/**
 * common get default url
 * @param config exporter config
 * @returns url string
 */
function getDefaultUrl(config) {
    if (typeof config.url === 'string') {
        return config.url;
    }
    const env = (0, core_1.getEnv)();
    if (env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT.length > 0) {
        return (0, otlp_exporter_base_1.appendRootPathToUrlIfNeeded)(env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT);
    }
    if (env.OTEL_EXPORTER_OTLP_ENDPOINT.length > 0) {
        return (0, otlp_exporter_base_1.appendResourcePathToUrl)(env.OTEL_EXPORTER_OTLP_ENDPOINT, DEFAULT_COLLECTOR_RESOURCE_PATH);
    }
    return exports.DEFAULT_COLLECTOR_URL;
}
exports.getDefaultUrl = getDefaultUrl;
//# sourceMappingURL=config.js.map