function isTopLevelCustomDataCamel(input) {
    return 'customData' in input;
}
function isObject(input) {
    return input != null && typeof input === 'object';
}
function snakeCase(input) {
    return input
        .trim()
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\W]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
}
function decamelizeKeys(obj) {
    if (!isObject(obj) ||
        obj instanceof Date ||
        obj instanceof RegExp ||
        typeof obj === 'boolean' ||
        typeof obj === 'function') {
        return obj;
    }
    let output;
    let i = 0;
    let l = 0;
    if (Array.isArray(obj)) {
        output = [];
        for (l = obj.length; i < l; i++) {
            output.push(decamelizeKeys(obj[i]));
        }
    }
    else {
        output = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                output[snakeCase(key)] = decamelizeKeys(obj[key]);
            }
        }
    }
    return output;
}
export function convertToSnakeCase(input) {
    if (!input || !isObject(input)) {
        return input;
    }
    if (isTopLevelCustomDataCamel(input)) {
        const { customData, ...rest } = input;
        const result = decamelizeKeys(rest);
        return { ...result, custom_data: customData };
    }
    else {
        return decamelizeKeys(input);
    }
}
