const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const AppError = require("../utils/AppError");

const createRecord = async (user, data) => {
    return await prisma.financialRecord.create({
        data: {
            ...data,
            amount: parseFloat(data.amount),
            date: new Date(data.date),
            createdByUserId: user.id,
        },
    });
};

const getRecords = async (user, filters = {}) => {
    const { startDate, endDate, category, type, search, page, limit } = filters;

    const where = {
        deletedAt: null,
    };

    // RBAC: Non-admin/analyst users only see their own records
    if (user.role !== "ADMIN" && user.role !== "ANALYST") {
        where.createdByUserId = user.id;
    }

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

    const limitNum = parseInt(limit || "20", 10);
    const pageNum = parseInt(page || "1", 10);
    
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new AppError("Invalid pagination parameters", 400);
    }

    const [total, records] = await Promise.all([
        prisma.financialRecord.count({ where }),
        prisma.financialRecord.findMany({
            where,
            orderBy: { date: "desc" },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        })
    ]);

    return {
        records,
        total,
        page: pageNum,
        limit: limitNum,
    };
};

const getRecordById = async (id, user) => {
    const where = { id, deletedAt: null };
    
    // RBAC: Non-admin/analyst users only see their own records
    if (user.role !== "ADMIN" && user.role !== "ANALYST") {
        where.createdByUserId = user.id;
    }

    const record = await prisma.financialRecord.findFirst({
        where,
    });

    if (!record) {
        throw new AppError("Record not found", 404);
    }

    return record;
};

const updateRecord = async (id, user, data) => {
    // Ensure the record exists and user has permission
    await getRecordById(id, user);

    return await prisma.financialRecord.update({
        where: { id },
        data: {
            ...data,
            amount: data.amount ? parseFloat(data.amount) : undefined,
            date: data.date ? new Date(data.date) : undefined,
        },
    });
};

const deleteRecord = async (id, user) => {
    // Ensure the record exists and user has permission
    await getRecordById(id, user);

    return await prisma.financialRecord.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
};

const getDeletedRecords = async (user, filters = {}) => {
    const { page, limit } = filters;
    const where = {
        deletedAt: { not: null },
    };

    // RBAC: Only admin can see all deleted records, others see none or just their own.
    // For this assessment, Admin sees all, Analysts/Viewers see only their own if they have any.
    if (user.role !== "ADMIN") {
        where.createdByUserId = user.id;
    }

    const limitNum = parseInt(limit || "10", 10);
    const pageNum = parseInt(page || "1", 10);
    
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        throw new AppError("Invalid pagination parameters", 400);
    }

    const [total, records] = await Promise.all([
        prisma.financialRecord.count({ where }),
        prisma.financialRecord.findMany({
            where,
            orderBy: { deletedAt: "desc" },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        })
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
