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
exports.SimulationRunEventsResource = void 0;
const index_js_1 = require("../../entities/index.js");
const index_js_2 = require("../../internal/base/index.js");
__exportStar(require("./operations/index.js"), exports);
const SimulationRunEventPaths = {
    list: '/simulations/{simulation_id}/runs/{simulation_run_id}/events',
    get: '/simulations/{simulation_id}/runs/{simulation_run_id}/events/{simulation_event_id}',
    replay: '/simulations/{simulation_id}/runs/{simulation_run_id}/events/{simulation_event_id}/replay',
};
class SimulationRunEventsResource extends index_js_2.BaseResource {
    list(simulationId, simulationRunId, queryParams) {
        const queryParameters = new index_js_2.QueryParameters(queryParams);
        const urlWithPathParams = new index_js_2.PathParameters(SimulationRunEventPaths.list, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
        }).deriveUrl();
        return new index_js_1.SimulationRunEventCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async get(simulationId, simulationRunId, simulationEventId) {
        const urlWithPathParams = new index_js_2.PathParameters(SimulationRunEventPaths.get, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
            simulation_event_id: simulationEventId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new index_js_1.SimulationRunEvent(data);
    }
    async replay(simulationId, simulationRunId, simulationEventId) {
        const urlWithPathParams = new index_js_2.PathParameters(SimulationRunEventPaths.replay, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
            simulation_event_id: simulationEventId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new index_js_1.SimulationRunEvent(data);
    }
}
exports.SimulationRunEventsResource = SimulationRunEventsResource;
