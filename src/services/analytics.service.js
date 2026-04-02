const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getSummary = async (userId) => {
    const records = await prisma.financialRecord.findMany({
        where: { createdByUserId: userId, deletedAt: null },
    });

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
    return summary;
};

const getCategoryBreakdown = async (userId) => {
    const records = await prisma.financialRecord.findMany({
        where: { createdByUserId: userId, deletedAt: null },
    });

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

const getMonthlyTrends = async (userId) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const records = await prisma.financialRecord.findMany({
        where: {
            createdByUserId: userId,
            deletedAt: null,
            date: { gte: sixMonthsAgo },
        },
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
            acc[key] = { month: key, income: 0, expense: 0 };
        }

        const amount = parseFloat(record.amount);
        if (record.type === "INCOME") {
            acc[key].income += amount;
        } else {
            acc[key].expense += amount;
        }

        return acc;
    }, {});

    return Object.values(trends);
};

module.exports = {
    getSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
};
