"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdvancedProcessor = isAdvancedProcessor;
const is_processor_callback_util_1 = require("./is-processor-callback.util");
function isAdvancedProcessor(processor) {
    return ('object' === typeof processor &&
        !!processor.callback &&
        (0, is_processor_callback_util_1.isProcessorCallback)(processor.callback));
}
