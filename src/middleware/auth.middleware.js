const { verifyToken } = require("../utils/jwt");
const { PrismaClient } = require("@prisma/client");
const { errorResponse } = require("../utils/response");

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(
            res,
            "Authorization token missing or invalid.",
            401,
        );
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return errorResponse(res, "User not found.", 401);
        }

        if (user.status === "INACTIVE") {
            return errorResponse(res, "User account is inactive.", 403);
        }

        req.user = user;
        next();
    } catch (err) {
        return errorResponse(res, "Invalid or expired token.", 401);
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return errorResponse(res, "Insufficient permissions", 403);
        }
        next();
    };
};

module.exports = {
    authenticate,
    requireRole,
};
