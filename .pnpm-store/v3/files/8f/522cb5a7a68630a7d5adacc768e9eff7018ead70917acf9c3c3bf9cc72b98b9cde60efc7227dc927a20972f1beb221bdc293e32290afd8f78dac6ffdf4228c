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
exports.SimulationsResource = void 0;
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../internal/base/index.js");
__exportStar(require("./operations/index.js"), exports);
const SimulationPaths = {
    list: '/simulations',
    create: '/simulations',
    get: '/simulations/{simulation_id}',
    update: '/simulations/{simulation_id}',
};
class SimulationsResource extends index_js_2.BaseResource {
    list(queryParams) {
        const queryParameters = new index_js_2.QueryParameters(queryParams);
        return new index_js_1.SimulationCollection(this.client, SimulationPaths.list + queryParameters.toQueryString());
    }
    async create(createSimulationParameters) {
        const response = await this.client.post(SimulationPaths.create, createSimulationParameters);
        const data = this.handleResponse(response);
        return new index_js_1.Simulation(data);
    }
    async get(simulationId) {
        const urlWithPathParams = new index_js_2.PathParameters(SimulationPaths.get, {
            simulation_id: simulationId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_1.Simulation(data);
    }
    async update(simulationId, updateSimulation) {
        const urlWithPathParams = new index_js_2.PathParameters(SimulationPaths.update, {
            simulation_id: simulationId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateSimulation);
        const data = this.handleResponse(response);
        return new index_js_1.Simulation(data);
    }
}
exports.SimulationsResource = SimulationsResource;
