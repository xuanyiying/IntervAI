"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonLogger = void 0;
class WinstonLogger {
    constructor(logger) {
        this.logger = logger;
    }
    setContext(context) {
        this.context = context;
    }
    log(message, context) {
        context = context || this.context;
        if (!!message && 'object' === typeof message) {
            const { message: msg, level = 'info' } = message, meta = __rest(message, ["message", "level"]);
            return this.logger.log(level, msg, Object.assign({ context }, meta));
        }
        return this.logger.info(message, { context });
    }
    fatal(message, trace, context) {
        context = context || this.context;
        if (message instanceof Error) {
            const { message: msg, name, stack } = message, meta = __rest(message, ["message", "name", "stack"]);
            return this.logger.log(Object.assign({ level: 'fatal', message: msg, context, stack: [trace || stack], error: message }, meta));
        }
        if (!!message && 'object' === typeof message) {
            const { message: msg } = message, meta = __rest(message, ["message"]);
            return this.logger.log(Object.assign({ level: 'fatal', message: msg, context, stack: [trace] }, meta));
        }
        return this.logger.log({ level: 'fatal', message, context, stack: [trace] });
    }
    error(message, trace, context) {
        context = context || this.context;
        if (message instanceof Error) {
            const { message: msg, name, stack } = message, meta = __rest(message, ["message", "name", "stack"]);
            return this.logger.error(msg, Object.assign({ context, stack: [trace || message.stack], error: message }, meta));
        }
        if (!!message && 'object' === typeof message) {
            const { message: msg } = message, meta = __rest(message, ["message"]);
            return this.logger.error(msg, Object.assign({ context, stack: [trace] }, meta));
        }
        return this.logger.error(message, { context, stack: [trace] });
    }
    warn(message, context) {
        context = context || this.context;
        if (!!message && 'object' === typeof message) {
            const { message: msg } = message, meta = __rest(message, ["message"]);
            return this.logger.warn(msg, Object.assign({ context }, meta));
        }
        return this.logger.warn(message, { context });
    }
    debug(message, context) {
        context = context || this.context;
        if (!!message && 'object' === typeof message) {
            const { message: msg } = message, meta = __rest(message, ["message"]);
            return this.logger.debug(msg, Object.assign({ context }, meta));
        }
        return this.logger.debug(message, { context });
    }
    verbose(message, context) {
        context = context || this.context;
        if (!!message && 'object' === typeof message) {
            const { message: msg } = message, meta = __rest(message, ["message"]);
            return this.logger.verbose(msg, Object.assign({ context }, meta));
        }
        return this.logger.verbose(message, { context });
    }
    getWinstonLogger() {
        return this.logger;
    }
}
exports.WinstonLogger = WinstonLogger;
