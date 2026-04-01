"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Process = Process;
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const bull_constants_1 = require("../bull.constants");
function Process(nameOrOptions) {
    const options = (0, shared_utils_1.isString)(nameOrOptions)
        ? { name: nameOrOptions }
        : nameOrOptions;
    return (0, common_1.SetMetadata)(bull_constants_1.BULL_MODULE_QUEUE_PROCESS, options || {});
}
