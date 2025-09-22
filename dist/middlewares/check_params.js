"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNecessaryParameters = void 0;
const imports_1 = require("./../imports");
const checkNecessaryParameters = (parameters) => (req, res, next) => {
    let params = [];
    let flag = true;
    for (let i = 0; i < parameters.length; i++) {
        if (req.body[parameters[i]] == null) {
            params.push(parameters[i]);
            flag = false;
        }
    }
    if (flag) {
        return next();
    }
    else {
        next(imports_1.HttpError.missingParameters(params.join(",")));
    }
};
exports.checkNecessaryParameters = checkNecessaryParameters;
