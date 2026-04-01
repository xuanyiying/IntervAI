"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientTokenCreatedEvent = void 0;
const event_js_1 = require("../../../entities/events/event.js");
const index_js_1 = require("../../helpers/index.js");
const index_js_2 = require("../../entities/index.js");
class ClientTokenCreatedEvent extends event_js_1.Event {
    eventType = index_js_1.EventName.ClientTokenCreated;
    data;
    constructor(response) {
        super(response);
        this.data = new index_js_2.ClientTokenNotification(response.data);
    }
}
exports.ClientTokenCreatedEvent = ClientTokenCreatedEvent;
