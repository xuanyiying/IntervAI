import type { SimulationRunEventStatus, SimulationScenarioType } from '../../enums/index.js';
import type { IEventName } from '../../notifications/index.js';
import { type ISimulationRunEventResponse } from '../../types/index.js';
import { SimulationEventRequest, SimulationEventResponse } from '../shared/index.js';
export declare class SimulationRunEvent {
    readonly id: string;
    readonly status: SimulationRunEventStatus;
    readonly eventType: IEventName | SimulationScenarioType;
    readonly payload: any;
    readonly request: SimulationEventRequest | null;
    readonly response: SimulationEventResponse | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    constructor(simulationRunEventResponse: ISimulationRunEventResponse);
}
