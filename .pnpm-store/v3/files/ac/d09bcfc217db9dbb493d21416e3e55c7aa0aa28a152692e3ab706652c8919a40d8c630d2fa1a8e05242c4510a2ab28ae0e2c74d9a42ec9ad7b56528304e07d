"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Processor = Processor;
const common_1 = require("@nestjs/common");
const constants_1 = require("@nestjs/common/constants");
const bull_constants_1 = require("../bull.constants");
function Processor(queueNameOrOptions) {
    const options = queueNameOrOptions && typeof queueNameOrOptions === 'object'
        ? queueNameOrOptions
        : { name: queueNameOrOptions };
    // eslint-disable-next-line @typescript-eslint/ban-types
    return (target) => {
        (0, common_1.SetMetadata)(constants_1.SCOPE_OPTIONS_METADATA, options)(target);
        (0, common_1.SetMetadata)(bull_constants_1.BULL_MODULE_QUEUE, options)(target);
    };
}
