import { Simulation, SimulationCollection } from '../../entities/index.js';
import { BaseResource, PathParameters, QueryParameters } from '../../internal/base/index.js';
export * from './operations/index.js';
const SimulationPaths = {
    list: '/simulations',
    create: '/simulations',
    get: '/simulations/{simulation_id}',
    update: '/simulations/{simulation_id}',
};
export class SimulationsResource extends BaseResource {
    list(queryParams) {
        const queryParameters = new QueryParameters(queryParams);
        return new SimulationCollection(this.client, SimulationPaths.list + queryParameters.toQueryString());
    }
    async create(createSimulationParameters) {
        const response = await this.client.post(SimulationPaths.create, createSimulationParameters);
        const data = this.handleResponse(response);
        return new Simulation(data);
    }
    async get(simulationId) {
        const urlWithPathParams = new PathParameters(SimulationPaths.get, {
            simulation_id: simulationId,
        }).deriveUrl();
        const response = await this.client.get(urlWithPathParams);
        const data = this.handleResponse(response);
        return new Simulation(data);
    }
    async update(simulationId, updateSimulation) {
        const urlWithPathParams = new PathParameters(SimulationPaths.update, {
            simulation_id: simulationId,
        }).deriveUrl();
        const response = await this.client.patch(urlWithPathParams, updateSimulation);
        const data = this.handleResponse(response);
        return new Simulation(data);
    }
}
