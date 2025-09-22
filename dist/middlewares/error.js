"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const imports_1 = require("./../imports");
const client_1 = require("@prisma/client");
const errorHandler = (err, req, res, next) => {
    var _a, _b, _c;
    console.error("ERROR DETAILS:", err);
    let error = { ...err };
    error.message = err.message;
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002": {
                const field = ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.target) || ["field"];
                error = imports_1.HttpError.alreadyExists(`Record with this ${field.join(", ")} already exists`);
                break;
            }
            case "P2003": {
                const field = ((_b = err.meta) === null || _b === void 0 ? void 0 : _b.field_name) || "field";
                error = imports_1.HttpError.referenceError(`Referenced ${field} does not exist`);
                break;
            }
            case "P2001":
            case "P2018":
            case "P2025": {
                error = imports_1.HttpError.notFound(`Requested record not found`);
                break;
            }
            case "P2011": {
                const field = ((_c = err.meta) === null || _c === void 0 ? void 0 : _c.constraint) || "field";
                error = imports_1.HttpError.missingParameters(`Required field ${field} is missing`);
                break;
            }
            case "P2007":
            case "P2012": {
                error = imports_1.HttpError.validationError(err.message);
                break;
            }
            case "P2005":
            case "P2006": {
                error = imports_1.HttpError.invalidParameters(`Invalid data format: ${err.message}`);
                break;
            }
            default:
                error = imports_1.HttpError.databaseError(`Database error occurred`);
        }
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        error = imports_1.HttpError.validationError("Invalid data provided");
    }
    else if (err instanceof client_1.Prisma.PrismaClientInitializationError ||
        err instanceof client_1.Prisma.PrismaClientRustPanicError ||
        err instanceof client_1.Prisma.PrismaClientUnknownRequestError) {
        error = imports_1.HttpError.databaseError("Database connection issue");
    }
    else if (err.code) {
        switch (err.code) {
            case "23505":
                error = imports_1.HttpError.alreadyExists(`Record already exists`);
                break;
            case "23503":
                error = imports_1.HttpError.referenceError(`Referenced record does not exist`);
                break;
            case "23514":
                error = imports_1.HttpError.invalidParameters(`Data validation failed`);
                break;
            case "23502":
                error = imports_1.HttpError.missingParameters(`Required data is missing`);
                break;
            case "08000":
            case "08003":
            case "08006":
            case "08001":
            case "08004":
                error = imports_1.HttpError.databaseError(`Database connection issue`);
                break;
            case "22012":
                error = imports_1.HttpError.invalidParameters(`Mathematical error: division by zero`);
                break;
            case "22001":
                error = imports_1.HttpError.invalidParameters(`Input value too long`);
                break;
        }
    }
    else if (err.name === "CastError") {
        error = imports_1.HttpError.invalidParameters(err.message);
    }
    else if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {}).join(", ") || "field";
        error = imports_1.HttpError.alreadyExists(`Record with this ${field} already exists`);
    }
    else if (err.name === "ValidationError") {
        const message = Object.values(err.errors || {}).map((val) => val.message);
        error = imports_1.HttpError.validationError(message);
    }
    else if (err instanceof imports_1.HttpError) {
        error = err;
    }
    else if (!error.statusCode) {
        error = imports_1.HttpError.databaseError("An unexpected error occurred");
    }
    res.status(error.statusCode || 500).json({
        success: false,
        code: error.code || "server-error",
        message: error.message || "Server error occurred",
    });
};
exports.errorHandler = errorHandler;
