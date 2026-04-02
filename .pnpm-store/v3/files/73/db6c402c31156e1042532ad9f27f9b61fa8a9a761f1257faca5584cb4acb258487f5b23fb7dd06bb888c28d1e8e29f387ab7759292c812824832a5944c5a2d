import { SimulationEventRequest, SimulationEventResponse } from '../shared/index.js';
export class SimulationRunEvent {
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
            ? new SimulationEventRequest(simulationRunEventResponse.request)
            : null;
        this.response = simulationRunEventResponse.response
            ? new SimulationEventResponse(simulationRunEventResponse.response)
            : null;
        this.createdAt = simulationRunEventResponse.created_at;
        this.updatedAt = simulationRunEventResponse.updated_at;
    }
}
