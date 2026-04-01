"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypesResource = void 0;
const index_js_1 = require("../../internal/base/index.js");
const index_js_2 = require("../../entities/index.js");
const EventTypesPaths = {
    list: '/event-types',
};
class EventTypesResource extends index_js_1.BaseResource {
    async list() {
        const response = await this.client.get(EventTypesPaths.list);
        const data = this.handleResponse(response);
        return data.map((eventType) => new index_js_2.EventType(eventType));
    }
}
exports.EventTypesResource = EventTypesResource;
