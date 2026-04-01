import { SimulationRunEvent, SimulationRunEventCollection } from '../../entities/index.js';
import { BaseResource } from '../../internal/base/index.js';
import type { ListSimulationRunEventsQueryParameters } from './operations/index.js';
export * from './operations/index.js';
export declare class SimulationRunEventsResource extends BaseResource {
    list(simulationId: string, simulationRunId: string, queryParams?: ListSimulationRunEventsQueryParameters): SimulationRunEventCollection;
    get(simulationId: string, simulationRunId: string, simulationEventId: string): Promise<SimulationRunEvent>;
    replay(simulationId: string, simulationRunId: string, simulationEventId: string): Promise<SimulationRunEvent>;
}
