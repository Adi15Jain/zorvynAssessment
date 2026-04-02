const { z } = require("zod");
const { errorResponse } = require("../utils/response");

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        const errors = err.errors.map((e) => ({
            field: e.path[0],
            message: e.message,
        }));
        return errorResponse(res, "Validation failed", 400, errors);
    }
};

module.exports = {
    registerSchema,
    loginSchema,
    validate,
};
