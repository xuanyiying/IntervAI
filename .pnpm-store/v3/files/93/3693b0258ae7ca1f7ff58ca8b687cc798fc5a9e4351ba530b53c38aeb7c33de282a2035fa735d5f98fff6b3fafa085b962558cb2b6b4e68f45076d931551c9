"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessImportedEvent = void 0;
const event_js_1 = require("../../../entities/events/event.js");
const index_js_1 = require("../../helpers/index.js");
const index_js_2 = require("../../entities/index.js");
class BusinessImportedEvent extends event_js_1.Event {
    eventType = index_js_1.EventName.BusinessImported;
    data;
    constructor(response) {
        super(response);
        this.data = new index_js_2.BusinessNotification(response.data);
    }
}
exports.BusinessImportedEvent = BusinessImportedEvent;
