function convertCamelCaseToSnakeCase(input) {
    return input.replace(/\b(\w+)([A-Z][a-z])/g, (_match, p1, p2) => {
        return p1.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() + '_' + p2.toLowerCase();
    });
}
function isValidValue(value) {
    return value !== undefined && value !== null && value !== '';
}
export class QueryParameters {
    queryParameters;
    constructor(queryParameters) {
        this.queryParameters = queryParameters;
    }
    toQueryString() {
        const urlSearchParam = new URLSearchParams();
        for (const key in this.queryParameters) {
            const value = this.queryParameters[key];
            if (key && isValidValue(value)) {
                urlSearchParam.append(convertCamelCaseToSnakeCase(key), `${value}`);
            }
        }
        return '?' + urlSearchParam.toString();
    }
}
