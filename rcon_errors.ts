export class UnexpectedResponse extends Error {
    response: string;

    constructor(msg: string, response: string) {
        super(msg);
        this.name = "UnexpectedResponse";
        this.response = response;
    }
}

export class AuthenticationFailed extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = "AuthenticationFailed";
    }
}
