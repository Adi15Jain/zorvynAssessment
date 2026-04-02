const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    console.log("Starting clear down...");
    await prisma.financialRecord.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("Starting seed...");
    const passwordHash = await bcrypt.hash("password123", 10);

    // Users
    const admin = await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin@finance.local",
            passwordHash,
            role: "ADMIN",
            status: "ACTIVE",
        },
    });

    const analyst = await prisma.user.create({
        data: {
            name: "Analyst User",
            email: "analyst@finance.local",
            passwordHash,
            role: "ANALYST",
            status: "ACTIVE",
        },
    });

    const viewer = await prisma.user.create({
        data: {
            name: "Viewer User",
            email: "viewer@finance.local",
            passwordHash,
            role: "VIEWER",
            status: "ACTIVE",
        },
    });

    console.log("Users created with standard password: password123");

    // Categories & Setup
    const categoriesFn = (type) => {
        if (type === "INCOME") return ["salary", "freelance"];
        return ["food", "rent", "utilities"];
    };

    const users = [admin.id, analyst.id, viewer.id];

    const generateRandomDate = () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 6);
        return new Date(
            start.getTime() + Math.random() * (end.getTime() - start.getTime()),
        );
    };

    const records = [];

    for (let i = 0; i < 25; i++) {
        const isIncome = Math.random() > 0.6;
        const type = isIncome ? "INCOME" : "EXPENSE";
        const possibleCategories = categoriesFn(type);
        const category =
            possibleCategories[
                Math.floor(Math.random() * possibleCategories.length)
            ];
        const amount = (Math.random() * 900 + 10).toFixed(2);

        records.push({
            amount: parseFloat(amount),
            type,
            category,
            date: generateRandomDate(),
            notes: `Seed record ${i + 1}`,
            createdByUserId: users[Math.floor(Math.random() * users.length)],
        });
    }

    await prisma.financialRecord.createMany({
        data: records,
    });

    console.log(
        "Created 25 Financial Records across 5 categories and last 6 months.",
    );
    console.log("Seed completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
