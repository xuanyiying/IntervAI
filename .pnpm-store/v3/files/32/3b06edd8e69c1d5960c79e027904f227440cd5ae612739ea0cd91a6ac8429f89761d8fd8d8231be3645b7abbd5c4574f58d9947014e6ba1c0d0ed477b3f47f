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
import { getEnv, baggageUtils } from '@opentelemetry/core';
import { OTLPExporterNodeBase, parseHeaders, } from '@opentelemetry/otlp-exporter-base';
import { JsonLogsSerializer } from '@opentelemetry/otlp-transformer';
import { getDefaultUrl } from '../config';
import { VERSION } from '../../version';
const USER_AGENT = {
    'User-Agent': `OTel-OTLP-Exporter-JavaScript/${VERSION}`,
};
/**
 * Collector Logs Exporter for Node
 */
export class OTLPLogExporter extends OTLPExporterNodeBase {
    constructor(config = {}) {
        // load  OTEL_EXPORTER_OTLP_LOGS_TIMEOUT env
        super(Object.assign({ timeoutMillis: getEnv().OTEL_EXPORTER_OTLP_LOGS_TIMEOUT }, config), JsonLogsSerializer, Object.assign(Object.assign(Object.assign(Object.assign({}, baggageUtils.parseKeyPairsIntoRecord(getEnv().OTEL_EXPORTER_OTLP_LOGS_HEADERS)), parseHeaders(config === null || config === void 0 ? void 0 : config.headers)), USER_AGENT), { 'Content-Type': 'application/json' }));
    }
    getDefaultUrl(config) {
        return getDefaultUrl(config);
    }
}
//# sourceMappingURL=OTLPLogExporter.js.map