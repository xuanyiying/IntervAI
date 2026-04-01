"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationRun = void 0;
const index_js_1 = require("../index.js");
class SimulationRun {
    id;
    status;
    createdAt;
    updatedAt;
    type;
    events;
    constructor(simulationRunResponse) {
        this.id = simulationRunResponse.id;
        this.status = simulationRunResponse.status;
        this.createdAt = simulationRunResponse.created_at;
        this.updatedAt = simulationRunResponse.updated_at;
        this.type = simulationRunResponse.type;
        this.events = simulationRunResponse.events?.map((event) => new index_js_1.SimulationRunEvent(event)) ?? [];
    }
}
exports.SimulationRun = SimulationRun;
