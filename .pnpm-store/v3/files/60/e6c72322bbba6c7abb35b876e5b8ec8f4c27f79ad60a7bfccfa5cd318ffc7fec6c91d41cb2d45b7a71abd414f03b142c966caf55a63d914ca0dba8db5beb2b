import type { SimulationRunStatus, SimulationScenarioType } from '../../enums/index.js';
import type { IEventName } from '../../notifications/index.js';
import type { ISimulationRunResponse } from '../../types/index.js';
import { SimulationRunEvent } from '../index.js';
export declare class SimulationRun {
    readonly id: string;
    readonly status: SimulationRunStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly type: IEventName | SimulationScenarioType;
    readonly events: SimulationRunEvent[] | null;
    constructor(simulationRunResponse: ISimulationRunResponse);
}
