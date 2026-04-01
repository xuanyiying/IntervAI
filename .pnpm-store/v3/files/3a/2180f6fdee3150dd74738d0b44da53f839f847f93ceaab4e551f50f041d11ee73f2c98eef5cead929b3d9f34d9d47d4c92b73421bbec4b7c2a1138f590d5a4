"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathParameters = void 0;
class PathParameters {
    url;
    pathParameters;
    constructor(url, pathParameters) {
        this.url = url;
        this.pathParameters = pathParameters;
    }
    deriveUrl() {
        let updatedUrl = this.url;
        for (const key in this.pathParameters) {
            const value = this.pathParameters[key];
            if (key && value) {
                updatedUrl = updatedUrl.split(`{${key}}`).join(value.toString());
            }
        }
        return updatedUrl;
    }
}
exports.PathParameters = PathParameters;
