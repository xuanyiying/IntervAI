"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BullExplorer = void 0;
const tslib_1 = require("tslib");
const bull_shared_1 = require("@nestjs/bull-shared");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const injector_1 = require("@nestjs/core/injector/injector");
const bull_metadata_accessor_1 = require("./bull-metadata.accessor");
let BullExplorer = class BullExplorer {
    constructor(moduleRef, discoveryService, metadataAccessor, metadataScanner) {
        this.moduleRef = moduleRef;
        this.discoveryService = discoveryService;
        this.metadataAccessor = metadataAccessor;
        this.metadataScanner = metadataScanner;
        this.logger = new common_1.Logger('BullModule');
        this.injector = new injector_1.Injector();
    }
    onModuleInit() {
        this.explore();
    }
    explore() {
        const providers = this.discoveryService
            .getProviders()
            .filter((wrapper) => this.metadataAccessor.isQueueComponent(
        // NOTE: Regarding the ternary statement below,
        // - The condition `!wrapper.metatype` is because when we use `useValue`
        // the value of `wrapper.metatype` will be `null`.
        // - The condition `wrapper.inject` is needed here because when we use
        // `useFactory`, the value of `wrapper.metatype` will be the supplied
        // factory function.
        // For both cases, we should use `wrapper.instance.constructor` instead
        // of `wrapper.metatype` to resolve processor's class properly.
        // But since calling `wrapper.instance` could degrade overall performance
        // we must defer it as much we can. But there's no other way to grab the
        // right class that could be annotated with `@Processor()` decorator
        // without using this property.
        !wrapper.metatype || wrapper.inject
            ? wrapper.instance?.constructor
            : wrapper.metatype));
        providers.forEach((wrapper) => {
            const { instance, metatype } = wrapper;
            const isRequestScoped = !wrapper.isDependencyTreeStatic();
            const { name: queueName } = this.metadataAccessor.getQueueComponentMetadata(
            // NOTE: We are relying on `instance.constructor` to properly support
            // `useValue` and `useFactory` providers besides `useClass`.
            instance.constructor || metatype);
            const queueToken = (0, bull_shared_1.getQueueToken)(queueName);
            const bullQueue = this.getQueue(queueToken, queueName);
            this.metadataScanner.scanFromPrototype(instance, Object.getPrototypeOf(instance), (key) => {
                if (this.metadataAccessor.isProcessor(instance[key])) {
                    const metadata = this.metadataAccessor.getProcessMetadata(instance[key]);
                    this.handleProcessor(instance, key, bullQueue, wrapper.host, isRequestScoped, metadata);
                }
                else if (this.metadataAccessor.isListener(instance[key])) {
                    const metadata = this.metadataAccessor.getListenerMetadata(instance[key]);
                    this.handleListener(instance, key, wrapper, bullQueue, metadata);
                }
            });
        });
    }
    getQueue(queueToken, queueName) {
        try {
            return this.moduleRef.get(queueToken, { strict: false });
        }
        catch (err) {
            this.logger.error((0, bull_shared_1.NO_QUEUE_FOUND)(queueName));
            throw err;
        }
    }
    handleProcessor(instance, key, queue, moduleRef, isRequestScoped, options) {
        let args = [options?.name, options?.concurrency];
        if (isRequestScoped) {
            const callback = async (...args) => {
                const contextId = (0, core_1.createContextId)();
                if (this.moduleRef.registerRequestByContextId) {
                    // Additional condition to prevent breaking changes in
                    // applications that use @nestjs/bull older than v7.4.0.
                    const jobRef = args[0];
                    this.moduleRef.registerRequestByContextId(jobRef, contextId);
                }
                const contextInstance = await this.injector.loadPerContext(instance, moduleRef, moduleRef.providers, contextId);
                return contextInstance[key].call(contextInstance, ...args);
            };
            args.push(callback);
        }
        else {
            args.push(instance[key].bind(instance));
        }
        args = args.filter((item) => item !== undefined);
        queue.process.call(queue, ...args);
    }
    handleListener(instance, key, wrapper, queue, options) {
        if (!wrapper.isDependencyTreeStatic()) {
            this.logger.warn(`Warning! "${wrapper.name}" class is request-scoped and it defines an event listener ("${wrapper.name}#${key}"). Since event listeners cannot be registered on scoped providers, this handler will be ignored.`);
            return;
        }
        if (options.name || options.id) {
            queue.on(options.eventName, async (jobOrJobId, ...args) => {
                const job = typeof jobOrJobId === 'string'
                    ? (await queue.getJob(jobOrJobId)) || { name: false, id: false }
                    : jobOrJobId;
                if (job.name === options.name || job.id === options.id) {
                    return instance[key].apply(instance, [job, ...args]);
                }
            });
        }
        else {
            queue.on(options.eventName, instance[key].bind(instance));
        }
    }
};
exports.BullExplorer = BullExplorer;
exports.BullExplorer = BullExplorer = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [core_1.ModuleRef,
        core_1.DiscoveryService,
        bull_metadata_accessor_1.BullMetadataAccessor,
        core_1.MetadataScanner])
], BullExplorer);
