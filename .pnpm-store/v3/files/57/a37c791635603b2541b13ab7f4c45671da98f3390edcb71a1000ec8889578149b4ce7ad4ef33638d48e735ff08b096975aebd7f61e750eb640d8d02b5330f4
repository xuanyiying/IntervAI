export class ApiError extends Error {
    type;
    code;
    detail;
    documentationUrl;
    errors;
    retryAfter;
    constructor(errorDetail, retryAfter) {
        super(errorDetail.detail);
        this.type = errorDetail.type;
        this.code = errorDetail.code;
        this.detail = errorDetail.detail;
        this.documentationUrl = errorDetail.documentation_url;
        this.errors = errorDetail.errors ? errorDetail.errors : null;
        this.retryAfter = retryAfter;
    }
}
