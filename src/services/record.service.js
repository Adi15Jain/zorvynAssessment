const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createRecord = async (userId, data) => {
    return await prisma.financialRecord.create({
        data: {
            ...data,
            date: new Date(data.date),
            createdByUserId: userId,
        },
    });
};

const getRecords = async (userId, filters = {}) => {
    const { startDate, endDate, category, type } = filters;

    const where = {
        createdByUserId: userId,
        deletedAt: null,
    };

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    if (category) where.category = category;
    if (type) where.type = type;

    return await prisma.financialRecord.findMany({
        where,
        orderBy: { date: "desc" },
    });
};

const getRecordById = async (id, userId) => {
    const record = await prisma.financialRecord.findFirst({
        where: { id, createdByUserId: userId, deletedAt: null },
    });

    if (!record) {
        const error = new Error("Record not found");
        error.statusCode = 404;
        throw error;
    }

    return record;
};

const updateRecord = async (id, userId, data) => {
    // Ensure the record exists and belongs to the user
    await getRecordById(id, userId);

    return await prisma.financialRecord.update({
        where: { id },
        data: {
            ...data,
            date: data.date ? new Date(data.date) : undefined,
        },
    });
};

const deleteRecord = async (id, userId) => {
    // Ensure the record exists and belongs to the user
    await getRecordById(id, userId);

    return await prisma.financialRecord.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
};

module.exports = {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
};
