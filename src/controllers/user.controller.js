const { PrismaClient } = require("@prisma/client");
const { successResponse } = require("../utils/response");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const prisma = new PrismaClient();

const getAllUsers = asyncHandler(async (req, res, next) => {
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
});

const getUserById = asyncHandler(async (req, res, next) => {
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
            return next(new AppError("User not found", 404));
        }

        return successResponse(res, user, "User retrieved successfully");
});

const updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
        const { name, role, status } = req.body;

        // Prevent admin from setting their own status to INACTIVE
        if (id === req.user.id && status === "INACTIVE") {
            return next(new AppError("You cannot deactivate your own account.", 400));
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
});

const deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

        // Prevent admin from deleting their own account
        if (id === req.user.id) {
            return next(new AppError("You cannot delete your own account.", 400));
        }

        await prisma.user.delete({
            where: { id },
        });

        return successResponse(res, null, "User deleted successfully");
});

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
