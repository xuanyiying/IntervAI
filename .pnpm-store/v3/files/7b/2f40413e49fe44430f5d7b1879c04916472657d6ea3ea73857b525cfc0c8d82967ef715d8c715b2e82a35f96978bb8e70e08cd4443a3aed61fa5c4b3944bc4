import { BaseResource } from '../../internal/base/index.js';
import { SimulationType } from '../../entities/index.js';
const SimulationTypesPaths = {
    list: '/simulation-types',
};
export class SimulationTypesResource extends BaseResource {
    async list() {
        const response = await this.client.get(SimulationTypesPaths.list);
        const data = this.handleResponse(response);
        return data.map((simulationType) => new SimulationType(simulationType));
    }
}
