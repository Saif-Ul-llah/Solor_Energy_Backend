"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToken = void 0;
const imports_1 = require("./../imports");
const async_1 = require("./async");
const checkToken = (0, async_1.asyncHandler)(async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authorization.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = (0, imports_1.decryptToken)(token);
    if (!decoded) {
        return res.status(401).json({
            status: "failed",
            message: "Token is Expired or Invalid",
            data: null,
        });
    }
    const user = decoded;
    const dbUser = await imports_1.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
        throw imports_1.HttpError.invalidTokens();
    }
    else if (user.isDisable) {
        throw imports_1.HttpError.notFound("User not found");
    }
    req.user = dbUser;
    next();
});
exports.checkToken = checkToken;
