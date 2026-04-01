"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueueOptionProviders = createQueueOptionProviders;
exports.createQueueProviders = createQueueProviders;
const bull_shared_1 = require("@nestjs/bull-shared");
const common_1 = require("@nestjs/common");
const Bull = require("bull");
const utils_1 = require("./utils");
const is_advanced_processor_util_1 = require("./utils/is-advanced-processor.util");
const is_advanced_separate_processor_util_1 = require("./utils/is-advanced-separate-processor.util");
const is_processor_callback_util_1 = require("./utils/is-processor-callback.util");
const is_separate_processor_util_1 = require("./utils/is-separate-processor.util");
function buildQueue(options) {
    const queueName = options.name ? options.name : 'default';
    const queue = options?.url
        ? new Bull(queueName, options.url, options)
        : new Bull(queueName, options);
    if (options.processors) {
        options.processors.forEach((processor) => {
            let args = [];
            if ((0, is_advanced_processor_util_1.isAdvancedProcessor)(processor)) {
                args.push(processor.name, processor.concurrency, processor.callback);
            }
            else if ((0, is_advanced_separate_processor_util_1.isAdvancedSeparateProcessor)(processor)) {
                args.push(processor.name, processor.concurrency, processor.path);
            }
            else if ((0, is_separate_processor_util_1.isSeparateProcessor)(processor)) {
                args.push(processor);
            }
            else if ((0, is_processor_callback_util_1.isProcessorCallback)(processor)) {
                args.push(processor);
            }
            args = args.filter((arg) => typeof arg !== 'undefined');
            queue.process.call(queue, ...args);
        });
    }
    queue.onApplicationShutdown = function () {
        return this.close();
    };
    return queue;
}
function createQueueOptionProviders(options) {
    const providers = options.map((option) => {
        const optionalSharedConfigHolder = (0, bull_shared_1.createConditionalDepHolder)((0, utils_1.getSharedConfigToken)(option.configKey), utils_1.BULL_CONFIG_DEFAULT_TOKEN);
        return [
            optionalSharedConfigHolder,
            {
                provide: (0, utils_1.getQueueOptionsToken)(option.name),
                useFactory: (optionalDepHolder) => {
                    return {
                        ...optionalDepHolder.getDependencyRef(option.name),
                        ...option,
                    };
                },
                inject: [optionalSharedConfigHolder],
            },
        ];
    });
    return (0, common_1.flatten)(providers);
}
function createQueueProviders(options) {
    return options.map((option) => ({
        provide: (0, bull_shared_1.getQueueToken)(option.name),
        useFactory: (o) => {
            const queueName = o.name || option.name;
            return buildQueue({ ...o, name: queueName });
        },
        inject: [(0, utils_1.getQueueOptionsToken)(option.name)],
    }));
}
