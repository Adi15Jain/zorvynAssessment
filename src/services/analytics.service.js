const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getSummary = async (userId, filters = {}) => {
    const { startDate, endDate } = filters;
    const where = { createdByUserId: userId, deletedAt: null };
    
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await prisma.financialRecord.findMany({ where });

    const summary = records.reduce(
        (acc, record) => {
            const amount = parseFloat(record.amount);
            if (record.type === "INCOME") {
                acc.totalIncome += amount;
            } else {
                acc.totalExpense += amount;
            }
            return acc;
        },
        { totalIncome: 0, totalExpense: 0 },
    );

    summary.balance = summary.totalIncome - summary.totalExpense;
    summary.transactionCount = records.length;
    return summary;
};

const getCategoryBreakdown = async (userId, filters = {}) => {
    const { startDate, endDate } = filters;
    const where = { createdByUserId: userId, deletedAt: null };
    
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await prisma.financialRecord.findMany({ where });

    const breakdown = records.reduce((acc, record) => {
        const amount = parseFloat(record.amount);
        if (!acc[record.category]) {
            acc[record.category] = { income: 0, expense: 0, total: 0 };
        }
        if (record.type === "INCOME") {
            acc[record.category].income += amount;
        } else {
            acc[record.category].expense += amount;
        }
        acc[record.category].total += amount;
        return acc;
    }, {});

    return Object.entries(breakdown).map(([name, values]) => ({
        category: name,
        ...values,
    }));
};

const getMonthlyTrends = async (userId, filters = {}) => {
    const { startDate, endDate } = filters;
    const where = { createdByUserId: userId, deletedAt: null };
    
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
    } else {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        where.date = { gte: sixMonthsAgo };
    }

    const records = await prisma.financialRecord.findMany({
        where,
        orderBy: { date: "asc" },
    });

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    const trends = records.reduce((acc, record) => {
        const date = new Date(record.date);
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const key = `${month} ${year}`;

        if (!acc[key]) {
            acc[key] = { month: key, income: 0, expense: 0, net: 0 };
        }

        const amount = parseFloat(record.amount);
        if (record.type === "INCOME") {
            acc[key].income += amount;
            acc[key].net += amount;
        } else {
            acc[key].expense += amount;
            acc[key].net -= amount;
        }

        return acc;
    }, {});

    return Object.values(trends);
};

const getRecentRecords = async (userId, limit = 5) => {
    return await prisma.financialRecord.findMany({
        where: { createdByUserId: userId, deletedAt: null },
        orderBy: { date: "desc" },
        take: parseInt(limit, 10),
    });
};

module.exports = {
    getSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getRecentRecords,
};

