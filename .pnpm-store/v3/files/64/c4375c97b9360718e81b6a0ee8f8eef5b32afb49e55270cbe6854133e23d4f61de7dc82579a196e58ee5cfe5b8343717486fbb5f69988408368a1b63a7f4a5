import type { SimulationRunStatus, SimulationScenarioType } from '../../enums/index.js';
import type { IEventName } from '../../notifications/index.js';
import type { ISimulationRunEventResponse } from '../index.js';
export interface ISimulationRunResponse {
    id: string;
    status: SimulationRunStatus;
    created_at: string;
    updated_at: string;
    type: IEventName | SimulationScenarioType;
    events?: ISimulationRunEventResponse[];
}
