"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWinstonAsyncProviders = exports.createWinstonProviders = exports.createNestWinstonLogger = void 0;
const winston_1 = require("winston");
const winston_constants_1 = require("./winston.constants");
const winston_classes_1 = require("./winston.classes");
function createNestWinstonLogger(loggerOpts) {
    if (loggerOpts.instance) {
        return new winston_classes_1.WinstonLogger(loggerOpts.instance);
    }
    return new winston_classes_1.WinstonLogger((0, winston_1.createLogger)(loggerOpts));
}
exports.createNestWinstonLogger = createNestWinstonLogger;
function createWinstonProviders(loggerOpts) {
    return [
        {
            provide: winston_constants_1.WINSTON_MODULE_PROVIDER,
            useFactory: () => (0, winston_1.createLogger)(loggerOpts),
        },
        {
            provide: winston_constants_1.WINSTON_MODULE_NEST_PROVIDER,
            useFactory: (logger) => {
                return new winston_classes_1.WinstonLogger(logger);
            },
            inject: [winston_constants_1.WINSTON_MODULE_PROVIDER],
        },
    ];
}
exports.createWinstonProviders = createWinstonProviders;
function createWinstonAsyncProviders(options) {
    const providers = [
        {
            provide: winston_constants_1.WINSTON_MODULE_PROVIDER,
            useFactory: (loggerOpts) => (0, winston_1.createLogger)(loggerOpts),
            inject: [winston_constants_1.WINSTON_MODULE_OPTIONS],
        },
        {
            provide: winston_constants_1.WINSTON_MODULE_NEST_PROVIDER,
            useFactory: (logger) => {
                return new winston_classes_1.WinstonLogger(logger);
            },
            inject: [winston_constants_1.WINSTON_MODULE_PROVIDER],
        },
    ];
    if (options.useClass) {
        const useClass = options.useClass;
        providers.push(...[
            {
                provide: winston_constants_1.WINSTON_MODULE_OPTIONS,
                useFactory: (optionsFactory) => __awaiter(this, void 0, void 0, function* () { return yield optionsFactory.createWinstonModuleOptions(); }),
                inject: [useClass],
            },
            {
                provide: useClass,
                useClass,
            },
        ]);
    }
    if (options.useFactory) {
        providers.push({
            provide: winston_constants_1.WINSTON_MODULE_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject || [],
        });
    }
    return providers;
}
exports.createWinstonAsyncProviders = createWinstonAsyncProviders;
