const { z } = require("zod");

const createRecordSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.string().min(1, "Category is required"),
    date: z.string().datetime().or(z.date()),
    notes: z.string().optional(),
});

const updateRecordSchema = z.object({
    amount: z.number().positive().optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.string().min(1).optional(),
    date: z.string().datetime().or(z.date()).optional(),
    notes: z.string().optional(),
});

module.exports = {
    createRecordSchema,
    updateRecordSchema,
};
