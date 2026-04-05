const authService = require("../services/auth.service");
const { successResponse } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    const user = await authService.registerUser({ name, email, password });
    return successResponse(res, user, "User registered successfully", 201);
});

const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const data = await authService.loginUser({ email, password });
    return successResponse(res, data, "Login successful");
});

const me = asyncHandler(async (req, res, next) => {
    const { passwordHash: _, ...userWithoutPassword } = req.user;
    return successResponse(res, userWithoutPassword, "User retrieved successfully");
});

module.exports = {
    register,
    login,
    me,
};
