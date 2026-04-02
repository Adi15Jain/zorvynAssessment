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
    const { startDate, endDate, category, type, search, page, limit } = filters;

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

    if (search && typeof search === 'string' && search.trim() !== "") {
        where.OR = [
            { category: { contains: search.trim(), mode: "insensitive" } },
            { notes: { contains: search.trim(), mode: "insensitive" } },
        ];
    }

    const queryOptions = {
        where,
        orderBy: { date: "desc" },
    };

    const limitNum = parseInt(limit || "20", 10);
    const pageNum = parseInt(page || "1", 10);
    
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const error = new Error("Invalid pagination parameters");
        error.statusCode = 400;
        throw error;
    }

    queryOptions.skip = (pageNum - 1) * limitNum;
    queryOptions.take = limitNum;

    const [total, records] = await Promise.all([
        prisma.financialRecord.count({ where: queryOptions.where }),
        prisma.financialRecord.findMany(queryOptions)
    ]);

    return {
        records,
        total,
        page: pageNum,
        limit: limitNum,
    };
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

const getDeletedRecords = async (userId, filters = {}) => {
    // Only difference is deletedAt is NOT null
    const { page, limit } = filters;
    const where = {
        deletedAt: { not: null },
    };
    const queryOptions = {
        where,
        orderBy: { deletedAt: "desc" },
    };

    const limitNum = parseInt(limit || "20", 10);
    const pageNum = parseInt(page || "1", 10);
    
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        const error = new Error("Invalid pagination parameters");
        error.statusCode = 400;
        throw error;
    }

    queryOptions.skip = (pageNum - 1) * limitNum;
    queryOptions.take = limitNum;

    const [total, records] = await Promise.all([
        prisma.financialRecord.count({ where: queryOptions.where }),
        prisma.financialRecord.findMany(queryOptions)
    ]);

    return {
        records,
        total,
        page: pageNum,
        limit: limitNum,
    };
};

const restoreRecord = async (id) => {
    return await prisma.financialRecord.update({
        where: { id },
        data: { deletedAt: null },
    });
};

module.exports = {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
    getDeletedRecords,
    restoreRecord,
};
