const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

describe("Dashboard Analytics Routes", () => {
    let token;
    let userId;

    beforeAll(async () => {
        // Create an admin user for testing
        await request(app).post("/api/auth/register").send({
            name: "Dashboard Tester",
            email: "dashboard_tester@example.com",
            password: "password123"
        });

        const loginRes = await request(app).post("/api/auth/login").send({ 
            email: "dashboard_tester@example.com", 
            password: "password123" 
        });
        token = loginRes.body.data.token;
        userId = loginRes.body.data.user.id;
    });

    afterAll(async () => {
        const emails = ["dashboard_tester@example.com"];
        await prisma.financialRecord.deleteMany({ 
            where: { createdByUser: { email: { in: emails } } } 
        });
        await prisma.user.deleteMany({ where: { email: { in: emails } } });
        await prisma.$disconnect();
    });

    test("GET /api/dashboard/summary", async () => {
        const res = await request(app)
            .get("/api/dashboard/summary")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("totalIncome");
        expect(res.body.data).toHaveProperty("totalExpense");
    });
});
