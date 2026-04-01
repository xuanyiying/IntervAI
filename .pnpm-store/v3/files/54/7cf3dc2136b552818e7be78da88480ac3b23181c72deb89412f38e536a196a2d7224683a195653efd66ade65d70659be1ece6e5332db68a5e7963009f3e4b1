export class ClientToken {
    id;
    token;
    name;
    description;
    status;
    createdAt;
    updatedAt;
    revokedAt;
    constructor(clientToken) {
        this.id = clientToken.id;
        this.token = clientToken.token;
        this.name = clientToken.name;
        this.description = clientToken.description ?? null;
        this.status = clientToken.status;
        this.createdAt = clientToken.created_at;
        this.updatedAt = clientToken.updated_at;
        this.revokedAt = clientToken.revoked_at ?? null;
    }
}
