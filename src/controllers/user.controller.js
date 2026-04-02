const { PrismaClient } = require("@prisma/client");
const { successResponse, errorResponse } = require("../utils/response");

const prisma = new PrismaClient();

const getAllUsers = async (req, res, next) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return successResponse(res, users, "Users retrieved successfully");
    } catch (err) {
        next(err);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return errorResponse(res, "User not found", 404);
        }

        return successResponse(res, user, "User retrieved successfully");
    } catch (err) {
        next(err);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, role, status } = req.body;

        // Prevent admin from setting their own status to INACTIVE
        if (id === req.user.id && status === "INACTIVE") {
            return errorResponse(
                res,
                "You cannot deactivate your own account.",
                400,
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, role, status },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return successResponse(res, updatedUser, "User updated successfully");
    } catch (err) {
        next(err);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting their own account
        if (id === req.user.id) {
            return errorResponse(
                res,
                "You cannot delete your own account.",
                400,
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return successResponse(res, null, "User deleted successfully");
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
