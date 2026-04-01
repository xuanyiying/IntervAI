"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericEvent = void 0;
const event_js_1 = require("../../../entities/events/event.js");
const index_js_1 = require("../../../internal/base/index.js");
class GenericEvent extends event_js_1.Event {
    data;
    constructor(response) {
        super(response);
        this.data = (0, index_js_1.convertKeysToCamelCase)(response.data);
    }
}
exports.GenericEvent = GenericEvent;
