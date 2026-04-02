export class ApiKeyNotification {
    id;
    name;
    description;
    key;
    status;
    permissions;
    expiresAt;
    lastUsedAt;
    createdAt;
    updatedAt;
    constructor(apiKey) {
        this.id = apiKey.id;
        this.name = apiKey.name;
        this.description = apiKey.description ?? null;
        this.key = apiKey.key;
        this.status = apiKey.status;
        this.permissions = apiKey.permissions;
        this.expiresAt = apiKey.expires_at ?? null;
        this.lastUsedAt = apiKey.last_used_at ?? null;
        this.createdAt = apiKey.created_at;
        this.updatedAt = apiKey.updated_at;
    }
}
