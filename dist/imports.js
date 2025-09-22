"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcrypt = exports.dotenv = exports.prisma = exports.Server = exports.Socket = void 0;
var socket_io_1 = require("socket.io");
Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket_io_1.Socket; } });
Object.defineProperty(exports, "Server", { enumerable: true, get: function () { return socket_io_1.Server; } });
var prisma_client_1 = require("./prisma_client");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return prisma_client_1.prisma; } });
exports.dotenv = __importStar(require("dotenv"));
exports.bcrypt = __importStar(require("bcrypt"));
__exportStar(require("./middlewares/index"), exports);
__exportStar(require("./config/index"), exports);
__exportStar(require("./utils/index"), exports);
__exportStar(require("./modules/index"), exports);
__exportStar(require("./routes/index"), exports);
__exportStar(require("./services/index"), exports);
