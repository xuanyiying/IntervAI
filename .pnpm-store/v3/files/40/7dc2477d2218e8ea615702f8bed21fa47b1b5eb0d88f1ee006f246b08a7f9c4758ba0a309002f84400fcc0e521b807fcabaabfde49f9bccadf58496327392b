import { SimulationRunEvent, SimulationRunEventCollection } from '../../entities/index.js';
import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
export * from './operations/index.js';
const SimulationRunEventPaths = {
    list: '/simulations/{simulation_id}/runs/{simulation_run_id}/events',
    get: '/simulations/{simulation_id}/runs/{simulation_run_id}/events/{simulation_event_id}',
    replay: '/simulations/{simulation_id}/runs/{simulation_run_id}/events/{simulation_event_id}/replay',
};
export class SimulationRunEventsResource extends BaseResource {
    list(simulationId, simulationRunId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(SimulationRunEventPaths.list, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
        }).deriveUrl();
        return new SimulationRunEventCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async get(simulationId, simulationRunId, simulationEventId) {
        const urlWithPathParams = new PathParameters(SimulationRunEventPaths.get, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
            simulation_event_id: simulationEventId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new SimulationRunEvent(data);
    }
    async replay(simulationId, simulationRunId, simulationEventId) {
        const urlWithPathParams = new PathParameters(SimulationRunEventPaths.replay, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
            simulation_event_id: simulationEventId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new SimulationRunEvent(data);
    }
}
