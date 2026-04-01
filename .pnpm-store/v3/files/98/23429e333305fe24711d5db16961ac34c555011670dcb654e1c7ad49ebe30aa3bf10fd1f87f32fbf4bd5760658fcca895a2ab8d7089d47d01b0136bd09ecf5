import { type ISimulationResponse } from '../../types/index.js';
import type { SimulationScenarioType, Status } from '../../enums/index.js';
import type { IEventName } from '../../notifications/index.js';
import { SimulationScenarioConfig } from '../index.js';
export declare class Simulation {
    readonly id: string;
    readonly status: Status;
    readonly notificationSettingId: string;
    readonly name: string;
    readonly type: IEventName | SimulationScenarioType;
    readonly payload: any;
    readonly lastRunAt: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly config: SimulationScenarioConfig | null;
    constructor(simulationResponse: ISimulationResponse);
}
