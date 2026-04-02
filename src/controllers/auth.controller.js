const authService = require("../services/auth.service");
const { successResponse } = require("../utils/response");

const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await authService.registerUser({ name, email, password });
        return successResponse(res, user, "User registered successfully", 201);
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await authService.loginUser({ email, password });
        return successResponse(res, data, "Login successful");
    } catch (err) {
        next(err);
    }
};

const me = async (req, res, next) => {
    try {
        const { passwordHash: _, ...userWithoutPassword } = req.user;
        return successResponse(res, userWithoutPassword, "User retrieved successfully");
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    me,
};
