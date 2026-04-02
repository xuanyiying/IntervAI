import { Event } from '../../../entities/events/event.js';
import { convertKeysToCamelCase } from '../../../internal/base/index.js';
export class GenericEvent extends Event {
    data;
    constructor(response) {
        super(response);
        this.data = convertKeysToCamelCase(response.data);
    }
}
