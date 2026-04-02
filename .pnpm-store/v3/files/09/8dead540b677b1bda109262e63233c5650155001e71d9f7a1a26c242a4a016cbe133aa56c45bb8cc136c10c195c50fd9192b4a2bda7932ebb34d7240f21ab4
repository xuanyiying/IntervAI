# Installation
> `npm install --save @types/passport-github2`

# Summary
This package contains type definitions for passport-github2 (https://github.com/cfsghost/passport-github).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/passport-github2.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/passport-github2/index.d.ts)
````ts
import passport = require("passport");
import oauth2 = require("passport-oauth2");
import express = require("express");
import { OutgoingHttpHeaders } from "http";

export interface Profile extends passport.Profile {
    profileUrl: string;
}

export interface StrategyOption extends passport.AuthenticateOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;

    scope?: string[] | undefined;
    userAgent?: string | undefined;

    authorizationURL?: string | undefined;
    tokenURL?: string | undefined;
    scopeSeparator?: string | undefined;
    customHeaders?: OutgoingHttpHeaders | undefined;
    userProfileURL?: string | undefined;
    userEmailURL?: string | undefined;
    allRawEmails?: boolean | undefined;
}

export type OAuth2StrategyOptionsWithoutRequiredURLs = Pick<
    oauth2._StrategyOptionsBase,
    Exclude<keyof oauth2._StrategyOptionsBase, "authorizationURL" | "tokenURL">
>;

export interface _StrategyOptionsBase extends OAuth2StrategyOptionsWithoutRequiredURLs {
    clientID: string;
    clientSecret: string;
    callbackURL: string;

    scope?: string[] | undefined;
    userAgent?: string | undefined;
    state?: string | undefined;

    authorizationURL?: string | undefined;
    tokenURL?: string | undefined;
    scopeSeparator?: string | undefined;
    customHeaders?: OutgoingHttpHeaders | undefined;
    userProfileURL?: string | undefined;
    userEmailURL?: string | undefined;
    allRawEmails?: boolean | undefined;
}

export interface StrategyOptions extends _StrategyOptionsBase {
    passReqToCallback?: false | undefined;
}
export interface StrategyOptionsWithRequest extends _StrategyOptionsBase {
    passReqToCallback: true;
}

export class Strategy extends oauth2.Strategy {
    constructor(options: StrategyOptions, verify: oauth2.VerifyFunction);
    constructor(options: StrategyOptionsWithRequest, verify: oauth2.VerifyFunctionWithRequest);
    userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void): void;

    name: string;
    authenticate(req: express.Request, options?: passport.AuthenticateOptions): void;
}

````

### Additional Details
 * Last updated: Tue, 07 Nov 2023 09:09:39 GMT
 * Dependencies: [@types/express](https://npmjs.com/package/@types/express), [@types/passport](https://npmjs.com/package/@types/passport), [@types/passport-oauth2](https://npmjs.com/package/@types/passport-oauth2)

# Credits
These definitions were written by [Yasunori Ohoka](https://github.com/yasupeke), [Maarten Mulders](https://github.com/mthmulders), [Christoph Werner](https://github.com/codepunkt), and [Ivan Fernandes](https://github.com/ivan94).
