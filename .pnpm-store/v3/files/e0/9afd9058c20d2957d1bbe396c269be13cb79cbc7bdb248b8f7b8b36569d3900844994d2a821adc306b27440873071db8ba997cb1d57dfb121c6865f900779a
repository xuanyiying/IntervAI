"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationRunsResource = void 0;
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../internal/base/index.js");
__exportStar(require("./operations/index.js"), exports);
const SimulationRunPaths = {
    list: '/simulations/{simulation_id}/runs',
    create: '/simulations/{simulation_id}/runs',
    get: '/simulations/{simulation_id}/runs/{simulation_run_id}',
};
class SimulationRunsResource extends index_js_2.BaseResource {
    list(simulationId, queryParams) {
        const queryParameters = new index_js_2.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_2.PathParameters(SimulationRunPaths.list, {
            simulation_id: simulationId,
        }).deriveUrl();
        return new index_js_1.SimulationRunCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async create(simulationId) {
        const urlWithPathParams = new index_js_2.PathParameters(SimulationRunPaths.create, {
            simulation_id: simulationId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new index_js_1.SimulationRun(data);
    }
    async get(simulationId, simulationRunId, queryParams) {
        const queryParameters = new index_js_2.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_2.PathParameters(SimulationRunPaths.get, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new index_js_1.SimulationRun(data);
    }
}
exports.SimulationRunsResource = SimulationRunsResource;
