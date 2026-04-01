"use strict";
var BullModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullModule = void 0;
const tslib_1 = require("tslib");
const bull_shared_1 = require("@nestjs/bull-shared");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const bull_metadata_accessor_1 = require("./bull-metadata.accessor");
const bull_explorer_1 = require("./bull.explorer");
const bull_providers_1 = require("./bull.providers");
const utils_1 = require("./utils");
let BullModule = BullModule_1 = class BullModule {
    /**
     * Registers a globally available configuration for all queues
     * or using a specified "configKey" (if passed).
     *
     * @param keyOrConfig a key under which the configuration should be available or a bull configuration object
     * @param bullConfig bull configuration object
     */
    static forRoot(keyOrConfig, bullConfig) {
        const [configKey, sharedBullConfig] = typeof keyOrConfig === 'string'
            ? [keyOrConfig, bullConfig]
            : [undefined, keyOrConfig];
        const sharedBullConfigProvider = {
            provide: (0, utils_1.getSharedConfigToken)(configKey),
            useValue: sharedBullConfig,
        };
        return {
            global: true,
            module: BullModule_1,
            providers: [sharedBullConfigProvider],
            exports: [sharedBullConfigProvider],
        };
    }
    /**
     * Registers a globally available configuration for all queues
     * or using a specified "configKey" (if passed).
     *
     * @param keyOrAsyncConfig a key under which the configuration should be available or a bull configuration object
     * @param asyncBullConfig shared bull configuration async factory
     */
    static forRootAsync(keyOrAsyncConfig, asyncBullConfig) {
        const [configKey, asyncSharedBullConfig] = typeof keyOrAsyncConfig === 'string'
            ? [keyOrAsyncConfig, asyncBullConfig]
            : [undefined, keyOrAsyncConfig];
        const imports = this.getUniqImports([asyncSharedBullConfig]);
        const providers = this.createAsyncSharedConfigurationProviders(configKey, asyncSharedBullConfig);
        return {
            global: true,
            module: BullModule_1,
            imports,
            providers,
            exports: providers,
        };
    }
    static registerQueue(...options) {
        const queueProviders = (0, bull_providers_1.createQueueProviders)([].concat(options));
        const queueOptionProviders = (0, bull_providers_1.createQueueOptionProviders)([].concat(options));
        return {
            module: BullModule_1,
            imports: [BullModule_1.registerCore()],
            providers: [...queueOptionProviders, ...queueProviders],
            exports: queueProviders,
        };
    }
    static registerQueueAsync(...options) {
        const optionsArr = [].concat(options);
        const queueProviders = (0, bull_providers_1.createQueueProviders)(optionsArr);
        const imports = this.getUniqImports(optionsArr);
        const asyncQueueOptionsProviders = options
            .map((queueOptions) => this.createAsyncProviders(queueOptions))
            .reduce((a, b) => a.concat(b), []);
        const extraProviders = options
            .map((queueOptions) => queueOptions.extraProviders)
            .filter((extraProviders) => extraProviders)
            .reduce((a, b) => a.concat(b), []);
        return {
            imports: imports.concat(BullModule_1.registerCore()),
            module: BullModule_1,
            providers: [
                ...asyncQueueOptionsProviders,
                ...queueProviders,
                ...extraProviders,
            ],
            exports: queueProviders,
        };
    }
    static createAsyncProviders(options) {
        const optionalSharedConfigHolder = (0, bull_shared_1.createConditionalDepHolder)((0, utils_1.getSharedConfigToken)(options.configKey), utils_1.BULL_CONFIG_DEFAULT_TOKEN);
        if (options.useExisting || options.useFactory) {
            return [
                optionalSharedConfigHolder,
                this.createAsyncOptionsProvider(options, optionalSharedConfigHolder),
            ];
        }
        if (!options.useClass) {
            // fallback to the "registerQueue" in case someone accidentally used the "registerQueueAsync" instead
            return (0, bull_providers_1.createQueueOptionProviders)([options]);
        }
        const useClass = options.useClass;
        return [
            optionalSharedConfigHolder,
            this.createAsyncOptionsProvider(options, optionalSharedConfigHolder),
            {
                provide: useClass,
                useClass,
            },
        ];
    }
    static createAsyncOptionsProvider(asyncOptions, optionalSharedConfigHolderRef) {
        if (asyncOptions.useFactory) {
            return {
                provide: (0, utils_1.getQueueOptionsToken)(asyncOptions.name),
                useFactory: async (optionalDepHolder, ...factoryArgs) => {
                    return {
                        ...optionalDepHolder.getDependencyRef(asyncOptions.name),
                        ...(await asyncOptions.useFactory(...factoryArgs)),
                    };
                },
                inject: [optionalSharedConfigHolderRef, ...(asyncOptions.inject || [])],
            };
        }
        // `as Type<BullOptionsFactory>` is a workaround for microsoft/TypeScript#31603
        const inject = [
            (asyncOptions.useClass ||
                asyncOptions.useExisting),
        ];
        return {
            provide: (0, utils_1.getQueueOptionsToken)(asyncOptions.name),
            useFactory: async (optionalDepHolder, optionsFactory) => {
                return {
                    ...optionalDepHolder.getDependencyRef(asyncOptions.name),
                    ...(await optionsFactory.createBullOptions()),
                };
            },
            inject: [optionalSharedConfigHolderRef, ...inject],
        };
    }
    static createAsyncSharedConfigurationProviders(configKey, options) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncSharedConfigurationProvider(configKey, options)];
        }
        const useClass = options.useClass;
        return [
            this.createAsyncSharedConfigurationProvider(configKey, options),
            {
                provide: useClass,
                useClass,
            },
        ];
    }
    static createAsyncSharedConfigurationProvider(configKey, options) {
        if (options.useFactory) {
            return {
                provide: (0, utils_1.getSharedConfigToken)(configKey),
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        // `as Type<SharedBullConfigurationFactory>` is a workaround for microsoft/TypeScript#31603
        const inject = [
            (options.useClass ||
                options.useExisting),
        ];
        return {
            provide: (0, utils_1.getSharedConfigToken)(configKey),
            useFactory: async (optionsFactory) => optionsFactory.createSharedConfiguration(),
            inject,
        };
    }
    static registerCore() {
        return {
            global: true,
            module: BullModule_1,
            imports: [core_1.DiscoveryModule],
            providers: [bull_explorer_1.BullExplorer, bull_metadata_accessor_1.BullMetadataAccessor],
        };
    }
    static getUniqImports(options) {
        return (options
            .map((option) => option.imports)
            .reduce((acc, i) => acc.concat(i || []), [])
            .filter((v, i, a) => a.indexOf(v) === i) || []);
    }
};
exports.BullModule = BullModule;
exports.BullModule = BullModule = BullModule_1 = tslib_1.__decorate([
    (0, common_1.Module)({})
], BullModule);
