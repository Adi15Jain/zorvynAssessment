const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

const prisma = new PrismaClient();

const registerUser = async ({ name, email, password }) => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new AppError("User with this email already exists.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            role: "VIEWER",
            status: "ACTIVE",
        },
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

    return user;
};

const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Shared error message for security (don't leak if email exists)
        throw new AppError("Invalid email or password.", 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
    }

    if (user.status !== "ACTIVE") {
        throw new AppError("Your account is currently inactive.", 403);
    }

    const token = generateToken({ userId: user.id, role: user.role });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
        token,
    };
};

module.exports = {
    registerUser,
    loginUser,
};
