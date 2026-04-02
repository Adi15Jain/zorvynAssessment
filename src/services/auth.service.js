const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");

const prisma = new PrismaClient();

const registerUser = async ({ name, email, password }) => {
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        const error = new Error("User with this email already exists.");
        error.statusCode = 409;
        throw error;
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
        const error = new Error("Invalid email or password.");
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        const error = new Error("Invalid email or password.");
        error.statusCode = 401;
        throw error;
    }

    if (user.status !== "ACTIVE") {
        const error = new Error("Your account is currently inactive.");
        error.statusCode = 403;
        throw error;
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
