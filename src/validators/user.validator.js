const { z } = require("zod");

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    role: z.enum(["VIEWER", "ANALYST", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

module.exports = {
    updateUserSchema,
};
