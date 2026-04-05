const { z } = require("zod");

const createRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be positive"),
    type: z.enum(["INCOME", "EXPENSE"]),
    category: z.string().min(1, "Category is required"),
    date: z.string().min(1, "Date is required"), // Accept any date string, service handles conversion
    notes: z.string().optional().nullable(),
  })
});

const updateRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    category: z.string().min(1).optional(),
    date: z.string().optional(),
    notes: z.string().optional().nullable(),
  })
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
};
