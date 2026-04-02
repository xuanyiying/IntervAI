import { SimulationScenarioConfig } from '../index.js';
export class Simulation {
    id;
    status;
    notificationSettingId;
    name;
    type;
    payload;
    lastRunAt;
    createdAt;
    updatedAt;
    config;
    constructor(simulationResponse) {
        this.id = simulationResponse.id;
        this.status = simulationResponse.status;
        this.notificationSettingId = simulationResponse.notification_setting_id;
        this.name = simulationResponse.name;
        this.type = simulationResponse.type;
        this.payload = simulationResponse.payload ?? null;
        this.lastRunAt = simulationResponse.last_run_at ?? null;
        this.createdAt = simulationResponse.created_at;
        this.updatedAt = simulationResponse.updated_at;
        this.config = simulationResponse.config ? new SimulationScenarioConfig(simulationResponse.config) : null;
    }
}
