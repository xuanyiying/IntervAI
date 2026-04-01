import { Simulation, SimulationCollection } from '../../entities/index.js';
import { BaseResource } from '../../internal/base/index.js';
import { type CreateSimulationRequestBody, type ListSimulationQueryParameters, type UpdateSimulationRequestBody } from './operations/index.js';
export * from './operations/index.js';
export declare class SimulationsResource extends BaseResource {
    list(queryParams?: ListSimulationQueryParameters): SimulationCollection;
    create(createSimulationParameters: CreateSimulationRequestBody): Promise<Simulation>;
    get(simulationId: string): Promise<Simulation>;
    update(simulationId: string, updateSimulation: UpdateSimulationRequestBody): Promise<Simulation>;
}
