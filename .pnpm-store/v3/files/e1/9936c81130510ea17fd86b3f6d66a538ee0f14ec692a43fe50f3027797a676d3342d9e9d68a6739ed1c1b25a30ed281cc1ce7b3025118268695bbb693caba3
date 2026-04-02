import { SimulationRunEvent } from '../index.js';
export class SimulationRun {
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
        this.events = simulationRunResponse.events?.map((event) => new SimulationRunEvent(event)) ?? [];
    }
}
