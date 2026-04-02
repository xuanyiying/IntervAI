"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertKeysToCamelCase = convertKeysToCamelCase;
function toCamelCase(str) {
    return str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
function convertKeysToCamelCase(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(convertKeysToCamelCase);
    }
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelCaseKey = toCamelCase(key);
        converted[camelCaseKey] = convertKeysToCamelCase(value);
    }
    return converted;
}
