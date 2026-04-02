"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationRunEvent = void 0;
const index_js_1 = require("../shared/index.js");
class SimulationRunEvent {
    id;
    status;
    eventType;
    payload;
    request;
    response;
    createdAt;
    updatedAt;
    constructor(simulationRunEventResponse) {
        this.id = simulationRunEventResponse.id;
        this.status = simulationRunEventResponse.status;
        this.eventType = simulationRunEventResponse.event_type;
        this.payload = simulationRunEventResponse.payload;
        this.request = simulationRunEventResponse.request
            ? new index_js_1.SimulationEventRequest(simulationRunEventResponse.request)
            : null;
        this.response = simulationRunEventResponse.response
            ? new index_js_1.SimulationEventResponse(simulationRunEventResponse.response)
            : null;
        this.createdAt = simulationRunEventResponse.created_at;
        this.updatedAt = simulationRunEventResponse.updated_at;
    }
}
exports.SimulationRunEvent = SimulationRunEvent;
