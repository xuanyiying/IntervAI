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
exports.OTLPLogExporter = void 0;
const otlp_exporter_base_1 = require("@opentelemetry/otlp-exporter-base");
const otlp_transformer_1 = require("@opentelemetry/otlp-transformer");
const config_1 = require("../config");
/**
 * Collector Logs Exporter for Web
 */
class OTLPLogExporter extends otlp_exporter_base_1.OTLPExporterBrowserBase {
    constructor(config = {}) {
        super(Object.assign({}, config), otlp_transformer_1.JsonLogsSerializer, 'application/json');
    }
    getDefaultUrl(config) {
        return (0, config_1.getDefaultUrl)(config);
    }
}
exports.OTLPLogExporter = OTLPLogExporter;
//# sourceMappingURL=OTLPLogExporter.js.map