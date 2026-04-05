const { verifyToken } = require("../utils/jwt");
const { PrismaClient } = require("@prisma/client");
const AppError = require("../utils/AppError");

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Authorization token missing or invalid.", 401));
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return next(new AppError("User not found.", 401));
        }

        if (user.status === "INACTIVE") {
            return next(new AppError("User account is inactive.", 403));
        }

        req.user = user;
        next();
    } catch (err) {
        return next(new AppError("Invalid or expired token.", 401));
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("Insufficient permissions", 403));
        }
        next();
    };
};

module.exports = {
    authenticate,
    requireRole,
};
