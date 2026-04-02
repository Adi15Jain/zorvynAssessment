const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

const prisma = new PrismaClient();

beforeAll(async () => {
    // Using simple db push to reset test db
    execSync("npx prisma db push --force-reset", { stdio: "inherit" });
});

afterAll(async () => {
    await prisma.$disconnect();
});
