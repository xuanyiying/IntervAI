import { SimulationRun, SimulationRunCollection } from '../../entities/index.js';
import { BaseResource } from '../../internal/base/index.js';
import { type GetSimulationRunQueryParameters, type ListSimulationRunQueryParameters } from './operations/index.js';
export * from './operations/index.js';
export declare class SimulationRunsResource extends BaseResource {
    list(simulationId: string, queryParams?: ListSimulationRunQueryParameters): SimulationRunCollection;
    create(simulationId: string): Promise<SimulationRun>;
    get(simulationId: string, simulationRunId: string, queryParams?: GetSimulationRunQueryParameters): Promise<SimulationRun>;
}
