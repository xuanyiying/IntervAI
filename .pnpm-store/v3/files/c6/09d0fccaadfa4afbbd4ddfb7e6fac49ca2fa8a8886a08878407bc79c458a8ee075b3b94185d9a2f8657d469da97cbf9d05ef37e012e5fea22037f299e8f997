import { SimulationRun, SimulationRunCollection } from '../../entities/index.js';
import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
export * from './operations/index.js';
const SimulationRunPaths = {
    list: '/simulations/{simulation_id}/runs',
    create: '/simulations/{simulation_id}/runs',
    get: '/simulations/{simulation_id}/runs/{simulation_run_id}',
};
export class SimulationRunsResource extends BaseResource {
    list(simulationId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(SimulationRunPaths.list, {
            simulation_id: simulationId,
        }).deriveUrl();
        return new SimulationRunCollection(this.client, urlWithPathParams + queryParameters.toQueryString());
    }
    async create(simulationId) {
        const urlWithPathParams = new PathParameters(SimulationRunPaths.create, {
            simulation_id: simulationId,
        }).deriveUrl();
        const response = await this.client.post(urlWithPathParams, undefined);
        const data = this.handleResponse(response);
        return new SimulationRun(data);
    }
    async get(simulationId, simulationRunId, queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        const urlWithPathParams = new PathParameters(SimulationRunPaths.get, {
            simulation_id: simulationId,
            simulation_run_id: simulationRunId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams, queryParameters);
        const data = this.handleResponse(response);
        return new SimulationRun(data);
    }
}
