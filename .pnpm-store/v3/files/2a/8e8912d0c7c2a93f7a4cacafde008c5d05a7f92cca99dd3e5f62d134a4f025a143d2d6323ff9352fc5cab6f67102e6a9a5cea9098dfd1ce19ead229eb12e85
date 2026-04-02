"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WinstonModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonModule = void 0;
const common_1 = require("@nestjs/common");
const winston_providers_1 = require("./winston.providers");
let WinstonModule = WinstonModule_1 = class WinstonModule {
    static forRoot(options) {
        const providers = (0, winston_providers_1.createWinstonProviders)(options);
        return {
            module: WinstonModule_1,
            providers: providers,
            exports: providers,
        };
    }
    static forRootAsync(options) {
        const providers = (0, winston_providers_1.createWinstonAsyncProviders)(options);
        return {
            module: WinstonModule_1,
            imports: options.imports,
            providers: providers,
            exports: providers,
        };
    }
    static createLogger(options) {
        return (0, winston_providers_1.createNestWinstonLogger)(options);
    }
};
WinstonModule = WinstonModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], WinstonModule);
exports.WinstonModule = WinstonModule;
