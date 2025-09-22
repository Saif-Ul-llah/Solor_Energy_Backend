"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
class HttpError extends Error {
    constructor(message, errorCode, statusCode) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.message = message;
        this.code = errorCode;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
    static referenceError(message) {
        return new HttpError(message, "reference-error", 400);
    }
    static notFound(message) {
        return new HttpError(message, "not-found", 404);
    }
    static invalidParameters(message) {
        return new HttpError(message, "invalid-parameters", 400);
    }
    static missingParameters(message) {
        return new HttpError(message, "missing-parameters", 400);
    }
    static invalidContactNumber() {
        return HttpError.invalidParameters("Invalid Contact Number");
    }
    static invalidCredentials() {
        return new HttpError("Invalid username or password", "invalid-credentials", 401);
    }
    static unAuthorized() {
        return new HttpError("User is not authorized for this action", "unauthorized", 401);
    }
    static invalidTokens() {
        return new HttpError("Tokens are missing or invalid", "invalid-tokens", 401);
    }
    static googleAPIErr(msg) {
        return new HttpError(msg, "google-api-error", 401);
    }
    static alreadyExists(resource) {
        return new HttpError(`${resource} already exists`, "already-exists", 409);
    }
    static databaseError(message = "Database operation failed") {
        return new HttpError(message, "database-error", 500);
    }
    static validationError(message) {
        return new HttpError(message, "validation-error", 400);
    }
}
exports.HttpError = HttpError;
