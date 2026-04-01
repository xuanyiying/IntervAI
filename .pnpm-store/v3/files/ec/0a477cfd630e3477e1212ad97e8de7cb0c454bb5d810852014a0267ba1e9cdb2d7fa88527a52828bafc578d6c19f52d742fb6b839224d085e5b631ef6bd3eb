"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulationTypesResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const SimulationTypesPaths = {
    list: '/simulation-types',
};
class SimulationTypesResource extends index_js_1.BaseResource {
    async list() {
        const response = await this.client.get(SimulationTypesPaths.list);
        const data = this.handleResponse(response);
        return data.map((simulationType) => new index_js_2.SimulationType(simulationType));
    }
}
exports.SimulationTypesResource = SimulationTypesResource;
